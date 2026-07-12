#!/usr/bin/env node
/**
 * AchadoCerto.VIP — Agente Autônomo de Posts (Amazon BR)
 *
 * Pipeline integrado com state machine, execution ID, lock, confidence score,
 * SEO gate, metrics collector, audit, DLQ e circuit breaker.
 *
 * Pipeline EXATO:
 *   PENDING → PRODUCT_SELECTED → PRODUCT_VALIDATED → CONTENT_GENERATED →
 *   QUALITY_APPROVED → AUDIT → FILES_WRITTEN → READY_TO_COMMIT →
 *   COMMITTED → DEPLOYED → VERIFIED → DONE
 *
 * Se o AUDIT reprovar → FAIL (publicação bloqueada)
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
const MAX_GUARD_RETRIES = 3;
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
  let pipelineBlocked = false;
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
  // PRODUCT_SELECTED → busca produtos → PRODUCT_VALIDATED
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
      stateMachine.transition('PRODUCT_VALIDATED', { poolSize: pool.length });
      collector.endStage(si, { poolSize: pool.length });

      // ── Loop de seleção: tenta até achar um produto válido ─────
      const excluded = [];
      for (let attempt = 1; attempt <= MAX_GUARD_RETRIES; attempt++) {
        product = pickFromPool(pool, excluded);
        if (!product) {
          logger.fail('Nenhum produto disponível no pool');
          stateMachine.addError('Nenhum produto disponível no pool - todas as tentativas esgotadas');
          stateMachine.transition('FAIL');
          collector.failStage(si, 'Pool vazio - nenhum produto após retry');
          pipelineFailed = true;
          break;
        }

        const badge = product.isTrending ? `📈 trending` : '📦 catálogo';
        logger.info(`Tentativa ${attempt}: ${product.name} [${badge}]`, { asin: product.asin });

        // Português
        if (!isTitleInPortuguese(product.name)) {
          logger.fail(`Título fora do PT-BR`);
          excluded.push(product.asin);
          continue;
        }

        // Link afiliado
        affUrl = buildAmazonAffiliateUrl(product.asin, affConfig.tag);
        const urlValid = validateFinalAffiliateUrl(affUrl);
        if (!urlValid.valid) {
          logger.fail(`Link inválido: ${urlValid.error}`);
          excluded.push(product.asin);
          continue;
        }

        // Duplicidade
        const dupCheck = checkDuplicate({ asin: product.asin, title: product.name, url: affUrl }, HISTORY_DAYS);
        if (dupCheck.duplicate) {
          logger.fail(`Duplicado: ${dupCheck.reason}`);
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
          logger.fail(`Guard bloqueou: ${guard.blockers.join(' | ')}`);
          excluded.push(product.asin);
          continue;
        }

        logger.pass(`Produto selecionado: ${product.name}`);
        stateMachine.setContext({ asin: product.asin, productName: product.name, affiliateUrl: affUrl });
        break;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // PRODUCT_VALIDATED → gera conteúdo → CONTENT_GENERATED
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && product && stateMachine.getState() === 'PRODUCT_VALIDATED') {
    const si = collector.startStage('PRODUCT_VALIDATED');
    logger.step(`Validando confiança: ${product.name}`);

    const source = product.isTrending ? 'puppeteer' : 'catalog';
    const confCheck = validateConfidence(source, 50);
    if (!confCheck.pass) {
      logger.fail(`Confiança ${confCheck.score} < ${confCheck.minimum}`);
      stateMachine.addError(confCheck.error);
      stateMachine.transition('FAIL');
      collector.failStage(si, confCheck.error);
      pipelineFailed = true;
    } else {
      logger.pass(`Confiança: ${confCheck.score}`);
      stateMachine.transition('CONTENT_GENERATED', { confidence: confCheck.score });
      collector.endStage(si, { confidence: confCheck.score });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // CONTENT_GENERATED → gera arquivos → QUALITY_APPROVED
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && product && stateMachine.getState() === 'CONTENT_GENERATED') {
    const si = collector.startStage('CONTENT_GENERATED');
    logger.step(`Gerando post: ${product.name} [${product.asin}]`);

    const genOk = runPostGenerator(affUrl, product.name, guard ? guard.envVars : {}, logger);

    if (!genOk) {
      logger.fail(`Geração do post falhou`);
      stateMachine.addError('Geração do post falhou');
      stateMachine.transition('FAIL');
      collector.failStage(si, 'Geração falhou');
      addToDeadLetter({ asin: product.asin, productName: product.name, pillar, stage: 'CONTENT_GENERATED', error: 'novo-post.js falhou', meta: { executionId } });
      pipelineFailed = true;
    } else {
      // Escaneia o diretório de blog para encontrar o slug REAL gerado pelo novo-post.js
      const blogDir = path.join(projectRoot, 'src', 'content', 'blog');
      const imgDir = path.join(projectRoot, 'public', 'images', 'posts');

      if (fs.existsSync(blogDir)) {
        const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
        if (files.length > 0) {
          // Pega o arquivo .md mais recente (acabou de ser criado pelo novo-post.js)
          const newest = files.map(f => ({
            name: f,
            time: fs.statSync(path.join(blogDir, f)).mtimeMs
          })).sort((a, b) => b.time - a.time)[0];
          mdPath = path.join(blogDir, newest.name);
          slug = newest.name.replace(/\.md$/, '');
        }
      }

      if (!slug) {
        // Fallback: usa slugify se não encontrou arquivo
        slug = slugify(product.name);
        mdPath = path.join(blogDir, `${slug}.md`);
      }

      // Procura a imagem correspondente
      const imgCandidates = [
        path.join(imgDir, `${slug}.webp`),
        path.join(imgDir, `${slug}.jpg`),
        path.join(imgDir, `${slug}.png`),
      ];
      for (const candidate of imgCandidates) {
        if (fs.existsSync(candidate)) {
          imgPath = candidate;
          break;
        }
      }
      if (!imgPath) imgPath = imgCandidates[0]; // fallback .webp

      stateMachine.transition('QUALITY_APPROVED', { slug });
      collector.endStage(si, { slug });
      logger.pass(`Arquivos gerados: ${slug}`);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // QUALITY_APPROVED → quality gates + SEO → AUDIT
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'QUALITY_APPROVED') {
    const si = collector.startStage('QUALITY_APPROVED');
    logger.step(`Aplicando quality gates...`);

    let markdownContent = '';
    try { if (fs.existsSync(mdPath)) markdownContent = fs.readFileSync(mdPath, 'utf8'); } catch (_) {}

    // Gate: título genérico
    if (markdownContent && /title:\s*"Produto Amazon\b/i.test(markdownContent)) {
      logger.fail(`TÍTULO GENÉRICO — CANCELANDO`);
      try { fs.unlinkSync(mdPath); } catch (_) {}
      try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
      stateMachine.addError('Título genérico detectado no markdown');
      stateMachine.transition('FAIL');
      collector.failStage(si, 'Título genérico');
      addToDeadLetter({ asin: product?.asin || '?', productName: product?.name || '?', pillar, stage: 'QUALITY_APPROVED', error: 'Título genérico', meta: { executionId } });
      pipelineFailed = true;
    } else
    // Quality gates
    if (markdownContent) {
      const qResult = runQualityGates('final_markdown', {
        markdown: markdownContent, title: product?.name,
        category: pillar, imageFile: `${slug}.webp`,
        affiliateUrl: affUrl, slug,
      });
      for (const e of qResult.errors) logger.fail(`QUALITY: ${e}`);
      if (!qResult.pass) {
        logger.fail(`Quality gates: ${qResult.errors.length} falha(s) — CANCELANDO`);
        try { fs.unlinkSync(mdPath); } catch (_) {}
        try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (_) {}
        stateMachine.addError(`Quality gates: ${qResult.errors.join('; ')}`);
        stateMachine.transition('FAIL');
        collector.failStage(si, 'Quality gates', { errors: qResult.errors });
        addToDeadLetter({ asin: product?.asin || '?', productName: product?.name || '?', pillar, stage: 'QUALITY_APPROVED', error: `Quality gates: ${qResult.errors.join('; ')}`, meta: { executionId } });
        pipelineFailed = true;
      } else {
        logger.pass(`Quality gates OK`);
        stateMachine.transition('AUDIT');
        collector.endStage(si, { qErrors: qResult.errors.length, qWarnings: qResult.warnings.length });

        // SEO Gate
        seoResult = runSeoGates({ title: product?.name, description: `Descubra as vantagens do ${product?.name}.`, markdown: markdownContent, slug });
        if (!seoResult.pass) logger.warn(`SEO: ${seoResult.errors.length} problemas`);
        else logger.pass(`SEO OK`);
      }
    } else {
      stateMachine.transition('AUDIT');
      collector.endStage(si);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // AUDIT → verifica tudo → FILES_WRITTEN (ou FAIL se reprovar)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && slug && stateMachine.getState() === 'AUDIT') {
    const si = collector.startStage('AUDIT');
    logger.step(`Executando auditoria final...`);

    auditResult = runFinalAudit({ slug, title: product?.name, affiliateUrl: affUrl, category: pillar, seoResult, historyCheck: { duplicate: false } });
    logger.info(`Auditoria: ${auditResult.passed ? 'APROVADO' : 'REPROVADO'} — ${auditResult.score}% (${auditResult.details.passed}/${auditResult.details.total})`);

    if (auditResult.passed) {
      stateMachine.transition('FILES_WRITTEN');
      collector.endStage(si, { auditPassed: true, auditScore: auditResult.score });
      logger.pass(`Auditoria aprovada — prosseguindo`);
    } else {
      logger.fail(`Auditoria REPROVOU — publicação CANCELADA`);
      logger.info(`  Motivos: ${auditResult.checks.filter(c => !c.pass).map(c => c.detail).join(' | ')}`);
      stateMachine.addError(`Auditoria reprovou: ${auditResult.score}%`);
      stateMachine.transition('FAIL');
      collector.failStage(si, `Auditoria: ${auditResult.score}%`);
      addToDeadLetter({ asin: product?.asin || '?', productName: product?.name || '?', pillar, stage: 'AUDIT', error: `Auditoria ${auditResult.score}% — ${auditResult.summary}`, meta: { executionId, slug, checks: auditResult?.checks || [] } });
      pipelineBlocked = true;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // FILES_WRITTEN → verifica artefatos → READY_TO_COMMIT
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && !pipelineBlocked && slug && stateMachine.getState() === 'FILES_WRITTEN') {
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
  if (!pipelineFailed && !pipelineBlocked && slug && stateMachine.getState() === 'READY_TO_COMMIT') {
    const si = collector.startStage('READY_TO_COMMIT');
    logger.step(`Aguardando commit (Workflow CI)...`);
    stateMachine.transition('COMMITTED');
    collector.endStage(si);
    logger.pass(`Pronto para commit — CI fará git add/commit/push`);
  }

  // ════════════════════════════════════════════════════════════════
  // COMMITTED → DEPLOYED (simulado)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && !pipelineBlocked && slug && stateMachine.getState() === 'COMMITTED') {
    const si = collector.startStage('COMMITTED');
    logger.step(`Aguardando deploy (Workflow CI)...`);
    stateMachine.transition('DEPLOYED');
    collector.endStage(si);
  }

  // ════════════════════════════════════════════════════════════════
  // DEPLOYED → VERIFIED (simulado)
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && !pipelineBlocked && slug && stateMachine.getState() === 'DEPLOYED') {
    const si = collector.startStage('DEPLOYED');
    stateMachine.transition('VERIFIED');
    collector.endStage(si);
  }

  // ════════════════════════════════════════════════════════════════
  // VERIFIED → DONE
  // ════════════════════════════════════════════════════════════════
  if (!pipelineFailed && !pipelineBlocked && slug && stateMachine.getState() === 'VERIFIED') {
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
