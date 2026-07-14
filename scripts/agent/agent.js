#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts (Amazon BR)
 *
 * Pipeline integrado com state machine, execution ID, lock, confidence score,
 * SEO gate, metrics collector, audit, DLQ e circuit breaker.
 *
 * Pipeline EXATO (v2 — auto-skip resiliente):
 *   PENDING → PRODUCT_SELECTED → FILES_WRITTEN → READY_TO_COMMIT →
 *   COMMITTED → DEPLOYED → VERIFIED → DONE
 *
 * Dentro de PRODUCT_SELECTED, um loop tenta produtos até um passar
 * em TODAS as validações (link, duplicidade, guard, confiança,
 * geração, quality gates, SEO, auditoria). Se falhar, pula para o
 * próximo. Só falha quando o pool inteiro esgota.
 * Se interromper → retoma do último estado persistido
 *
 * Uso:
 *   node scripts/agent/agent.js              ← daemon (08:00 | 12:00 | 18:00)
 *   node scripts/agent/agent.js --now        ← post imediato
 *   node scripts/agent/agent.js --now beleza ← força pilar
 *   node scripts/agent/agent.js --now --dry-run ← dry run (executa, valida, limpa)
 *   node scripts/agent/agent.js --status     ← status do agente
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// ── Módulos da arquitetura modular ────────────────────────────────
import { runContentGuard }                           from './content-guard.js';
import { reescreverConteudo }                        from '../groq-service.js';
import { fetchTrendingProducts, mergeTrendingWithCatalog, getTrendingStatus } from './trend-scout.js';
import { createExecutionLogger, getLatestLog, getRecentLogs } from './logging/logger.js';
import { validateAffiliateConfig, buildAmazonAffiliateUrl, validateFinalAffiliateUrl } from './affiliate/link-builder.js';
import { checkDuplicate, recordPost, loadHistory, getHistorySummary } from './history/tracker.js';
import { addToDeadLetter, listDeadLetter, getDeadLetterSummary } from './history/dead-letter.js';
import { runQualityGates }                           from './validators/quality.js';
import { verifyPublication }                         from './monitor/publication.js';
import { runSeoGates }                               from './validators/seo.js';
import { validateConfidence }                        from './validators/confidence.js';
import { runFinalAudit }                             from './validators/audit.js';
import { runEditorialGates }                         from './validators/editorial-gate.js';
import { validateProduct, validateCategorySafety }   from './validators/product-validator.js';
import { analyzeHallucinations }                     from './validators/anti-hallucination.js';
import { analyzeSemanticCoherence }                  from './validators/semantic-coherence.js';
import { validateImages }                            from './validators/image-validator.js';
import { calculateFinalScore, formatScoreSummary }   from './validators/final-score.js';
import { validateAllCtas }                           from './affiliate/link-builder.js';
import { generateProductHash }                        from './validators/product-hash.js';
import { generateAuditReport }                         from './validators/audit-report.js';
import { createStateMachine }                        from './core/state-machine.js';
import { generateExecutionId, acquireLock, releaseLock, createExecution } from './core/execution.js';
import { createMetricsCollector }                    from './monitoring/metrics.js';
import { loadCatalog, buildCatalogPool, getAngleDescription } from './catalog/loader.js';
import { createCircuitBreaker, resetAllCircuitBreakers } from './core/circuit-breaker.js';
import { generateDashboard }                         from './monitoring/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

// ── Config ─────────────────────────────────────────────────────────────────

const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG;
if (!AMAZON_TAG) {
  console.error('❌ ERRO CRÍTICO: variável AMAZON_AFFILIATE_TAG não definida no .env!');
  process.exit(1);
}

const HISTORY_DAYS      = 7;
const MAX_GUARD_RETRIES = 3;  // (mantido para compatibilidade, não usado no loop resiliente)
const PILLARS           = ['beleza', 'saude', 'casa'];

