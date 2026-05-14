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
import { fetchAmazon as fetchAmazonService } from './amazon-service.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60);
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
      file.on('finish', () => { file.close(); resolve(); });
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

function mapCategory(name) {
  const n = (name || '').toLowerCase();
  
  // Sistema de pontuação para categorias (quando há ambiguidade)
  const scores = {
    tech: 0,
    saude: 0,
    casa: 0,
    esportes: 0,
    beleza: 0,
    automotivo: 0
  };
  
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
  
  // Ajustes de priorização (evita ambiguidade)
  if (/celular|smartphone|notebook|tv|monitor|console|playstation|xbox|nintendo/.test(n)) scores.tech += 1;
  if (/suplemento|whey|creatina|proteína|proteina|bcaa|vitamina|colágen|colagen/.test(n)) scores.saude += 1;
  if (/perfume|colônia|colonia|desodorante|shampoo|maquiagem|batom|esmalte/.test(n)) scores.beleza += 1;
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
  if (/cabelo|capilar|hair/.test(t))          tags.add('cabelo');
  if (/shampoo|xampu/.test(t))                tags.add('shampoo');
  if (/condicionador/.test(t))                tags.add('condicionador');
  if (/máscara|mascara/.test(t))              tags.add('mascara-capilar');
  if (/leave.?in|finalizador/.test(t))        tags.add('finalizador');
  if (/kérastase|kerastase/.test(t))          tags.add('kerastase');
  if (/loreal|l'oréal/.test(t))              tags.add('loreal');
  if (/pantene/.test(t))                      tags.add('pantene');
  if (/tresemmé|treseme/.test(t))             tags.add('treseme');
  if (/reconstrução|reconstrucao/.test(t))    tags.add('reconstrucao');
  if (/hidratação|hidrataçao/.test(t))        tags.add('hidratacao');
  if (/perfume|fragrância|fragrancia/.test(t)) tags.add('perfume');
  if (/maquiagem|make/.test(t))               tags.add('maquiagem');
  if (/skincare|pele|facial/.test(t))         tags.add('skincare');

  // Tech
  if (/celular|smartphone/.test(t))           tags.add('smartphone');
  if (/notebook|laptop/.test(t))              tags.add('notebook');
  if (/fone|headphone|earbuds/.test(t))       tags.add('fone-de-ouvido');
  if (/tv |smart tv/.test(t))                 tags.add('smart-tv');
  if (/gamer/.test(t))                        tags.add('gamer');

  // Saúde
  if (/whey|proteína|proteina/.test(t))       tags.add('whey-protein');
  if (/suplemento/.test(t))                   tags.add('suplemento');
  if (/vitamina/.test(t))                     tags.add('vitamina');
  if (/creatina/.test(t))                     tags.add('creatina');

  // Esportes
  if (/bicicleta|bike/.test(t))               tags.add('bicicleta');
  if (/tênis|tenis de corrida/.test(t))       tags.add('tenis');
  if (/esteira/.test(t))                      tags.add('esteira');
  if (/yoga|pilates/.test(t))                 tags.add('yoga');

  // Casa
  if (/air ?fryer|fritadeira/.test(t))        tags.add('air-fryer');
  if (/cafeteira/.test(t))                    tags.add('cafeteira');
  if (/liquidificador/.test(t))               tags.add('liquidificador');
  if (/colchão|colchao/.test(t))              tags.add('colchao');

  // Automotivo
  if (/carro|auto/.test(t))                   tags.add('carro');
  if (/moto|motocicleta/.test(t))             tags.add('moto');
  if (/pneu/.test(t))                         tags.add('pneu');

  return [...tags];
}

function cleanTitle(title) {
  // Remove cores comuns (no final da string)
  const colors = [
    'Cinza', 'Cinza-escuro', 'Preto', 'Branco', 'Azul', 'Verde', 'Vermelho', 
    'Amarelo', 'Rosa', 'Roxo', 'Laranja', 'Marrom', 'Bege', 'Dourado',
    'Prata', 'Prateado', 'Grafite', 'Chumbo', 'Cobre'
  ];
  
  let cleaned = title;
  
  // Remove cores que aparecem no final (com ou sem espaço antes)
  const colorPattern = new RegExp(`\\s+(${colors.join('|')})$`, 'i');
  cleaned = cleaned.replace(colorPattern, '');
  
  // Remove tamanhos/unidades redundantes no final (ex: "200 Ml" se já está no meio do título)
  cleaned = cleaned.replace(/\s+(ml|cm|mm|kg|g|l)$/i, '');
  
  return cleaned.trim();
}

// ── Mercado Livre Scraping (fallback) ────────────────────────────────

async function fetchMLScraping(inputUrl, itemId) {
  console.log('   🔧 Usando scraping direto da página...');
  const res = await get(inputUrl);
  const body = res.body;

  // Título - múltiplas estratégias
  let title = 'Produto Mercado Livre';
  
  // Tenta JSON-LD primeiro
  const jsonLdMatch = body.match(/<script type="application\/ld\+json">({[^<]+product[^<]+})<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.name) title = data.name;
    } catch(e) {}
  }
  
  // Tenta Open Graph
  if (title === 'Produto Mercado Livre') {
    const ogMatch = body.match(/<meta[^>]+property="og:title"[^>]+content="([^"]{5,200})"/);
    if (ogMatch) title = ogMatch[1].trim().replace(/ \| Mercado Livre$/i, '');
  }
  
  // Tenta title tag
  if (title === 'Produto Mercado Livre') {
    const titleMatch = body.match(/<title>([^<|]{5,200})/);
    if (titleMatch) title = titleMatch[1].trim().replace(/ \| Mercado Livre$/i, '');
  }
  
  // Tenta H1
  if (title === 'Produto Mercado Livre') {
    const h1Match = body.match(/<h1[^>]*>([^<]{5,200})<\/h1>/);
    if (h1Match) title = h1Match[1].trim();
  }

  // Imagem - múltiplas estratégias
  let imageUrl = '';
  const imgMatch = 
    body.match(/"image":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/) ||
    body.match(/"secure_url":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/) ||
    body.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
    body.match(/"url":"(https:\/\/http2\.mlstatic\.com[^"]+\.(?:jpg|webp))"/);
  
  if (imgMatch) {
    imageUrl = imgMatch[1]
      .replace(/-[A-Z]\.(?:jpg|webp)$/, '-F.webp')
      .replace(/\.webp$/, '.webp');
  }

  // Specs básicos
  const specs = [];
  const attrsMatches = body.matchAll(/<dt[^>]*>([^<]{2,50})<\/dt>\s*<dd[^>]*>([^<]{1,80})<\/dd>/g);
  for (const m of attrsMatches) {
    if (specs.length < 6 && !['Linha','Cor','Modelo','Marca'].includes(m[1].trim())) {
      specs.push(`- **${m[1].trim()}:** ${m[2].trim()}`);
    }
  }

  const category = mapCategory(title);
  return {
    title: cleanTitle(title.replace(/\s+/g, ' ')).slice(0, 150),
    description: `Conheça o ${cleanTitle(title)}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
    category,
    tags: buildTags(title, category),
    imageUrl, specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ── Mercado Livre (API oficial) ───────────────────────────────────────

async function fetchML(inputUrl) {
  console.log('🛒  Mercado Livre detectado...');
  const res = await get(inputUrl);
  const fullText = (res.headers.location || '') + res.body + inputUrl;
  const match = fullText.match(/MLB-?(\d{6,12})/i);
  if (!match) throw new Error('Não encontrei o ID. Use a URL completa da página do produto.');
  const itemId = 'MLB' + match[1];
  console.log('   ID:', itemId);

  const api = await get(`https://api.mercadolibre.com/items/${itemId}`);
  if (api.status !== 200) {
    console.log(`   ⚠️  API retornou ${api.status}, tentando scraping direto...`);
    // Fallback: scraping da página
    return await fetchMLScraping(inputUrl, itemId);
  }
  const item = JSON.parse(api.body);

  const pics = item.pictures || [];
  const imageUrl = pics.length
    ? (pics[0].url || pics[0].secure_url || '').replace(/-[A-Z]\.webp$/, '-F.webp')
    : '';

  const specs = (item.attributes || [])
    .filter(a => a.value_name && !['Linha','Cor','Modelo','Marca'].includes(a.name))
    .slice(0, 6)
    .map(a => `- **${a.name}:** ${a.value_name}`);

  let categoryNameFromApi = '';
  try {
    const c = await get(`https://api.mercadolibre.com/categories/${item.category_id}`);
    if (c.status === 200) categoryNameFromApi = JSON.parse(c.body).name;
  } catch(_) {}

  const combinedCategoryText = `${item.title} ${categoryNameFromApi}`.trim();
  const category = mapCategory(combinedCategoryText);

  return {
    title: cleanTitle(item.title),
    description: `Conheça o ${cleanTitle(item.title)}. Disponível no Mercado Livre com entrega rápida para todo o Brasil.`,
    category,
    tags: buildTags(item.title, category),
    imageUrl, specs,
    store: 'Mercado Livre',
    affiliateUrl: inputUrl,
  };
}

