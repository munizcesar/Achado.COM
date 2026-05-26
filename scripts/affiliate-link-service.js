/**
 * affiliate-link-service.js
 * 
 * Gera links de afiliado do Mercado Livre com Tracking ID automaticamente
 * usando Puppeteer (simula acesso ao Portal do Afiliado)
 * 
 * Usa credenciais salvas ou cookies para evitar login sempre
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const COOKIES_FILE = path.join(process.cwd(), 'data', 'ml-cookies.json');

// ── Criar diretório data se não existir ────────────────────────────────────
function ensureDataDir() {
  const dir = path.dirname(COOKIES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Salvar cookies para reutilizar ────────────────────────────────────────
async function saveCookies(page) {
  const cookies = await page.cookies();
  ensureDataDir();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log('   💾 Cookies salvos para próximas execuções');
}

// ── Carregar cookies salvos ────────────────────────────────────────────────
async function loadCookies(page) {
  if (fs.existsSync(COOKIES_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
    await page.setCookie(...cookies);
    return true;
  }
  return false;
}

// ── Gerar link de afiliado com Tracking ID ────────────────────────────────
export async function generateAffiliateLink(productUrl, trackingTag = 'achadocerto-vip') {
  console.log(`   🔗 Gerando link de afiliado para: ${productUrl.slice(0, 60)}...`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    // Tenta carregar cookies salvos
    const hasCookies = await loadCookies(page);
    if (hasCookies) {
      console.log('   ✅ Usando cookies salvos (login automático)');
    }

    // Acessa o Gerador de Links do Portal do Afiliado
    const generatorUrl = 'https://afiliados.mercadolivre.com.br/gerar-links';
    console.log(`   → Acessando: ${generatorUrl}`);
    
    await page.goto(generatorUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Verifica se está logado
    const isLoggedIn = await page.evaluate(() => {
      return document.body.innerText.includes('Olá') || 
             document.body.innerText.includes('Meus Links') ||
             document.querySelector('[data-testid="menu-user"]') !== null;
    });

    if (!isLoggedIn) {
      console.log('   ⚠️  Sessão expirada. Precisa fazer login manual.');
      console.log('   📝 Verifique suas credenciais em backend/.env:');
      console.log('      ML_EMAIL=seu@email.com');
      console.log('      ML_PASSWORD=sua_senha');
      await browser.close();
      return null;
    }

    // Preenche o campo de URL do produto
    const inputSelector = 'input[placeholder*="Cole o link"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.click(inputSelector);
    await page.keyboard.type(productUrl);
    console.log('   ✅ URL do produto inserida');

    // Seleciona o Tracking ID (Etiqueta)
    const selectSelector = 'select, [role="listbox"], [role="combobox"]';
    await page.waitForTimeout(1000);
    
    // Tenta encontrar e clicar na opção de rastreamento
    const trackingElements = await page.evaluate((tag) => {
      const selects = Array.from(document.querySelectorAll('select, [role="listbox"], [role="combobox"]'));
      return selects.map(el => el.textContent).filter(t => t.includes(tag) || t.includes('rastreamento'));
    }, trackingTag);

    if (trackingElements.length > 0) {
      await page.click(selectSelector);
      await page.keyboard.type(trackingTag);
      console.log(`   ✅ Tracking ID "${trackingTag}" selecionado`);
    }

    // Clica em "Gerar Link"
    const generateBtn = await page.$('button:has-text("Gerar"), button[type="submit"]');
    if (generateBtn) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
    }

    // Raspa o link gerado
    const generatedLink = await page.evaluate(() => {
      // Tenta encontrar o link em diferentes locais
      const linkInput = document.querySelector('input[value*="bit.ly"], input[value*="mercadolivre.com"]');
      if (linkInput) return linkInput.value;

      const linkText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent && el.textContent.includes('bit.ly')
      );
      if (linkText) return linkText.textContent.trim();

      return null;
    });

    if (generatedLink) {
      console.log(`   ✅ Link de afiliado gerado: ${generatedLink}`);
      await saveCookies(page);
      await browser.close();
      return generatedLink;
    } else {
      console.log('   ⚠️  Não consegui raspar o link gerado');
      console.log('   💡 Alternativa: Usando URL com parâmetro UTM (menos confiável)');
      await browser.close();
      return addUTMParameter(productUrl, trackingTag);
    }

  } catch (err) {
    console.log(`   ⚠️  Erro ao gerar link: ${err.message}`);
    if (browser) await browser.close();
    
    // Fallback: retorna URL com parâmetro UTM
    console.log('   💡 Usando fallback com parâmetro UTM');
    return addUTMParameter(productUrl, trackingTag);
  }
}

// ── Fallback: Adiciona parâmetro UTM à URL ────────────────────────────────
function addUTMParameter(url, trackingTag) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', 'achadocertovip');
    urlObj.searchParams.set('utm_medium', trackingTag);
    urlObj.searchParams.set('utm_campaign', 'auto-posts');
    return urlObj.toString();
  } catch {
    return url;
  }
}

// ── Testa a função ──────────────────────────────────────────────────────
if (process.argv[2] === '--test') {
  const testUrl = 'https://produto.mercadolivre.com.br/MLB-4787968949-cafeteira-italiana-inox-6-xicaras-preto-_JM';
  generateAffiliateLink(testUrl).then(link => {
    console.log('\n📊 Resultado:', link);
    process.exit(0);
  });
}