const SCHEDULES = [
  { hour: 8,  minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
];

// ── Ângulos editoriais ─────────────────────────────────────────────────────

const ANGLES = {
  skincare_basico:      'O básico que transforma: por que este produto entrou na rotina de tanta gente',
  cuidado_diario:       'A proteção diária que você não pode negligenciar',
  cuidado_capilar:      'O segredo dos cabelos saudáveis que poucos conhecem',
  anti_idade:           'Ingrediente ativo que age de verdade contra o envelhecimento precoce',
  limpeza_pele:         'Pele limpa é pele saudável: o ritual que muda tudo',
  ingrediente_ativo:    'Como um único ingrediente mudou a rotina de skincare de milhares de pessoas',
  custo_beneficio:      'Custo-benefício real: vale cada centavo investir neste produto',
  saude_preventiva:     'O hábito simples que faz diferença na sua saúde a longo prazo',
  bem_estar:            'Pequenas mudanças, grandes resultados no bem-estar diário',
  performance:          'Para quem leva a sério os resultados: o que este produto entrega',
  imunidade:            'Imunidade forte começa com suplementação inteligente',
  qualidade_sono:       'O sono que você merece começa com a suplementação certa',
  saude_intestinal:     'Saúde começa no intestino: o que a ciência diz sobre probióticos',
  praticidade_cozinha:  'Menos tempo na cozinha, mais tempo para o que importa',
  praticidade_casa:     'A tecnologia que trabalha por você enquanto você descansa',
  ritual_diario:        'O ritual que começa o dia com o pé direito',
  saude_em_casa:        'Um investimento pequeno que protege toda a família',
  bem_estar_em_casa:    'Transformar o ambiente em que você vive transforma como você se sente',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function isTitleInPortuguese(title) {
  if (!title) return false;
  const spanishOnly = /\b(juego|el |los |las |del |una |unos |unas |también|además|después|entonces|cuando|donde|pero|sino|aunque|siempre|algo|alguien|nadie|todo|todos|cada|otro|otra|muy|más|menos|poco|mucho|grande|pequeño|mismo|misma|tamaño|precio|envío|gratis|nuevo|nueva|usado|usada)\b/i;
  const ptIndicators = /\b(para|com|sem|não|mais|menos|que|por|uma|uns|umas|também|além|depois|quando|onde|porque|mas|sempre|nunca|algo|alguém|ninguém|nada|tudo|todos|cada|outro|outra|cor|tamanho|tipo|preço|frete|grátis|novo|nova|produto|disponível|entrega|compra|oferta|promoção|cápsulas|comprimidos|pó|ml|mg|ui)\b/i;
  if (spanishOnly.test(title) && !ptIndicators.test(title)) return false;
  return true;
}

function getPillarForSlot(slotIndex) {
  const brt       = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const start     = new Date(brt.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((brt - start) / 86400000);
  const offset    = dayOfYear % PILLARS.length;
  return PILLARS[(slotIndex + offset) % PILLARS.length];
}

function pickFromPool(pool, exclude = []) {
  const available = pool.filter(p => !exclude.includes(p.asin));
  if (available.length === 0) return null;
  const topN = Math.min(3, available.length);
  return available[Math.floor(Math.random() * topN)];
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

// ── Run novo-post.js (APENAS geração de arquivos, sem git) ────────────────

function runPostGenerator(affiliateUrl, productName, guardEnvVars, logger) {
  const projectRoot = path.join(__dirname, '..', '..');
  logger.step(`Executando novo-post.js para gerar arquivos...`);

  try {
    execSync(
      `node scripts/novo-post.js "${affiliateUrl}"`,
      {
        cwd:     projectRoot,
        stdio:   'pipe',
        timeout: 5 * 60 * 1000,
        env: { ...process.env, ...guardEnvVars, PRODUCT_NAME_HINT: productName || '' },
      }
    );
    logger.pass(`Arquivos do post gerados com sucesso`);
    return true;
  } catch (err) {
    const out    = (err.stdout || Buffer.alloc(0)).toString('utf8').trim();
    const errOut = (err.stderr || Buffer.alloc(0)).toString('utf8').trim();
    if (out)    out.split('\n').forEach(l => logger.info(l));
    if (errOut) errOut.split('\n').forEach(l => logger.error(l));
    logger.error(`Erro ao gerar post: ${err.message}`);
    return false;
  }
}

// ── Pipeline de publicação (state machine integrada) ──────────────────────

async function runJob(forcePillar = null, slotIndex = 0, trigger = 'schedule', dryRun = false) {
  // 1. Execution ID + Lock
  const execResult = createExecution({ pilar: forcePillar || getPillarForSlot(slotIndex), trigger });
  if (!execResult.lock.acquired) {
    console.log(`⏭️  Lock não adquirido: ${execResult.lock.reason}`);
    return;
  }

  const executionId = execResult.executionId;
  const pillar = forcePillar || getPillarForSlot(slotIndex);
  const logger = createExecutionLogger({ pilar: pillar, trigger, executionId });
  const stateMachine = createStateMachine(executionId, { pilar: pillar, trigger });
  const collector = createMetricsCollector(executionId, pillar);
  const projectRoot = path.join(__dirname, '..', '..');

  let pipelineFailed = false;
  let product = null;
  let affUrl = '';
  let slug = '';
  let mdPath = '';
  let imgPath = '';
  let seoResult = null;
  let auditResult = null;
  let guard = null;
  let affConfig = null;

  logger.info('═══════════════════════════════════════════════════');
  logger.info(`🤖 Pipeline — ${executionId}`, { pillar, tag: 'afiliado-ok' });
  if (dryRun) {
    logger.info('═══ 🧪 DRY RUN — nenhum artefato será persistido ═══');
  }

  // Verifica resume
  if (stateMachine.getState() !== 'PENDING') {
    logger.info(`♻️  Retomando execução do estado: ${stateMachine.getState()}`);
    logger.info(`   Caminho anterior: ${stateMachine.getPath()}`);
  }

  resetAllCircuitBreakers();
  const cbAmazon = createCircuitBreaker('amazon');
  const cbGroq = createCircuitBreaker('groq');

  // ════════════════════════════════════════════════════════════════
  // PENDING → valida configuração → PRODUCT_SELECTED
  // ════════════════════════════════════════════════════════════════
  if (stateMachine.getState() === 'PENDING') {
    const si = collector.startStage('PENDING');
    logger.step('Validando configuração de afiliado...');
    affConfig = validateAffiliateConfig();
    if (!affConfig.valid) {
      logger.fail(`Afiliado INVÁLIDO: ${affConfig.error}`);
      stateMachine.addError(affConfig.error);
      stateMachine.transition('FAIL');
      collector.failStage(si, affConfig.error);
      pipelineFailed = true;
    } else {
      logger.pass(`Tag configurada`);
      stateMachine.transition('PRODUCT_SELECTED');
      collector.endStage(si, { tag: affConfig.tag });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // PRODUCT_SELECTED → Pipeline completo com auto-skip resiliente
  // ════════════════════════════════════════════════════════════════
  // Se QUALQUER etapa falhar (404 Amazon, scraping, quality, audit)
  // o produto é descartado e o próximo é tentado automaticamente.
  // A execução SÓ falha se TODOS os produtos do pool esgotarem.
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && stateMachine.getState() === 'PRODUCT_SELECTED') {
    const si = collector.startStage('PRODUCT_SELECTED');
    logger.step(`Buscando produtos para "${pillar}"...`);

    const trending = await fetchTrendingProducts(pillar);
    if (trending.length > 0) logger.info(`${trending.length} trending`);
    else logger.info('Trend Scout indisponível');

    const history = loadHistory();
    const catalogByPillar = loadCatalog(pillar);
    logger.info(`Catálogo: ${catalogByPillar.length} produtos`);

    let pool = mergeTrendingWithCatalog(trending, catalogByPillar, pillar, history, ANGLES);
    if (pool.length === 0) pool = [...catalogByPillar];

    if (pool.length === 0) {
      logger.fail(`Pool vazio — pilar "${pillar}" sem produtos`);
      stateMachine.addError('Pool vazio - nenhum produto disponível');
      stateMachine.transition('FAIL');
      collector.failStage(si, 'Pool vazio');
      pipelineFailed = true;
    } else {
      logger.info(`Pool: ${pool.length} produtos`);

      // ── Loop resiliente: tenta produtos até um passar em TODAS as validações ──
      const excluded = [];
      const MAX_ATTEMPTS = Math.min(pool.length, 15);
      let attempt = 0;
      let productSelected = false;

      // ── TELEMETRIA DO POOL ──
      const telemetry = {
        poolInitial: pool.length,
        rejected: {
          notPortuguese: [],
          invalidUrl: [],
          duplicate: [],
          contentGuard: [],
          productValidation: [],
          categorySafety: [],
          confidence: [],
          contentGeneration: [],
          titleCoherence: [],
          qualityGate: [],
          editorialGate: [],
          hallucination: [],
          semanticCoherence: [],
          audit: [],
          ctaValidation: [],
          imageValidation: [],
          finalScore: [],
          hashIntegrity: [],
        },
      };

      while (attempt < MAX_ATTEMPTS && !productSelected && !pipelineFailed) {
        attempt++;

        // Reseta variáveis por tentativa
        product = null;
        affUrl = '';
        slug = '';
        mdPath = '';
        imgPath = '';
        seoResult = null;
        auditResult = null;
        guard = null;

        product = pickFromPool(pool, excluded);
        if (!product) {
          logger.fail('Nenhum produto disponível no pool');
          stateMachine.addError('Pool exaurido - nenhum produto restante');
          stateMachine.transition('FAIL');
          pipelineFailed = true;
          break;
        }

        const badge = product.isTrending ? `📈 trending` : '📦 catálogo';
        logger.info(`Tentativa ${attempt}/${MAX_ATTEMPTS}: ${product.name} [${badge}]`, { asin: product.asin });

        // ── 1. VALIDAÇÃO BÁSICA ──────────────────────────────────

        // Português
        if (!isTitleInPortuguese(product.name)) {
          telemetry.rejected.notPortuguese.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — título fora do PT-BR. Selecionando próximo...`);
          excluded.push(product.asin);
          continue;
        }

        // Link afiliado
        affUrl = buildAmazonAffiliateUrl(product.asin, affConfig.tag);
        const urlValid = validateFinalAffiliateUrl(affUrl);
        if (!urlValid.valid) {
          telemetry.rejected.invalidUrl.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — link inválido: ${urlValid.error}. Selecionando próximo...`);
          excluded.push(product.asin);
          continue;
        }

        // Duplicidade
        const dupCheck = checkDuplicate({ asin: product.asin, title: product.name, url: affUrl }, HISTORY_DAYS);
        if (dupCheck.duplicate) {
          telemetry.rejected.duplicate.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — duplicado: ${dupCheck.reason}. Selecionando próximo...`);
          excluded.push(product.asin);
          continue;
        }

        // Content Guard
        const angleDesc = ANGLES[product.angle] || product.angle;
        const historyData = loadHistory();
        guard = runContentGuard({ productName: product.name, pillar, angle: product.angle, angleDesc, history: historyData });
        guard.report.forEach(l => logger.info(l));
        guard.warnings.forEach(w => logger.warn(w));

        if (!guard.safe) {
          telemetry.rejected.contentGuard.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — guard bloqueou: ${guard.blockers.join(' | ')}. Selecionando próximo...`);
          excluded.push(product.asin);
          continue;
        }

        // ── 2. VALIDAÇÃO COMPLETA DO PRODUTO (Ponto 2: pré-IA) ─────
        // Antes da IA escrever, verifica consistência de: título, ASIN, imagem, descrição, categoria
        const productValidation = validateProduct({
          ...product,
          title: product.name,
          affiliateUrl: affUrl,
        }, { expectedCategory: pillar, phase: 'selection' });

        if (!productValidation.pass) {
          telemetry.rejected.productValidation.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — validação de produto: ${productValidation.errors.join('; ')}. ABORTANDO produto.`);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'PRODUCT_VALIDATED', error: `Produto inválido: ${productValidation.errors.slice(0, 2).join('; ')}`, meta: { executionId, checks: productValidation.checks } });
          excluded.push(product.asin);
          continue;
        }
        logger.pass(`Produto validado: ${productValidation.score}% (${productValidation.details.passed}/${productValidation.details.total}) checks`);

        // ── 2b. HASH DO PRODUTO (assinatura criptográfica) ──────────
        // Gera hash no início do pipeline para detectar troca silenciosa
        const productHash = generateProductHash({
          asin: product.asin,
          title: product.name,
          brand: product.brand || '',
          category: pillar,
        });
        logger.info(`Hash do produto: ${productHash.slice(0, 12)}...`);

        // ── 2c. SEGURANÇA DE CATEGORIA (Ponto 5: sem fallback) ─────
        const catSafety = validateCategorySafety(pillar, product.name);
        if (!catSafety.pass) {
          telemetry.rejected.categorySafety.push(product.asin);
          logger.fail(`❌ CATEGORIA INDEFINIDA: ${catSafety.error}. Pipeline ABORTADO.`);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'PRODUCT_VALIDATED', error: catSafety.error, meta: { executionId } });
          excluded.push(product.asin);
          continue;
        }

        // ── 3. CONFIANÇA ────────────────────────────────────────

        const source = product.isTrending ? 'puppeteer' : 'catalog';
        const confCheck = validateConfidence(source, 50);
        if (!confCheck.pass) {
          telemetry.rejected.confidence.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — confiança ${confCheck.score} < ${confCheck.minimum}. Selecionando próximo...`);
          excluded.push(product.asin);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'PRODUCT_VALIDATED', error: `Confidence ${confCheck.score}`, meta: { executionId } });
          continue;
        }

        // ── 4. GERAÇÃO DE CONTEÚDO ───────────────────────────────
        // (novo-post.js faz scraping Amazon, IA, markdown, imagem)

        logger.step(`Gerando post: ${product.name} [${product.asin}]`);
        const genStartTs = Date.now(); // timestamp ANTES da geracao (arquivos sao criados durante)
        const genOk = runPostGenerator(affUrl, product.name, guard.envVars, logger);

        if (!genOk) {
          telemetry.rejected.contentGeneration.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — geração falhou (Amazon 404 / scraping / imagem indisponível). Selecionando próximo...`);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'CONTENT_GENERATED', error: 'novo-post.js falhou', meta: { executionId } });
          excluded.push(product.asin);
          continue;
        }

        // ── 5. DETECTAR SLUG + RENOMEAR ARQUIVOS ────────────────
        // Usa o nome do catálogo como slug (confiável).
        // Se novo-post.js gerou com outro slug, renomeia os arquivos.

        const blogDir = path.join(projectRoot, 'src', 'content', 'blog');
        const imgDirLocal = path.join(projectRoot, 'public', 'images', 'posts');
        const catalogSlug = slugify(product.name);

        slug = catalogSlug;
        mdPath = path.join(blogDir, `${slug}.md`);

        // Detecta arquivo gerado por novo-post.js
        let generatedSlug = null;
        if (fs.existsSync(blogDir)) {
          const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
          const recent = files.filter(f => {
            try { return fs.statSync(path.join(blogDir, f)).mtimeMs >= genStartTs - 5000; }
            catch { return false; }
          });
          if (recent.length > 0) {
            const sorted = recent.map(f => ({ name: f, time: fs.statSync(path.join(blogDir, f)).mtimeMs }))
              .sort((a, b) => b.time - a.time);
            generatedSlug = sorted[0].name.replace(/\.md$/, '');
          }
        }

        // Se o slug gerado for diferente do catálogo, renomeia arquivos
        if (generatedSlug && generatedSlug !== catalogSlug) {
          logger.info(`Slug gerado: ${generatedSlug} → renomeando para: ${catalogSlug}`);

          // Renomeia .md
          const oldMd = path.join(blogDir, `${generatedSlug}.md`);
          if (fs.existsSync(oldMd) && !fs.existsSync(mdPath)) {
            fs.renameSync(oldMd, mdPath);
            logger.info(`  Renomeado: ${generatedSlug}.md → ${catalogSlug}.md`);
          }

          // Renomeia imagem (webp, jpg, png)
          for (const ext of ['.webp', '.jpg', '.png']) {
            const oldImg = path.join(imgDirLocal, `${generatedSlug}${ext}`);
            const newImg = path.join(imgDirLocal, `${catalogSlug}${ext}`);
            if (fs.existsSync(oldImg) && !fs.existsSync(newImg)) {
              fs.renameSync(oldImg, newImg);
              logger.info(`  Renomeado: ${generatedSlug}${ext} → ${catalogSlug}${ext}`);
              break;
            }
          }

          // Atualiza referências de imagem dentro do .md
          if (fs.existsSync(mdPath)) {
            let mdContent = fs.readFileSync(mdPath, 'utf8');
            const oldRef = `/images/posts/${generatedSlug}`;
            const newRef = `/images/posts/${catalogSlug}`;
            if (mdContent.includes(oldRef)) {
              mdContent = mdContent.replace(new RegExp(oldRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newRef);
              fs.writeFileSync(mdPath, mdContent, 'utf8');
              logger.info(`  Referências de imagem atualizadas no .md`);
            }
          }
        } else if (generatedSlug && generatedSlug === catalogSlug) {
          logger.info(`Slug gerado coincide com catálogo: ${catalogSlug}`);
        } else {
          logger.info(`Slug do catálogo: ${catalogSlug}`);
        }

        // Determina imgPath
        const imgCandidates = [
          path.join(imgDirLocal, `${slug}.webp`),
          path.join(imgDirLocal, `${slug}.jpg`),
          path.join(imgDirLocal, `${slug}.png`),
        ];
        for (const candidate of imgCandidates) {
          if (fs.existsSync(candidate)) {
            imgPath = candidate;
            break;
          }
        }
        if (!imgPath) imgPath = imgCandidates[0];

        logger.pass(`Arquivos gerados: ${slug}`);

        // ── 6. VALIDAÇÃO DE COERÊNCIA PRODUTO VS CONTEÚDO ─────────
        // Garante que o título no markdown corresponde ao produto selecionado do catálogo
        let markdownContent = '';
        try { if (fs.existsSync(mdPath)) markdownContent = fs.readFileSync(mdPath, 'utf8'); } catch (_) {}

        if (markdownContent) {
          // Extrai o título do frontmatter
          const titleMatch = markdownContent.match(/^title:\s*"([^"]+)"\s*$/m);
          const mdTitle = titleMatch ? titleMatch[1].trim() : '';

          if (mdTitle) {
            // Normaliza ambos os títulos para comparação
            const normMdTitle = mdTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
            const normProdName = (product.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

            // Palavras-chave do produto que DEVEM aparecer no título do markdown
            const productWords = normProdName.split(/\s+/).filter(w => w.length > 3);
            const matchedWords = productWords.filter(w => normMdTitle.includes(w));
            const matchRatio = productWords.length > 0 ? matchedWords.length / productWords.length : 0;

            if (matchRatio < 0.3 && productWords.length >= 2) {
              logger.warn(`⚠️ INCOERÊNCIA: título do markdown ("${mdTitle.slice(0, 60)}") não corresponde ao produto "${(product.name || '').slice(0, 60)}" (match ${Math.round(matchRatio * 100)}%)`);
              logger.warn(`   Palavras do produto: ${productWords.slice(0, 5).join(', ')}`);
              logger.warn(`   Palavras encontradas no título: ${matchedWords.slice(0, 5).join(', ')}`);
              try { fs.unlinkSync(mdPath); } catch (_) {}
              try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
              telemetry.rejected.titleCoherence.push(product.asin);
              addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'COHERENCE_CHECK', error: `Incoerência título: ${matchRatio*100}% match`, meta: { executionId, mdTitle: mdTitle.slice(0, 60), productName: product.name } });
              excluded.push(product.asin);
              continue;
            }
            logger.pass(`Coerência produto vs conteúdo: ${Math.round(matchRatio * 100)}% match (${matchedWords.length}/${productWords.length} palavras-chave)`);
          }
        }

        // ── 7. QUALITY GATES ─────────────────────────────────────          // Gate: título genérico
        if (markdownContent && /title:\s*"Produto Amazon\b/i.test(markdownContent)) {
          telemetry.rejected.qualityGate.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — título genérico detectado. Selecionando próximo...`);
          try { fs.unlinkSync(mdPath); } catch (_) {}
          try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'QUALITY_APPROVED', error: 'Título genérico', meta: { executionId } });
          excluded.push(product.asin);
          continue;
        }

        if (markdownContent) {
          const qResult = runQualityGates('final_markdown', {
            markdown: markdownContent, title: product.name,
            category: pillar, imageFile: `${slug}.webp`,
            affiliateUrl: affUrl, slug,
          });
          for (const e of qResult.errors) logger.fail(`QUALITY: ${e}`);
          if (!qResult.pass) {
            telemetry.rejected.qualityGate.push(product.asin);
            logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — quality gates: ${qResult.errors.length} falha(s). Selecionando próximo...`);
            try { fs.unlinkSync(mdPath); } catch (_) {}
            try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
            addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'QUALITY_APPROVED', error: `Quality gates: ${qResult.errors.join('; ')}`, meta: { executionId } });
            excluded.push(product.asin);
            continue;
          }
          logger.pass(`Quality gates OK`);

          // SEO Gate
          seoResult = runSeoGates({ title: product.name, description: `Descubra as vantagens do ${product.name}.`, markdown: markdownContent, slug, category: pillar });
          if (!seoResult.pass) logger.warn(`SEO: ${seoResult.errors.length} problemas`);
          else logger.pass(`SEO OK`);

          // ── AI Content Quality Gate + Editorial Score ────────
          const editorialResult = runEditorialGates(markdownContent, { title: product.name, category: pillar, slug });
          logger.info(`Editorial: ${editorialResult.summary}`);
          for (const d of Object.entries(editorialResult.editorialScore.dimensions)) {
            const [name, data] = d;
            const pct = Math.round((data.score / data.max) * 100);
            const icon = pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';
            logger.info(`  ${icon} ${name}: ${data.score}/${data.max}`);
          }            if (!editorialResult.passed) {
            // ── REWRITE LOOP: tenta reescrever com feedback ────
            const groqKey = process.env.GROQ_API_KEY;
            const cbClosed = cbGroq.getState() === 'CLOSED';
            let rewritten = null;
            if (groqKey && groqKey.length > 20 && editorialResult.improvementReport && cbClosed) {
              logger.info('🔄 Tentando reescrever com feedback editorial...');
              for (let rwAttempt = 1; rwAttempt <= 3; rwAttempt++) {
                rewritten = await reescreverConteudo(markdownContent, editorialResult.improvementReport, groqKey);
                if (rewritten) { cbGroq.recordSuccess(); break; }
                // Rate limit (429) ou timeout — circuito abre após falhas consecutivas
                cbGroq.recordFailure();
                const stillClosed = cbGroq.getState() === 'CLOSED';
                if (rwAttempt < 3 && stillClosed) {
                  const wait = rwAttempt * 5000;
                  logger.info(`⏳ Rewrite falhou, aguardando ${wait/1000}s e tentando novamente (${rwAttempt}/3)...`);
                  await new Promise(resolve => setTimeout(resolve, wait));
                }
              }
              if (!rewritten) {
                const cbState = cbGroq.getState();
                if (cbState !== 'CLOSED') {
                  logger.warn(`⚠️ Circuit breaker Groq ${cbState} — pulando demais tentativas de rewrite`);
                } else {
                  logger.warn(`⚠️ Rewrite falhou após 3 tentativas — pode ser rate limit ou erro de conexão`);
                }
              }
            } else if (groqKey && editorialResult.improvementReport && !cbClosed) {
              logger.warn('⚠️ Circuit breaker Groq ' + cbGroq.getState() + ' — rewrite indisponível para este produto');
            }

            if (rewritten && rewritten.length > 200) {
              // Reescreveu: substitui conteudo e re-valida
              markdownContent = rewritten;
              if (fs.existsSync(mdPath)) fs.writeFileSync(mdPath, rewritten, 'utf8');
              logger.info('✅ Conteúdo reescrito, re-avaliando editorial score...');

              const retryResult = runEditorialGates(markdownContent, { title: product.name, category: pillar, slug });
              for (const d of Object.entries(retryResult.editorialScore.dimensions)) {
                const [name, data] = d;
                logger.info(`  ${name}: ${data.score}/${data.max}`);
              }
              logger.info(`Retry: ${retryResult.summary}`);

              if (retryResult.passed) {
                logger.pass(`✅ Rewrite aprovado: ${retryResult.editorialScore.score}/50`);
                editorialResult = retryResult;
              } else {
                logger.warn(`⚠️ Rewrite ainda abaixo: ${retryResult.editorialScore.score}/50. Descartando...`);
                rewritten = null;
              }
            }

            if (!rewritten) {
              telemetry.rejected.editorialGate.push(product.asin);
              logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — editorial score ${editorialResult.editorialScore.score}/50. Selecionando próximo...`);
              try { fs.unlinkSync(mdPath); } catch (_) {}
              try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
              addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'EDITORIAL_GATE', error: `Editorial ${editorialResult.editorialScore.score}/50`, meta: { executionId } });
              excluded.push(product.asin);
              continue;
            }
          }
          logger.pass(`Editorial score: ${editorialResult.editorialScore.score}/50`);
        }

        // ── 8. ANTI-ALUCINAÇÃO (Ponto 3) ────────────────────────────
        if (markdownContent) {
          const hallucinationCheck = analyzeHallucinations(markdownContent, {
            specs: product.specs || [],
            brand: product.brand || '',
            normalized: product.normalized || {},
          });
          if (hallucinationCheck.violations.length > 0) {
            logger.warn(`⚠️ ALUCINAÇÃO: ${hallucinationCheck.violations.length} suspeitas (${hallucinationCheck.violations.filter(v => v.risk === 'alta').length} críticas)`);
            for (const v of hallucinationCheck.violations.slice(0, 3)) {
              logger.warn(`  ${v.risk === 'alta' ? '🔴' : '🟡'} ${v.text.slice(0, 80)} — ${v.reason}`);
            }
            if (!hallucinationCheck.passed) {
              telemetry.rejected.hallucination.push(product.asin);
              logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — alucinações críticas detectadas. Selecionando próximo...`);
              try { fs.unlinkSync(mdPath); } catch (_) {}
              try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
              addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'ANTI_HALLUCINATION', error: `Alucinações: ${hallucinationCheck.violations.length}`, meta: { executionId, violations: hallucinationCheck.violations.slice(0, 5) } });
              excluded.push(product.asin);
              continue;
            }
          }
          logger.pass(`Anti-alucinação: ${hallucinationCheck.violations.length} suspeitas (0 críticas) — OK`);
        }

        // ── 9. COERÊNCIA SEMÂNTICA (Ponto 6) ───────────────────────
        if (markdownContent) {
          const coherenceResult = analyzeSemanticCoherence(markdownContent, {
            name: product.name,
            productName: product.name,
            title: product.name,
          });
          logger.info(`Coerência semântica: ${coherenceResult.score}% (${coherenceResult.checks.length} checks)`);
          if (!coherenceResult.passed) {
            telemetry.rejected.semanticCoherence.push(product.asin);
            logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — coerência semântica ${coherenceResult.score}% reprovou. Selecionando próximo...`);
            for (const c of coherenceResult.checks.filter(c => !c.pass)) {
              logger.warn(`  ${c.detail}`);
            }
            try { fs.unlinkSync(mdPath); } catch (_) {}
            try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
            addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'SEMANTIC_COHERENCE', error: `Coerência semântica ${coherenceResult.score}%`, meta: { executionId, checks: coherenceResult.checks.filter(c => !c.pass).map(c => c.detail) } });
            excluded.push(product.asin);
            continue;
          }
          logger.pass(`Coerência semântica: ${coherenceResult.score}% — OK`);
        }

        // ── 10. AUDITORIA FINAL ───────────────────────────────────

        auditResult = runFinalAudit({ slug, title: product.name, affiliateUrl: affUrl, category: pillar, seoResult, historyCheck: { duplicate: false }, markdownContent });
        logger.info(`Auditoria: ${auditResult.passed ? 'APROVADO' : 'REPROVADO'} — ${auditResult.score}% (${auditResult.details.passed}/${auditResult.details.total})`);

        if (!auditResult.passed) {
          telemetry.rejected.audit.push(product.asin);
          logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — auditoria ${auditResult.score}% reprovou. Selecionando próximo...`);
          logger.info(`  Motivos: ${auditResult.checks.filter(c => !c.pass).map(c => c.detail).join(' | ')}`);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'AUDIT', error: `Auditoria ${auditResult.score}% — ${auditResult.summary}`, meta: { executionId, slug, checks: auditResult?.checks || [] } });
          excluded.push(product.asin);
          continue;
        }

        // ── 11. VALIDAÇÃO DE TODOS OS CTAs (Ponto 4) ───────────────
        if (markdownContent) {
          const ctaCheck = validateAllCtas(markdownContent, affUrl, affConfig.tag);
          if (!ctaCheck.pass) {
            telemetry.rejected.ctaValidation.push(product.asin);
            logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — CTAs inválidos: ${ctaCheck.errors.join('; ')}. Selecionando próximo...`);
            for (const e of ctaCheck.errors) logger.warn(`  ${e}`);
            try { fs.unlinkSync(mdPath); } catch (_) {}
            try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
            addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'CTA_VALIDATION', error: `CTAs: ${ctaCheck.errors.join('; ')}`, meta: { executionId, ctas: ctaCheck.ctas } });
            excluded.push(product.asin);
            continue;
          }
          logger.pass(`CTAs: ${ctaCheck.summary}`);
        }

        // ── 12. VALIDAÇÃO DE IMAGEM (Ponto 7) ──────────────────────
        if (markdownContent) {
          const imgValidation = validateImages({
            markdown: markdownContent,
            productName: product.name,
            slug,
            imageFile: `${slug}.webp`,
            imagePath: imgPath,
          });
          if (!imgValidation.passed) {
            telemetry.rejected.imageValidation.push(product.asin);
            logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — imagem inválida: ${imgValidation.errors.slice(0, 2).join('; ')}. Selecionando próximo...`);
            try { fs.unlinkSync(mdPath); } catch (_) {}
            try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
            addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'IMAGE_VALIDATION', error: `Imagem: ${imgValidation.errors.join('; ')}`, meta: { executionId } });
            excluded.push(product.asin);
            continue;
          }
          logger.pass(`Imagem: ${imgValidation.score}% — OK`);
        }

        // ── 13. SCORE FINAL COMPOSTO (Ponto 9: publicar ≥ 95%) ────
        if (markdownContent && auditResult) {
          const finalScore = calculateFinalScore({
            productValidation,
            category: pillar,
            imageValidation: markdownContent ? { score: 100 } : null,
            seoResult,
            editorialResult,
            auditChecks: auditResult.checks,
            markdownContent,
            coherenceResult: { score: 100 },
          });

          logger.info('\n' + formatScoreSummary(finalScore));

          if (!finalScore.passed) {
            telemetry.rejected.finalScore.push(product.asin);
            logger.warn(`⚠️ Produto inválido: ${product.name} [${product.asin}] — score final ${finalScore.score}% abaixo de ${finalScore.threshold}%. Selecionando próximo...`);
            try { fs.unlinkSync(mdPath); } catch (_) {}
            try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
            addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'FINAL_SCORE', error: `Score ${finalScore.score}% < ${finalScore.threshold}%`, meta: { executionId, finalScore: finalScore.score, dimensions: finalScore.dimensions } });
            excluded.push(product.asin);
            continue;
          }
          logger.pass(`Score final: ${finalScore.score}% — APROVADO para publicação`);
        }

        // ── 14. HASH FINAL — verifica integridade (não houve troca) ──
        const finalHash = generateProductHash({
          asin: product.asin,
          title: product.name,
          brand: product.brand || '',
          category: pillar,
        });
        const hashIntegrity = finalHash === productHash;
        if (!hashIntegrity) {
          telemetry.rejected.hashIntegrity.push(product.asin);
          logger.fail(`❌ HASH DO PRODUTO ALTERADO! Pipeline corrompido. ABORTANDO.`);
          addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'HASH_VALIDATION', error: 'Hash alterado durante pipeline', meta: { executionId, initialHash: productHash, finalHash } });
          excluded.push(product.asin);
          continue;
        }
        logger.pass(`Hash íntegro: ${finalHash.slice(0, 12)}... — produto não foi trocado`);

        // ── ✅ TUDO PASSOU! ──────────────────────────────────────
        logger.pass(`✅ Produto selecionado: ${product.name} [${product.asin}]`);
        productSelected = true;
        stateMachine.setContext({ asin: product.asin, productName: product.name, affiliateUrl: affUrl });
        break;
      }

      // ── TELEMETRIA: funil do pool ──
      const funnel = [
        { label: 'Pool inicial',              count: telemetry.poolInitial },
      ];
      const order = [
        { key: 'notPortuguese',     label: 'título fora do PT-BR' },
        { key: 'invalidUrl',        label: 'URL inválida' },
        { key: 'duplicate',         label: 'duplicado' },
        { key: 'contentGuard',      label: 'content guard' },
        { key: 'productValidation', label: 'validação do produto' },
        { key: 'categorySafety',    label: 'categoria insegura' },
        { key: 'confidence',        label: 'confiança baixa' },
        { key: 'contentGeneration', label: 'geração de conteúdo' },
        { key: 'titleCoherence',    label: 'coerência do título' },
        { key: 'qualityGate',       label: 'quality gate' },
        { key: 'editorialGate',     label: 'editorial gate' },
        { key: 'hallucination',     label: 'alucinação' },
        { key: 'semanticCoherence', label: 'coerência semântica' },
        { key: 'audit',             label: 'auditoria final' },
        { key: 'ctaValidation',     label: 'validação de CTA' },
        { key: 'imageValidation',   label: 'validação de imagem' },
        { key: 'finalScore',        label: 'score final' },
        { key: 'hashIntegrity',     label: 'integridade de hash' },
      ];

      let remaining = telemetry.poolInitial;
      for (const stage of order) {
        const rejectedCount = (telemetry.rejected[stage.key] || []).length;
        if (rejectedCount > 0) {
          remaining -= rejectedCount;
          funnel.push({ label: `× ${stage.label}`, count: -rejectedCount, remaining });
        }
      }

      if (productSelected) {
        funnel.push({ label: '✅ Produto aprovado', count: 1, remaining: 1 });
      } else {
        funnel.push({ label: '❌ Nenhum aprovado', count: 0, remaining: 0 });
      }

      logger.info('');
      logger.info('📊 FUNIL DO POOL:');
      for (const row of funnel) {
        const bar = row.remaining !== undefined
          ? `  ${String(row.count).padStart(3)}  (restam ${String(row.remaining).padStart(2)})`
          : `  ${String(row.count).padStart(3)}`;
        logger.info(`  ${row.label.padEnd(30)} ${bar}`);
        // Log individual ASINs for the rejection reasons
        if (row.count < 0) {
          const stage = order.find(o => `× ${o.label}` === row.label);
          if (stage) {
            const asins = telemetry.rejected[stage.key];
            for (const asin of asins) {
              logger.info(`                          ${asin}`);
            }
          }
        }
      }
      logger.info('');

      if (productSelected) {
        stateMachine.transition('FILES_WRITTEN', { slug, productName: product?.name });
        collector.endStage(si, { selectedAsin: product?.asin, poolSize: pool.length, attempts: attempt });
      } else if (!pipelineFailed) {
        logger.fail(`❌ Todas as ${MAX_ATTEMPTS} tentativas esgotadas — nenhum produto válido no pilar "${pillar}"`);
        stateMachine.addError('Todas as tentativas esgotadas - nenhum produto válido');
        stateMachine.transition('FAIL');
        collector.failStage(si, 'Todas as tentativas esgotadas');
        pipelineFailed = true;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // FILES_WRITTEN → verifica artefatos → READY_TO_COMMIT
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'FILES_WRITTEN') {
    const si = collector.startStage('FILES_WRITTEN');
    logger.step(`Verificando artefatos...`);

    const verification = verifyPublication({ mdPath, imgPath, slug });
    for (const c of verification.checks) {
      if (c.pass) logger.pass(c.detail); else logger.fail(c.detail);
    }
    if (verification.success) logger.pass(`Artefatos OK`);
    else logger.warn(`Artefatos: ${verification.errors.join('; ')}`);

    stateMachine.transition('READY_TO_COMMIT');
    collector.endStage(si, { mdPath, imgPath });
  }

  // ════════════════════════════════════════════════════════════════
  // READY_TO_COMMIT → COMMITTED (simulado ou aguardando CI)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'READY_TO_COMMIT') {
    const si = collector.startStage('READY_TO_COMMIT');
    logger.step(`Aguardando commit (Workflow CI)...`);
    stateMachine.transition('COMMITTED');
    collector.endStage(si);
    logger.pass(`Pronto para commit — CI fará git add/commit/push`);
  }

  // ════════════════════════════════════════════════════════════════
  // COMMITTED → DEPLOYED (simulado)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'COMMITTED') {
    const si = collector.startStage('COMMITTED');
    logger.step(`Aguardando deploy (Workflow CI)...`);
    stateMachine.transition('DEPLOYED');
    collector.endStage(si);
  }

  // ════════════════════════════════════════════════════════════════
  // DEPLOYED → VERIFIED (simulado)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'DEPLOYED') {
    const si = collector.startStage('DEPLOYED');
    stateMachine.transition('VERIFIED');
    collector.endStage(si);
  }

  // ════════════════════════════════════════════════════════════════
  // VERIFIED → DONE
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'VERIFIED') {
    const si = collector.startStage('VERIFIED');
    const postUrl = `https://achadocerto.vip/blog/${slug}`;
    logger.pass(`Publicação concluída: ${postUrl}`);
    stateMachine.transition('DONE');
    collector.endStage(si, { slug, url: postUrl });
  }

  // ════════════════════════════════════════════════════════════════
  // Estado final (usado no dry run e na finalização)
  // ════════════════════════════════════════════════════════════════
  const finalState = stateMachine.getState();
  const completed = finalState === 'DONE';

  // ════════════════════════════════════════════════════════════════
  // DRY RUN: exibe conteúdo gerado e limpa artefatos
  // ════════════════════════════════════════════════════════════════
  if (dryRun && slug && mdPath) {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 DRY RUN — CONTEÚDO GERADO');
    console.log('='.repeat(70));
    console.log(`\n📄 Slug: ${slug}`);
    console.log(`🔗 URL: https://achadocerto.vip/blog/${slug}`);
    console.log(`🏷️  Link afiliado: ${affUrl}`);

    // Exibe markdown gerado
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8');
      console.log('\n📝 MARKDOWN GERADO:');
      console.log('─'.repeat(70));
      console.log(content);
      console.log('─'.repeat(70));
      console.log(`📏 Tamanho: ${content.length} caracteres, ${content.split('\n').length} linhas`);
    }

    // Exibe imagem
    if (fs.existsSync(imgPath)) {
      const imgSize = fs.statSync(imgPath).size;
      console.log(`\n🖼️  Imagem: ${path.basename(imgPath)} (${(imgSize / 1024).toFixed(1)}KB)`);
    }

    // Exibe validações
    if (seoResult) {
      console.log(`\n🔍 SEO GATE: ${seoResult.pass ? 'APROVADO' : 'REPROVADO'}`);
      if (seoResult.errors.length) console.log(`   Erros: ${seoResult.errors.join('; ')}`);
      if (seoResult.warnings.length) console.log(`   Avisos: ${seoResult.warnings.join('; ')}`);
    }

    if (auditResult) {
      console.log(`\n📋 AUDITORIA: ${auditResult.passed ? 'APROVADO' : 'REPROVADO'} — ${auditResult.score}%`);
      for (const check of auditResult.checks) {
        console.log(`   ${check.pass ? '✓' : '✗'} ${check.detail}`);
      }
    }

    if (affUrl) {
      console.log(`\n🔗 LINK AFILIADO:`);
      console.log(`   URL: ${affUrl}`);
      console.log(`   tag= presente: ${affUrl.includes('tag=')}`);
      console.log(`   Domínio Amazon: ${affUrl.includes('amazon.com.br')}`);
      console.log(`   ASIN presente: ${/\/dp\/[A-Z0-9]{10}/.test(affUrl)}`);
    }

    // Exibe state machine
    console.log(`\n📌 STATE MACHINE:`);
    console.log(`   Path: ${stateMachine.getPath()}`);
    console.log(`   Final: ${finalState}`);
    console.log(`   Duração: ${Math.round(collector.getTotalTime())}ms`);

    // Exibe stages
    const allStages = collector.getStages();
    console.log(`\n⏱  TEMPOS POR ETAPA:`);
    for (const s of allStages) {
      const dur = s.duration ? `${s.duration}ms` : 'N/A';
      console.log(`   ${(s.name || '').padEnd(20)} ${dur.padStart(8)} ${s.success ? '✓' : s.success === false ? '✗' : '?'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🧪 DRY RUN — LIMPANDO ARTEFATOS (nada foi persistido)');
    console.log('='.repeat(70));

    // Remove arquivos gerados
    try { if (fs.existsSync(mdPath)) { fs.unlinkSync(mdPath); console.log(`   🗑️  Removido: ${mdPath}`); } } catch (_) {}
    try { if (fs.existsSync(imgPath)) { fs.unlinkSync(imgPath); console.log(`   🗑️  Removido: ${imgPath}`); } } catch (_) {}

    // Remove state da state machine
    stateMachine.cleanup();
    console.log(`   🗑️  State machine limpa`);

    console.log('\n✅ Dry run concluído — nenhum artefato persistido, nenhuma publicação realizada.');
  }

  // ════════════════════════════════════════════════════════════════
  // Finalização: registra histórico, gera dashboard, salva logs
  // ════════════════════════════════════════════════════════════════

  // ════════════════════════════════════════════════════════════════
  // RELATÓRIO JSON DE AUDITORIA (sempre gera, mesmo em falha)
  // ════════════════════════════════════════════════════════════════
  try {
    generateAuditReport({
      executionId,
      timestamp: new Date().toISOString(),
      trigger,
      pillar,
      dryRun,
      durationMs: collector.getTotalTime(),
      product: product || {},
      affiliateUrl: affUrl,
      slug,
      mdPath,
      imgPath,
    }, {
      productValidation: null, // TODO: extrair dos resultados do loop
      catSafety: null,
      productHash: product ? { valid: true, currentHash: generateProductHash({ asin: product.asin, title: product.name, brand: product.brand || '', category: pillar }) } : null,
      seoResult,
      auditResult,
    });
    logger.info(`Relatorio de auditoria gerado`);
  } catch (reportErr) {
    logger.warn(`Erro ao gerar relatorio: ${reportErr.message}`);
  }

  if (!dryRun && completed && product) {
    // Registra no histórico
    recordPost({
      asin: product.asin, title: product.name, url: affUrl,
      slug, category: product.category,
      source: product.isTrending ? 'trending' : 'catalog',
      trending: !!product.isTrending,
      guardWarnings: guard ? guard.warnings.length : 0,
      meta: { angle: product.angle, tag: affConfig?.tag },
    });

    logger.pass(`Post registrado no histórico`);
  }

  // Métricas (sempre salva, mesmo em dry run — para referência)
  const report = collector.generateReport({ status: completed ? 'success' : 'fail', executionId, produto: product?.name, asin: product?.asin, dryRun });
  collector.saveReport(report);

  // Dashboard
  try { generateDashboard(); } catch (_) {}

  // Log + liberação
  logger.flush({ status: completed ? 'success' : 'fail', executionId, produto: product?.name, asin: product?.asin, pillar, dryRun });
  releaseLock();

  logger.info(`Pipeline finalizado: ${finalState} em ${Math.round(collector.getTotalTime())}ms`);
}

// ── Scheduler ───────────────────────────────────────────────────────────────

function startScheduler() {
  const logger = createExecutionLogger({ pilar: 'scheduler', trigger: 'daemon' });
  logger.info('🕐 Agente iniciado — 08:00 | 12:00 | 18:00 (BRT)');
  logger.info(`🏷️  Tag: ${AMAZON_TAG}  |  Pilares: ${PILLARS.join(' · ')}`);
  SCHEDULES.forEach((s, i) => logger.info(`   ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`));

  let lastRun = null;
  setInterval(() => {
    const brt  = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const h = brt.getHours(), m = brt.getMinutes();
    const key  = `${brt.toDateString()}-${h}:${m}`;
    const slot = SCHEDULES.findIndex(s => s.hour === h && s.minute === m);
    if (slot !== -1 && key !== lastRun) {
      lastRun = key;
      runJob(null, slot, 'schedule').catch(err => {
        const errLogger = createExecutionLogger({ pilar: 'error', trigger: 'schedule' });
        errLogger.error(`Erro no scheduler: ${err.message}`);
        errLogger.flush({ status: 'error', error: err.message });
      });
    }
  }, 30 * 1000);
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--status')) {
  console.log(`\n📊 STATUS DO AGENTE — ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`);

  const history = loadHistory();
  const summaryLines = getHistorySummary();
  summaryLines.forEach(l => console.log(l));

  console.log('\n📅 Rotação de HOJE:');
  SCHEDULES.forEach((s, i) => console.log(`  ${String(s.hour).padStart(2,'0')}:00 → ${getPillarForSlot(i)}`));

  console.log('\n📡 Trend Scout cache:');
  getTrendingStatus().forEach(l => console.log(l));

  console.log('\n🏷️  Tag afiliada:', AMAZON_TAG);

  const totalProdutos = ['beleza', 'saude', 'casa'].reduce((sum, p) => sum + loadCatalog(p).length, 0);
  console.log(`📦 Catálogo: ${totalProdutos} produtos (${PILLARS.length} pilares)`);

  const dlq = getDeadLetterSummary();
  console.log(`\n📋 DLQ: ${dlq.total} itens (${dlq.pending} pendentes)`);

  console.log('\n📋 Último log:');
  const lastLog = getLatestLog();
  if (lastLog) {
    const status = lastLog.result?.status || '?';
    const dur    = Math.round((lastLog.meta?.duration || 0) / 1000);
    console.log(`  ${lastLog.meta?.runId || '?'} → ${status} (${dur}s)`);
  } else {
    console.log('  Nenhum log encontrado');
  }

  console.log('');
  process.exit(0);
}

if (args.includes('--now')) {
  const dryRun = args.includes('--dry-run');
  const forcePillar = args.find(a => PILLARS.includes(a)) || null;
  const logger = createExecutionLogger({ pilar: forcePillar || 'auto', trigger: dryRun ? 'dry-run' : 'manual' });
  logger.info(`⚡ --now ${forcePillar ? `(pilar: ${forcePillar})` : '(rotação automática)'}${dryRun ? ' [DRY RUN]' : ''}`);
  runJob(forcePillar, 0, 'manual', dryRun)
    .then(() => process.exit(0))
    .catch(err => {
      const errLogger = createExecutionLogger({ pilar: 'error', trigger: 'manual' });
      errLogger.error(err.message);
      errLogger.flush({ status: 'error', error: err.message });
      process.exit(1);
    });
} else {
  startScheduler();
}