// ── Amazon — usa amazon-service.js (PA-API + scraping melhorado) ──────────

async function fetchAmazon(inputUrl) {
  return await fetchAmazonService(inputUrl, { mapCategory, buildTags, cleanTitle });
}

// ── Magalu (scraping) ───────────────────────────────────────────────

async function fetchMagalu(inputUrl) {
  console.log('🏪  Magalu detectado...');
  const res  = await get(inputUrl);
  const body = res.body;

  // Título — vários padrões possíveis
  const titleM =
    body.match(/<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]{5,200})<\/h1>/) ||
    body.match(/<h1[^>]*>([^<]{5,200})<\/h1>/) ||
    body.match(/"name":"([^"]{5,200})"/) ||
    body.match(/<title>([^<|]{5,120})/);
  const title = titleM
    ? titleM[1].trim().replace(/\s+/g,' ').replace(/ - Magazine Luiza.*/i,'').replace(/ \| Magalu.*/i,'')
    : 'Produto Magalu';

  // Imagem — tenta JSON-LD e meta tags
  const imgM =
    body.match(/"image":\s*"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/) ||
    body.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
    body.match(/src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/);
  const imageUrl = imgM ? imgM[1] : '';

  // Specs da tabela de características
  const specs = [];
  const rows  = body.matchAll(/<tr[^>]*>[\s\S]*?<th[^>]*>([^<]{3,60})<\/th>[\s\S]*?<td[^>]*>([^<]{1,100})<\/td>[\s\S]*?<\/tr>/g);
  for (const m of rows) {
    if (specs.length < 6) specs.push(`- **${m[1].trim()}:** ${m[2].trim()}`);
  }

  // Descrição via meta
  const descM = body.match(/<meta[^>]+name="description"[^>]+content="([^"]{10,200})"/);
  const description = descM
    ? descM[1].trim()
    : `Conheça o ${title}. Disponível no Magalu com entrega rápida.`;

  const category = mapCategory(title);
  return {
    title: cleanTitle(title),
    description,
    category,
    tags: buildTags(title, category),
    imageUrl, specs,
    store: 'Magalu',
    affiliateUrl: inputUrl,
  };
}

