#!/usr/bin/env node
/**
 * AchadoCertoVIP — Gerador automático de posts com IA
 *
 * USO (1 comando, só isso):
 *   npm run post "https://url-afiliado"
 *
 * Plataformas suportadas:
 *   ✅ Mercado Livre  (via API oficial)
 *   ✅ Amazon         (via PA-API 5.0 ou scraping melhorado)
 *   ✅ Magalu         (via scraping)
 *
 * Faz tudo:
 *  1. Detecta a plataforma automaticamente
 *  2. Busca nome, imagem e specs
 *  3. Busca contexto via Serper.dev (opcional)
 *  4. Gera conteúdo rico via Groq AI (temperature 0.1)
 *  5. Valida qualidade anti-genérico
 *  6. Baixa a foto do produto
 *  7. Gera o .md completo
 *  8. Faz git add + commit + push
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

// Carrega .env do backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', 'backend', '.env') });

// Importa módulos personalizados
import { selecionarArquetipo, gerarContextoVariacoes, ARQUETIPOS } from './content-archetypos.js';
import { buscarContextoProduto, verificarStatusSerper } from './serper-service.js';
import { gerarConteudoPost } from './groq-service.js';
import { validarConteudo, corrigirAutomatico, analisarDetalhado } from './content-validator.js';
import { fetchAmazon as fetchAmazonService } from './amazon-service-puppeteer.js';

// ── Carrega links de afiliado salvos ───────────────────────────────────────
function carregarProdutosAfiliados() {
  try {
    const filePath = path.join(__dirname, '..', 'data', 'produtos-afiliados.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Converte array de produtos para objeto com ID como chave
      const mapa = {};
      if (Array.isArray(data.produtos)) {
        data.produtos.forEach(prod => {
          mapa[prod.id] = prod.linkAfiliado;
        });
      }
      return mapa;
    }
  } catch (err) {
    console.log('   ⚠️  Erro ao carregar produtos salvos:', err.message);
  }
  return {};
}

const PRODUTOS_AFILIADOS = carregarProdutosAfiliados();

function addAffiliateCodeToMlUrl(url, code = 'muc1576372') {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('mercadolivre.com.br') && !parsed.pathname.includes('/social/') && !parsed.pathname.includes('/sec/')) {
      if (!parsed.searchParams.has('affiliateCode')) {
        parsed.searchParams.set('affiliateCode', code);
      }
      return parsed.toString();
    }
  } catch (_) {}
  return url;
}

// ── Processa link de afiliado ──────────────────────────────────────────────
function processarLinkAfiliado(url, tipo = 'mercado-livre') {
  // Mercado Livre: Procura por link já gerado e salvo
  if (tipo === 'mercado-livre' && /mercadolivre\.com(\.br)?/.test(url)) {
    try {
      const mlMatch = url.match(/MLB-?(\d{6,12})/i);
      if (mlMatch) {
        const productId = mlMatch[1];
        if (PRODUTOS_AFILIADOS[productId]) {
          const linkAfiliado = PRODUTOS_AFILIADOS[productId];
          console.log(`   ✅ Link de afiliado encontrado: ${linkAfiliado}`);
          return linkAfiliado;
        }
      }
    } catch (err) {
      // Fallback silencioso
    }

    // Caso não exista link salvo, adiciona o código de afiliado ao produto
    const affiliateUrl = addAffiliateCodeToMlUrl(url);
    console.log(`   🔧 Usando fallback de afiliado ML: ${affiliateUrl}`);
    return affiliateUrl;
  }
  
  // Amazon e Magalu: Adiciona UTM
  if (['amazon', 'magalu'].includes(tipo)) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('utm_source', 'achadocertovip');
      urlObj.searchParams.set('utm_medium', 'blog');
      urlObj.searchParams.set('utm_campaign', 'posts-ia');
      if (tipo) urlObj.searchParams.set('utm_id', tipo);
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  return url;
}

// ── Sanitização de preços e CTA ───────────────────────────────────────────
function sanitizarConteudo(conteudo) {
  let sanitizado = conteudo;
  
  // Remove padrões monetários
  sanitizado = sanitizado.replace(/R\$\s*[\d.,]+/gi, '');
  sanitizado = sanitizado.replace(/\breais?\b|\bcentavos?\b/gi, '');
  sanitizado = sanitizado.replace(/\b\d+,\d{2}\b/g, '');
  sanitizado = sanitizado.replace(/preço\s*(?:é|de|:)?\s*\d+/gi, '');
  sanitizado = sanitizado.replace(/custa\s*(?:apenas|de)?\s*r?\$?\s*\d+/gi, '');
  
  // Remove linhas apenas com valores
  const linhas = sanitizado.split('\n');
  sanitizado = linhas.filter(l => !/^\s*[r$\d.,\s]+\s*$/i.test(l)).join('\n');
  sanitizado = sanitizado.replace(/\n{3,}/g, '\n\n').trim();
  
  // Valida e injeta CTA se faltar
  const temCTA = /confira|acesse|veja|conheça|consulte|saiba mais|clique|visite|aproveite|compre|adquira|leia mais|descubra|encontre|confira no/i.test(sanitizado);
  if (!temCTA) {
    sanitizado = sanitizado.trimRight() + '\n\nConfira o produto no anúncio para detalhes atualizados e aproveitar a melhor oferta.';
  }
  
  return sanitizado;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
}

function isSuspiciousTitle(title) {
  if (!title) return true;
  const normalized = title.toLowerCase();
  const patterns = [
    /^produto amazon\b/i,
    /amazon\.com\.br/i,
    /todos os departamentos/i,
    /departamentos/i,
    /produto amazon [a-z0-9]{10}/i,
    /antes de comprar/i,
    /dispositivos kindle/i,
    /prime teste gratis/i,
  ];
  return patterns.some(re => re.test(normalized));
}

function get(urlStr, redirectCount = 0) {
  console.log(`→ HTTP GET ${urlStr} (redirects=${redirectCount})`);
  if (redirectCount > 8) throw new Error('Muitos redirecionamentos');
  return new Promise((resolve, reject) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    }, (res) => {
      console.log(`  ← ${res.statusCode} ${res.headers.location || ''}`);
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return resolve(get(res.headers.location, redirectCount + 1));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers, url: urlStr }));
    });
    req.on('error', reject);
    req.setTimeout(14000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function downloadImage(imgUrl, destPath, redirectCount = 0) {
  if (redirectCount > 8) throw new Error('Muitos redirecionamentos na imagem');
  return new Promise((resolve, reject) => {
    const lib = imgUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = lib.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        file.close(); try { fs.unlinkSync(destPath); } catch(_) {}
        return resolve(downloadImage(res.headers.location, destPath, redirectCount + 1));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const size = fs.statSync(destPath).size;
          if (size < 500) {
            try { fs.unlinkSync(destPath); } catch (_) {}
            return reject(new Error(`Imagem inválida (${size} bytes) — possível tracking pixel`));
          }
          resolve();
        });
      });
    });
    req.on('error', err => { try { fs.unlinkSync(destPath); } catch(_){} reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout imagem')); });
  });
}

// ── Detecta plataforma ───────────────────────────────────────────────────

function detectPlatform(u) {
  if (/mercadolivre|mercadolibre|mercado livre|mlb|meli\.la/i.test(u)) return 'ml';
  if (/amazon\.com\.br|amzn\.to|amzn\.com/i.test(u))          return 'amazon';
  if (/magazineluiza|magalu|maga\.lu/i.test(u))                return 'magalu';
  return 'unknown';
}

// ── Mapeamento de categoria ──────────────────────────────────────────
// IMPORTANTE: retorna SEMPRE em minúsculo, sem acentos, sem espaços
// para bater exatamente com os filtros do Astro.
//
// PILARES PRIORITÁRIOS: beleza > saude > casa
// Esses três recebem boost extra e têm listas de override para termos
// que poderiam ser classificados erroneamente em outras categorias.

function mapCategory(name) {
  const n = (name || '').toLowerCase();

  // ══════════════════════════════════════════════════════════════════════════
  // OVERRIDE DIRETO — termos que SEMPRE pertencem a um pilar específico
  // independente do score. Evita falsos positivos em tech/casa/etc.
  // ══════════════════════════════════════════════════════════════════════════

  // Override BELEZA — produtos cosméticos/maquiagem/cabelo que podem
  // ser confundidos com outras categorias (ex: "base" → tech/construção)
  const belezaOverride = /\b(base líquida|base liquida|base compacta|base matte|base pó|base po|refil de base|refil base|bb cream|cc cream|tinted moisturizer|cushion|fond de teint|fond de|foundation)\b|\b(esmalte|batom|gloss labial|lip tint|delineador|rímel|rimel|mascara de cilios|mascara de cílios|sombra|paleta de sombra|primer facial|corretivo facial|blush|contorno facial|iluminador facial|bronzeador facial|pó facial|po facial|pó compacto|po compacto|translúcido facial|translucido facial)\b|\b(shampoo|condicionador|máscara capilar|mascara capilar|leave.?in capilar|finalizador capilar|óleo capilar|oleo capilar|tônico capilar|tonico capilar|ampola capilar|sérum capilar|serum capilar|reconstrutor|cronograma capilar)\b|\b(perfume feminino|perfume masculino|eau de parfum|eau de toilette|body splash|colônia|colonia feminina|colonia masculina|deo parfum)\b|\b(natura una|avon|eudora|mary kay|o boticário|boticário|boticario|quasar|malbec|egeo|kaiak|humor|floratta)\b/i;
  if (belezaOverride.test(n)) {
    console.log(`   🎯 Override: beleza (match direto no nome)`);
    return 'beleza';
  }

  // Override SAÚDE — suplementos e medicamentos que poderiam cair em beleza/casa
  const saudeOverride = /\b(whey protein|whey isolado|whey concentrado|whey hidrolisado|proteína em pó|proteina em po|creatina monohidratada|bcaa essencial|pre.?treino|pré.?treino|pre workout|termogênico|termogenico|hipercalórico|hipercalorico|mass gainer|albumina em pó|albumina em po|caseína|caseina)\b|\b(vitamina[s]? [a-z0-9]+|complexo [bBcC]|multivitamínico|multivitaminico|ômega 3|omega 3|probiótico|probiotico|colágeno hidrolisado|colageno hidrolisado|ácido hialurônico oral|glucosamina|condroitina)\b/i;
  if (saudeOverride.test(n)) {
    console.log(`   🎯 Override: saude (match direto no nome)`);
    return 'saude';
  }

  // Override CASA — eletrodomésticos inequívocos
  const casaOverride = /\b(air ?fryer|fritadeira sem óleo|fritadeira sem oleo|microondas|micro.?ondas|geladeira|refrigerador frost free|lavadora de roupas|lava e seca|máquina de lavar|maquina de lavar|fogão|fogao a gas|cooktop|coifa de parede|aspirador robô|aspirador robo)\b/i;
  if (casaOverride.test(n)) {
    console.log(`   🎯 Override: casa (match direto no nome)`);
    return 'casa';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Sistema de pontuação para categorias (quando não há override direto)
  // Os 3 pilares (beleza, saude, casa) recebem peso base +1 extra
  // ══════════════════════════════════════════════════════════════════════════
  const scores = {
    tech: 0,
    saude: 0,
    casa: 0,
    esportes: 0,
    beleza: 0,
    automotivo: 0
  };

  // Boost base para os 3 pilares prioritários do site
  // Garante que, em caso de empate, eles sempre vencem sobre categorias secundárias
  scores.beleza += 0.5;
  scores.saude  += 0.5;
  scores.casa   += 0.5;

  // ══════════════════════════════════════════════════════════════════════════
  // TECH - Eletrônicos e tecnologia (expandido com subcategorias do ML)
  // ══════════════════════════════════════════════════════════════════════════
  const techWords = /celular|smartphone|iphone|samsung|xiaomi|motorola|poco|redmi|galaxy|tablet|ipad|notebook|laptop|macbook|dell|lenovo|acer|asus|tv |televisor|televisão|smart tv|4k|oled|tela|display|monitor|led|lcd|fone|headphone|earphone|earbuds|airpod|jbl|sony|beats|audio|áudio|som|caixa de som|soundbar|home theater|camera|câmera|webcam|gopro|filmadora|pc |computador|desktop|gabinete|processador|intel|amd|ryzen|placa de video|gpu|rtx|gtx|mouse|teclado|mousepad|gamer|rgb|mecânico|mecanico|microfone|streamer|podcast|alexa|echo|google home|chromecast|fire stick|roku|apple tv|kindle|leitor|e-reader|console|playstation|ps4|ps5|xbox|nintendo|switch|controle|joystick|gamepad|ssd|hd externo|hd |pendrive|pen drive|flash drive|memória|memoria ram|carregador|cabo usb|usb-c|tipo c|lightning|hdmi|bluetooth|wifi|roteador|modem|extensor|repetidor|switch de rede|no-break|estabilizador|fonte|powerbank|bateria externa|energia|projetor|datashow|impressora|scanner|multifuncional|toner|cartucho|tinta|alexa|assistente virtual|drone|gimbal|estabilizador de imagem|ring light|iluminação|iluminaçao para foto|tripé|tripe|suporte/;
  if (techWords.test(n)) scores.tech += 2;

  // ══════════════════════════════════════════════════════════════════════════
  // SAÚDE - Suplementos e produtos medicinais (expandido)
  // ══════════════════════════════════════════════════════════════════════════
  const saudeWords = /saúde|saude|suplemento|vitamina|vitaminico|proteína|proteina|creatina|colágen|colagen|colágeno|colageno|whey|whey protein|isolado|concentrado|hidrolisado|bcaa|amino|aminoacido|aminoácido|cápsulas|capsulas|softgel|medicamento|remédio|remedio|farmácia|farmacia|drogaria|glutamina|pre.?treino|pré.?treino|pre workout|cafeína|cafeina|termogênico|termogenico|queimador|fat burner|arginina|l-carnitina|carnitina|omega|omega 3|ômega|óleo de peixe|oleo de peixe|probiótico|probiotico|flora intestinal|multivitamínico|multivitaminico|complexo b|vitamina c|vitamina d|cálcio|calcio|magnésio|magnesio|zinco|ferro|melatonina|5-htp|triptofano|maca peruana|tribulus|zma|gh|hormônio|hormonio|anabolizante|testosterona|massa muscular|hipertrofia|definição|definiçao|emagrecimento|dieta|nutricional|nutrição|nutriçao|barra de proteína|proteina|shake|maltodextrina|dextrose|waxy maize|albumina|caseína|caseina|hipercalórico|hipercalorico|gainers|mass gainer|óxido nítrico|oxido nitrico|pump|vascularização|vascularizaçao|beta alanina|citrulina|arginina|cromo|picolinato|coenzima q10|ácido|acido hialurônico|hialuronico|biotina|colágeno|colageno hidrolisado|tipo ii|cartilagem|articulação|articulaçao|flex|saúde|saude articular|glucosamina|condroitina|msm/;
  if (saudeWords.test(n)) scores.saude += 2;

  // ══════════════════════════════════════════════════════════════════════════
  // CASA - Eletrodomésticos, móveis e itens do lar (expandido massivamente)
  // ══════════════════════════════════════════════════════════════════════════
  const casaWords = /casa|cozinha|lar|doméstico|domestico|residencial|móvel|movel|estante|rack|painel|mesa|cadeira|sofá|sofa|poltrona|puff|pufe|banqueta|criado.?mudo|guarda.?roupa|armário|armario|cômoda|comoda|gaveteiro|penteadeira|decora|decoração|decoraçao|enfeite|quadro|moldura|vaso|planta|artificial|lustre|pendente|arandela|abajur|luminária|luminaria|led|lampada|lâmpada|panela|jogo de panelas|antiaderente|inox|cerâmica|ceramica|ferro fundido|balde|pote|prato|tigela|talheres|garfo|faca|colher|copo|taça|taça|caneca|xícara|xicara|garrafa térmica|termica|marmita|pote hermético|hermetico|porta tempero|organizador|liquidificador|batedeira|mixer|processador|multiprocessador|espremedor|centrífuga|centrifuga|sanduicheira|grill|wafleira|cafeteira|máquina|maquina de café|cafe|expresso|nespresso|dolce gusto|chaleira|elétrica|eletrica|air ?fryer|fritadeira|sem óleo|oleo|forno elétrico|eletrico|micro.?ondas|microondas|fogão|fogao|cooktop|coifa|depurador|exaustor|geladeira|refrigerador|freezer|frost free|inverse|side by side|frigobar|adega|climatizador|ventilador|circulador|ar condicionado|split|portátil|portatil|umidificador|desumidificador|purificador de ar|aquecedor|climatizador|aspirador de pó|po|robô|robo|lavadora|lava e seca|secadora|tanquinho|lavadora de alta pressão|pressao|ferro de passar|vaporizador|tábua|tabua de passar|varal|colchão|colchao|box|sommier|espuma|molas|ensacadas|pillow top|travesseiro|almofada|lençol|lencol|edredom|cobertor|manta|jogo de cama|fronha|protetor de colchão|colchao|tapete|passadeira|capacho|cortina|persiana|blackout|varão|varao|suporte de cortina|toalha de banho|rosto|piso|mesa|lavabo|tapete de banheiro|organizador de banheiro|saboneteira|porta escova|lixeira|cesto|cabideiro|prendedor|varal|clipes|cesto de roupa|organizador multiuso|prateleira|nicho|gaveteiro|porta objetos|porta jóias|joias|relógio|relogio de parede|mesa|despertador|porta retrato|espelho|moldura|vela|aromatizador|difusor|essência|essencia|incenso|perfume de ambiente|sachê|sache|purificador|umidificador|jardim|vaso|cachepot|regador|mangueira|aspersor|tesoura de poda|ancinho|pá|pa|rastelo|ferramentas de jardim|grama artificial|deck|piso externo|churrasqueira|grill|forno de pizza|mesa de jardim|cadeira de praia|espreguiçadeira|espreguicadeira|ombrelone|guarda sol|piscina inflável|inflavel|boia|filtro de piscina|bomba|cloro|tratamento|capa de piscina|rede de proteção|proteçao|tela/;
  if (casaWords.test(n)) scores.casa += 2;

  // ══════════════════════════════════════════════════════════════════════════
  // ESPORTES - Fitness, atividades físicas e equipamentos (expandido)
  // ══════════════════════════════════════════════════════════════════════════
  const esportesWords = /esporte|fitness|treino|workout|academia|gym|musculação|musculaçao|legging|calça|calça de compressão|compressao|top|sutiã|sutia|esportivo|shorts|bermuda|regata|camiseta dry fit|dry|segunda pele|meião|meiao|meia de compressão|compressao|munhequeira|joelheira|tornozeleira|cotoveleira|faixa de compressão|compressao|luva de treino|grip|tênis|tenis|corrida|running|caminhada|trail|training|crossfit|funcional|chuteira|futsal|society|campo|bicicleta|bike|speed|mountain bike|mtb|speed|gravel|fixa|aro|quadro|guidão|guidao|pedal|selim|capacete|ciclocomputador|velocímetro|velocimetro|garmin|cateye|esteira|ergométrica|ergometrica|elétrica|eletrica|dobrável|dobravel|transport|residencial|profissional|muscula|halteres|halter|peso|anilha|barra|supino|rosca|bíceps|biceps|tríceps|triceps|barra ?fixa|dominadas|pull up|paralela|dip|elástico|elastico|mini band|thera band|faixa de resistência|resistencia|loop|extensor|tensor|mat|tapete|yoga|pilates|eva|borracha|nbr|pvc|colchonete|kimono|gi|judô|judo|jiu.?jitsu|karatê|karate|taekwondo|luva de boxe|muay thai|saco de pancada|bandagem|protetor bucal|caneleira|shin guard|tornozeleira|peso|corda de pular|speed rope|jump rope|roda abdominal|ab wheel|kettlebell|girya|medicine ball|bola suíça|suica|gym ball|pilates ball|disco de equilíbrio|equilibrio|bosu|balance|step|aeróbico|aerobico|fitball|bola de pilates|bola medicinal|slam ball|wall ball|power ball|disco de deslize|slide|disco olimpico|olímpico|olimpico|crossfit|supino|leg press|agachamento|cadeira extensora|flexora|polia|cabo|máquina|maquina de musculação|musculaçao|banco de supino|suporte|rack|gaiola|power rack|smith machine|barra olímpica|olimpica|ez|reta|trap bar|barra hexagonal|colchão|colchao de salto|tatame|eva|crossfit|funcional|battle rope|corda naval|tnt|trx|fita de suspensão|suspensao|ab strap|alça|alca abdominal|pegada|hand grip|presilha|clip|abraçadeira|abracadeira|trava|corrente|chain|top fitness|regata machão|machao|cavada|fitness|dry fit|legging|suplex|poliamida|lycra|térmica|termica|segunda pele|bermuda de compressão|compressao|short de treino|moletom|agasalho|jaqueta|corta vento|quebra vento|tênis|tenis de corrida|caminhada|training|crossfit|minimalista|chuteira|society|campo|futsal|patins|inline|quad|skate|longboard|cruiser|penny|capacete|joelheira|cotoveleira|luva|proteção|proteçao|bicicleta|bike|speed|mtb|mountain bike|aro 29|26|700c|quadro|suspensão|suspensao|freio disco|v-brake|guidão|guidao|selim|banco|pedal|clip|plataforma|pneu|câmara|camara|corrente|cassete|catraca|câmbio|cambio|alavanca|manete|garrafa|squeeze|caramanhola|suporte|capacete|luvas|sapatilha|ciclismo|triathlon|natação|nataçao|óculos|oculos|touca|maiô|maio|sunga|prancha|pull buoy|nadadeira|pé de pato|pe|snorkel|respirador/;
  if (esportesWords.test(n)) scores.esportes += 2;

  // ══════════════════════════════════════════════════════════════════════════
  // BELEZA - Cosméticos, cuidados pessoais e higiene (expandido massivamente)
  // ══════════════════════════════════════════════════════════════════════════
  const belezaWords = /beleza|cosm|estética|estetica|perfume|fragr|fragrância|fragrancia|eau de parfum|eau de toilette|eau de cologne|colônia|colonia|desodorante|deo |antitranspirante|antiperspirante|aerosol|roll.?on|stick|creme|body splash|body spray|cabelo|shampoo|xampu|condicionador|máscara|mascara capilar|leave.?in|finalizador|creme de pentear|óleo|oleo capilar|argan|coco|rícino|ricino|soro|ampola|tratamento|reconstrução|reconstruçao|cauterização|cauterizaçao|hidratação|hidrataçao|nutrição|nutriçao|repositor de massa|botox|alisamento|progressiva|relaxamento|tintura|coloração|coloraçao|descoloração|descoloraçao|pó|po descolorante|água oxigenada|agua|oxidante|revelador|tinta|tonalizante|matizador|purple|roxo|prata|shampoo desamarelador|tônico|tonico|spray|modelador|gel|mousse|pomada|cera|finalizador|ativador de cachos|definidor|difusor|secador|hair dryer|modelador|babyliss|prancha|chapinha|alisadora|ondulador|escova|pente|raquete|detangler|pink|pele|skin care|limpeza|sabonete líquido|liquido|barra|facial|esfoliante|scrub|tônico|tonico facial|água micelar|agua|demaquilante|removedor|bifásico|bifasico|sérum|serum|vitamina c|ácido|acido hialurônico|hialuronico|niacinamida|retinol|aha|bha|glicólico|glicolico|salicílico|salicilico|mandélico|mandelico|hidratante|creme facial|gel creme|loção|loçao|protetor solar|fps|fator de proteção|proteçao|bloqueador|antioxidante|anti.?idade|anti rugas|anti sinais|firmador|tensor|lift|preenchedor|primer|base|base líquida|liquida|pó|po compacto|translúcido|translucido|iluminador|highlighter|strobing|corretivo|camuflagem|contorno|blush|bronzeador|pó de sol|sol|batom|gloss|lip gloss|tint|mancha lábios|labios|lápis|lapis de boca|delineador labial|esfoliante labial|hidratante labial|bálsamo|balsamo|manteiga de cacau|vaselina|maquiagem|make|paleta de sombras|sombra|primer de olhos|delineador|eyeliner|lápis|lapis de olho|kajal|kohl|máscara|mascara de cílios|cilios|rímel|rimel|curvex|modelador de cílios|cilios|cola|alongamento|extensão|extensao|cílios|cilios postiços|posticos|tufinho|sobrancelha|lápis|lapis|henna|brow|gel fixador|máscara|mascara de sobrancelha|esmalte|unha|esmaltação|esmalte em gel|gelificado|risqué|risque|colorama|impala|top coat|base coat|extra brilho|secante|removedor|acetona|algodão|algodao|lixa|palito|empurrador|cutícula|cuticula|alicate|cortador|kit de manicure|óleo|oleo de cutícula|cuticula|creme para mãos|maos e pés|pes|hidratante corporal|loção|loçao|manteiga corporal|óleo|oleo corporal|esfoliante corporal|bucha|luva|sabonete|gel de banho|shower gel|body wash|espuma|mousse|sabonete líquido|liquido|barra|íntimo|intimo|glicerina|vegetal|barra de massagem|massageador|desodorante corporal|body splash|body mist|talco|pó|po|depilação|depilaçao|cera|roll.?on|quente|fria|depilatório|depilatorio|creme|lâmina|lamina|gilete|aparelho|barbeador|carga|refil|espuma de barbear|gel|pós.?barba|pos|after shave|balm|loção|loçao|aparador|trimmer|máquina|maquina de cortar cabelo|barba|nariz|orelha|pelos|elétrica|eletrica|recarregável|recarregavel|escova de dentes|creme dental|pasta|fio dental|enxaguante|antisséptico|antisseptico|clareador|branqueador|listerine|colgate|oral.?b|colgate|close up|protetor labial|bálsamo|balsamo|fps|rosa mosqueta|óleo|oleo essencial|aromaterapia|essência|essencia|difusor|boticário|boticario|natura|avon|eudora|mary kay|o boticário|boticario|quasar|malbec|egeo|kaiak|humor|floratta|lily|nativa spa|chronos|lumina|tododia|mamãe|mamae e bebê|bebe|cuide.?se bem|plant|erva doce|águas|aguas de colônia|colonia/;
  if (belezaWords.test(n)) scores.beleza += 2;

  // ══════════════════════════════════════════════════════════════════════════
  // AUTOMOTIVO - Peças, acessórios e manutenção de veículos (expandido)
  // ══════════════════════════════════════════════════════════════════════════
  const automotivoWords = /carro|automóvel|automovel|veículo|veiculo|auto|automotivo|moto|motocicleta|ciclomotor|scooter|pneu|aro 13|14|15|16|17|18|19|20|radial|diagonal|remold|recauchutado|goodyear|pirelli|michelin|continental|bridgestone|dunlop|firestone|óleo|oleo de motor|lubrificante|sintético|sintetico|semissintético|semissintetico|mineral|5w30|10w40|15w40|20w50|sae|api|castrol|mobil|shell|petronas|valvoline|texaco|filtro de óleo|oleo|ar|combustível|combustivel|cabine|ar condicionado|polen|carvão|carvao ativado|bateria|bateria automotiva|60ah|70ah|80ah|100ah|moura|heliar|tudor|acdelco|bosch|limpador de para.?brisa|parabrisa|palheta|bracinho|lavador|esguicho|fluido|reservatório|reservatorio|vela de ignição|igniçao|ngk|bosch|champion|denso|iridium|platina|platinada|amortecedor|suspensão|suspensao|dianteiro|traseiro|cofap|monroe|nakata|axios|original|freio|freios|disco|tambor|pastilha|lona|sapata|cilindro mestre|servo|fluido de freio|dot 3|dot 4|pinça|pinça|correia dentada|poly v|alternador|acessórios|acessorios|tensor|polia|radiador|água|agua|sistema de arrefecimento|ventoinha|sensor|válvula|valvula termostática|termostatica|mangueira|abraçadeira|abracadeira|tampa|reservatório|reservatorio de expansão|expansao|bomba d'água|dagua|bomba de combustível|combustivel|mecânica|mecanica|elétrica|eletrica|turbina|turbo|coletor|escapamento|downpipe|intercooler|admissão|admissao|filtro esportivo|k&n|vela|cabo de vela|bobina|módulo|modulo de ignição|igniçao|central|injeção|injeçao eletrônica|eletronica|bico injetor|válvula|valvula borboleta|tbi|sensor map|maf|sonda lambda|tps|iac|alternador|motor de arranque|partida|marcha|bateria|borne|cabo|fusível|fusivel|relé|rele|chicote elétrico|eletrico|lanterna|farol|lâmpada|lampada|h1|h3|h4|h7|h11|hb3|hb4|led|xenon|super branca|lampada de freio|pisca|placa|seta|milha|neblina|auxiliar|farol auxiliar|barra de led|strobo|giroflex|adesivo|película|insulfilm|blackout|fumê|fume|g5|g20|g35|proteção|proteçao|antirrisco|coating|vitrificação|vitrificaçao|ppf|paint protection film|cera|cristalizador|selante|polish|massa de polir|boina|politriz|refinador|removedor de riscos|clay bar|descontaminante|shampoo automotivo|lava.?autos|espuma|cera líquida|liquida|silicone|revitalizador de plástico|plastico|pneu|pretinho|hidratante|aromatizante|cheirinho|perfume automotivo|little trees|odorizador|purificador|difusor|tapete|protetor|pvc|borracha|carpete|personalizado|capa de banco|couro|neoprene|courvin|universal|sob medida|volante|esportivo|racing|couro legítimo|legitimo|costura|cabo de câmbio|cambio|cambio|manopla|freio de mão|mao|organizador de porta malas|malas|caixa|rede elástica|elastica|kit emergência|emergencia|triângulo|triangulo|macaco|chave de roda|extintor|cabo de bateria|jumper|pinga|rolo compressor|fita isolante|arame|fixador|parafuso|porca|abraçadeira|abracadeira|suporte veicular|celular|gps|copo|porta.?copos|carregador veicular|usb|tipo c|wireless|sem fio|fm|transmissor|bluetooth|aux|dashcam|câmera|camera automotiva|dvr|visão|visao noturna|full hd|sensor de ré|re|estacionamento|frontal|traseiro|4 sensores|6|8|câmera|camera|display|alarme|rastreador|bloqueador|trava|antifurto|volante|pedal|câmbio|cambio|tetra|chave canivete|telecomando|controle|som automotivo|rádio|radio|cd|dvd|mp3|usb|bluetooth|android auto|apple carplay|pioneer|jvc|sony|kenwood|positron|roadstar|alto.?falante|falante|subwoofer|woofer|tweeter|triaxial|coaxial|módulo|modulo|amplificador|potência|potencia|taramps|stetsom|boog|hertz|6 polegadas|6x9|12|15|18|capacitor|bateria estacionária|estacionaria|inversor|conversor|voltímetro|voltimetro|fiação|fiaçao|cabos rca|chicote|moldura|painel|aplique|adesivo|cromado|fibra de carbono|envelopamento|wrap|película|vinil|spoiler|aerofólio|aerofolio|difusor|para.?choque|choque|defletor|calha de chuva|tg poli|fiat|ford|chevrolet|gm|volkswagen|vw|renault|peugeot|citroën|citroen|hyundai|toyota|honda|nissan|jeep|ram|aditivo|condicionador de metais|bardahl|wynn's|stp|militec|arexons|arla 32|líquido|liquido de arrefecimento|fluido de freio|direção|direçao hidráulica|hidraulica|limpa vidros|limpa para.?brisa|removedor de insetos|cera|cristalizador|polish|desengraxante|multiuso|silicone/;
  if (automotivoWords.test(n)) scores.automotivo += 2;

  // Ajustes de priorização (evita ambiguidade) — pilares recebem +1 extra
  if (/celular|smartphone|notebook|tv|monitor|console|playstation|xbox|nintendo/.test(n)) scores.tech += 1;
  if (/suplemento|whey|creatina|proteína|proteina|bcaa|vitamina|colágen|colagen/.test(n)) scores.saude += 1;
  if (/perfume|colônia|colonia|desodorante|shampoo|maquiagem|batom|esmalte|base líquida|base liquida|natura|refil/.test(n)) scores.beleza += 1;
  if (/carro|moto|motor|pneu|óleo|oleo|freio|amortecedor/.test(n)) scores.automotivo += 1;
  if (/liquidificador|geladeira|fogão|fogao|air ?fryer|microondas/.test(n)) scores.casa += 1;
  if (/legging|tênis|tenis de corrida|halteres|esteira|bicicleta/.test(n)) scores.esportes += 1;

  // Retorna a categoria com maior pontuação — SEMPRE em minúsculo
  let maxScore = -1;
  let bestCategory = 'casa'; // Fallback neutro em minúsculo

  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory; // ex: 'beleza', 'tech', 'saude', 'casa', 'esportes', 'automotivo'
}

// ── Gera tags enriquecidas a partir do título e categoria ──────────────────
// Retorna array de strings (já slugificadas, sem duplicatas)

function buildTags(title, category) {
  const tags = new Set();
  tags.add(category); // sempre inclui a categoria como tag principal

  const t = (title || '').toLowerCase();

  // Beleza / cabelo
  if (/cabelo|capilar|hair/.test(t))          tags.add('ca