// ── Gera markdown com IA ──────────────────────────────────────────────────

async function generateMarkdown(produto, imageFile, slug) {
  const { title, description, category, tags, store, affiliateUrl } = produto;
  
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Seleciona arquetipo baseado no produto
  const arquetipo = selecionarArquetipo(title);
  console.log(`   📚 Arquétipo: ${ARQUETIPOS[arquetipo].nome}`);
  
  // 2. Gera variações de conteúdo
  const variacoes = gerarContextoVariacoes(produto, arquetipo);
  
  // 3. Busca contexto via Serper (opcional)
  let contextoSerper = null;
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey && serperKey !== 'sua-key-serper-aqui') {
    try {
      contextoSerper = await buscarContextoProduto(title, category, serperKey);
    } catch (e) {
      console.log('   ⚠️  Serper indisponível, continuando sem contexto externo');
    }
  }
  
  // 4. Gera conteúdo via Groq
  const groqKey = process.env.GROQ_API_KEY;
  let conteudoGerado;
  
  try {
    conteudoGerado = await gerarConteudoPost(
      produto,
      ARQUETIPOS[arquetipo],
      variacoes,
      contextoSerper,
      groqKey
    );
  } catch (error) {
    console.log(`   ⚠️  Erro no Groq: ${error.message}`);
    // Fallback: conteúdo básico
    conteudoGerado = gerarConteudoBasico(produto, variacoes);
  }
  
  // 5. Valida e corrige conteúdo
  let conteudoFinal = corrigirAutomatico(conteudoGerado);
  const validacao = validarConteudo(conteudoFinal);
  
  if (!validacao.aprovado) {
    console.log('   ⚠️  Conteúdo precisa de revisão manual');
  }
  
  // 6. Monta markdown completo com frontmatter
  // category e tags SEMPRE em minúsculo para bater com filtros do Astro
  const descricaoFinal = description.replace(/"/g, "'").slice(0, 155);
  const tagsFormatted = (tags && tags.length > 0 ? tags : [category]).join(', ');
  
  return `---
title: "${title.replace(/"/g, "'")}"
description: "${descricaoFinal}"
date: ${today}
category: ${category}
image: /images/posts/${imageFile}
tags: [${tagsFormatted}]
draft: false
affiliateUrl: "${affiliateUrl}"
productImage: /images/posts/${imageFile}
---

${conteudoFinal}

---

*Links deste post são afiliados. Você não paga nada a mais, mas nos ajuda a manter o site gratuito.*
`;
}

// ── Fallback: conteúdo básico ─────────────────────────────────────────────

function gerarConteudoBasico(produto, variacoes) {
  const { title, description, specs, store } = produto;
  const emoji = { 'Mercado Livre': '🛒', 'Amazon': '📦', 'Magalu': '🏪' }[store] || '🛍️';
  
  const specsBlock = specs && specs.length > 0
    ? `\n## Especificações Principais\n\n${specs.join('\n')}\n`
    : '';
  
  return `${variacoes.abertura}

${title} é um produto disponível no ${store} com entrega rápida para todo o Brasil.

${specsBlock}

## Vale a Pena?

${variacoes.transicao}

${description}

## Como Comprar

${variacoes.fechamento}. ${variacoes.cta.gatilho}.

${emoji} ${variacoes.cta.texto}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const inputUrl = process.argv[2];

  if (!inputUrl) {
    console.log('\n✨  AchadoCertoVIP — Gerador de Posts');
    console.log('\nUso:  npm run post "<url-afiliado>"');
    console.log('\nExemplos:');
    console.log('  npm run post "https://www.mercadolivre.com.br/..."  ← Mercado Livre');
    console.log('  npm run post "https://amzn.to/xyz"                  ← Amazon');
    console.log('  npm run post "https://www.magazineluiza.com.br/..." ← Magalu\n');
    process.exit(0);
  }

  const platform = detectPlatform(inputUrl);
  if (platform === 'unknown') {
    console.error('\n❌ Plataforma não reconhecida.');
    console.error('Links suportados: mercadolivre.com.br | amzn.to | amazon.com.br | magazineluiza.com.br\n');
    process.exit(1);
  }

  // 1. Busca produto
  let product;
  try {
    if      (platform === 'ml')     product = await fetchML(inputUrl);
    else if (platform === 'amazon') product = await fetchAmazon(inputUrl);
    else if (platform === 'magalu') product = await fetchMagalu(inputUrl);
    else                             throw new Error('Plataforma desconhecida');
  } catch (err) {
    console.error('\n❌ Erro ao buscar produto:', err.message, '\n');
    process.exit(1);
  }

  const slug = slugify(product.title);
  console.log('\n📝 Título    :', product.title);
  console.log('📂 Categoria :', product.category);
  console.log('🏷️  Tags      :', product.tags.join(', '));
  console.log('🔗 Slug      :', slug);

  // 2. Baixa imagem
  const imgDir  = path.join(process.cwd(), 'public', 'images', 'posts');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

  let imageFile = `${slug}.webp`;
  const imgPath = path.join(imgDir, imageFile);

  if (product.imageUrl) {
    try {
      process.stdout.write('🖼️  Baixando imagem... ');
      await downloadImage(product.imageUrl, imgPath);
      console.log('✅');
    } catch (err) {
      console.warn('⚠️  Não foi possível baixar a imagem:', err.message);
      imageFile = 'placeholder.webp';
    }
  } else {
    console.warn('⚠️  Nenhuma imagem encontrada, usando placeholder.');
    imageFile = 'placeholder.webp';
  }

  // 3. Gera .md com IA
  console.log('🤖 Gerando conteúdo...');
  const md     = await generateMarkdown(product, imageFile, slug);
  const mdDir  = path.join(process.cwd(), 'src', 'content', 'blog');
  const mdPath = path.join(mdDir, `${slug}.md`);

  if (fs.existsSync(mdPath)) {
    // Move backup para pasta .backups/ (não commitada)
    const backupDir = path.join(process.cwd(), '.backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const bak = path.join(backupDir, `${slug}-bak-${Date.now()}.md`);
    fs.renameSync(mdPath, bak);
    console.log('⚠️  Post já existia, backup criado.');
  }
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('📎  Post criado  :', mdPath);

  // 4. Git: add + commit + push
  console.log('🚀  Publicando...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "post: ${slug}"`, { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log(`\n✅  PRONTO! Post publicado.`);
    console.log(`🌍  URL: https://achadocerto.vip/blog/${slug}\n`);
  } catch (_) {
    console.log('\n📎  Arquivo gerado. Rode manualmente:');
    console.log(`   git add . && git commit -m "post: ${slug}" && git push\n`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
