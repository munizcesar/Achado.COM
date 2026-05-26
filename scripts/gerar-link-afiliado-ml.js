/**
 * gerar-link-afiliado-ml.js
 * 
 * Gera links de afiliado do Mercado Livre via Portal do Afiliado
 * Usa Puppeteer para automatizar o preenchimento do formulário
 * 
 * USO:
 *   node scripts/gerar-link-afiliado-ml.js "MLB-123456789" "muc1576372"
 *   node scripts/gerar-link-afiliado-ml.js "0B1VX3-P3A0" "muc1576372"
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COOKIES_FILE = path.join(__dirname, '..', 'data', 'ml-auth-cookies.json');

// ── Garantir diretório de cookies ──────────────────────────────────────────
function ensureDataDir() {
  const dir = path.dirname(COOKIES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Salvar cookies para reutilizar ─────────────────────────────────────────
async function saveCookies(page) {
  const cookies = await page.cookies();
  ensureDataDir();
  fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2));
  console.log('   💾 Cookies salvos para próximas execuções');
}

// ── Carregar cookies salvos ────────────────────────────────────────────────
async function loadCookies(page) {
  if (fs.existsSync(COOKIES_FILE)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf8'));
      if (Array.isArray(cookies) && cookies.length > 0) {
        await page.setCookie(...cookies);
        return true;
      }
    } catch (err) {
      console.log('   ⚠️  Cookies inválidos, fazendo login novamente...');
    }
  }
  return false;
}

// ── Gerar link de afiliado via Portal ──────────────────────────────────────
export async function gerarLinkAfiliadoML(productId, etiqueta = 'achadocertovip') {
  console.log(`🔗 Gerando link de afiliado para: ${productId}`);
  console.log(`   Etiqueta: ${etiqueta}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    await page.setViewport({ width: 1280, height: 720 });

    // Tenta carregar cookies salvos (login automático)
    const hasCookies = await loadCookies(page);
    if (hasCookies) {
      console.log('   ✅ Usando cookies salvos (login automático)');
    }

    // Acessa o Gerador de Links
    const generatorUrl = 'https://afiliados.mercadolivre.com.br/gerar-links';
    console.log(`   → Acessando: ${generatorUrl}`);

    const response = await page.goto(generatorUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    if (!response || ![200, 304].includes(response.status())) {
      console.log(`   ⚠️  Erro de acesso (${response?.status()})`);
      await browser.close();
      return null;
    }

    // Aguarda a página carregar
    await new Promise(r => setTimeout(r, 2000));

    // Verifica se está logado
    const isLoggedIn = await page.evaluate(() => {
      const pageContent = document.body.innerText;
      return (
        !pageContent.includes('Faça login') &&
        !pageContent.includes('Entrar em sua conta')
      );
    });

    if (!isLoggedIn) {
      console.log('   ❌ Não está logado. Faça login manualmente primeiro:');
      console.log('      https://afiliados.mercadolivre.com.br/gerar-links');
      await browser.close();
      return null;
    }

    console.log('   ✅ Logado no Portal de Afiliados');

    // Preenche o campo de ID do produto
    console.log('   → Preenchendo ID do produto...');
    
    const inputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map((el, idx) => ({
        idx,
        type: el.type,
        placeholder: el.placeholder,
        value: el.value,
      }));
    });

    console.log('   📋 Inputs encontrados:', inputs);

    // Tenta preencher via seletor genérico
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      // Procura por input de produto ou ID
      for (const input of inputs) {
        if (
          input.placeholder?.includes('produto') ||
          input.placeholder?.includes('ID') ||
          input.name?.includes('id') ||
          input.name?.includes('producto')
        ) {
          return input;
        }
      }
      return null;
    });

    // Se encontrou, preenche
    const filled = await page.evaluate((productId) => {
      const inputs = document.querySelectorAll('input');
      for (const input of inputs) {
        if (
          input.placeholder?.toLowerCase().includes('id') ||
          input.placeholder?.toLowerCase().includes('produto') ||
          input.className?.includes('product')
        ) {
          input.focus();
          input.value = productId;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, productId);

    if (!filled) {
      console.log('   ⚠️  Não consegui encontrar o campo de ID');
      console.log('   💡 Tente preencher manualmente no portal');
      await browser.close();
      return null;
    }

    console.log('   ✅ ID do produto preenchido');
    await new Promise(r => setTimeout(r, 1000));

    // Tenta selecionar a etiqueta
    console.log(`   → Selecionando etiqueta: ${etiqueta}`);
    const etiquetaSelecionada = await page.evaluate((tag) => {
      const selects = document.querySelectorAll('select, [role="listbox"]');
      for (const sel of selects) {
        if (sel.textContent.includes(tag)) {
          sel.click();
          return true;
        }
      }
      // Tenta por options
      const options = document.querySelectorAll('option, [role="option"]');
      for (const opt of options) {
        if (opt.textContent.includes(tag)) {
          opt.click();
          return true;
        }
      }
      return false;
    }, etiqueta);

    if (etiquetaSelecionada) {
      console.log('   ✅ Etiqueta selecionada');
    } else {
      console.log(`   ⚠️  Etiqueta "${etiqueta}" não encontrada`);
    }

    // Clica no botão "Gerar Link"
    console.log('   → Clicando em "Gerar Link"...');
    const clicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (
          btn.textContent.toLowerCase().includes('gerar') ||
          btn.textContent.toLowerCase().includes('generate')
        ) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!clicked) {
      console.log('   ⚠️  Não consegui clicar no botão');
      await browser.close();
      return null;
    }

    // Aguarda o resultado
    console.log('   ⏳ Aguardando resultado...');
    await new Promise(r => setTimeout(r, 3000));

    // Raspa o link gerado
    const gerarLinkResult = await page.evaluate(() => {
      // Procura por links encurtados (meli.la, bit.ly, etc)
      const allText = document.body.innerText;
      
      // Padrões de links encurtados do ML
      const linkPatterns = [
        /https:\/\/meli\.la\/[^\s"]*/gi,
        /https:\/\/bit\.ly\/[^\s"]*/gi,
        /https:\/\/mercadolivre\.com\.br\/[^\s"]*/gi,
      ];

      for (const pattern of linkPatterns) {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
          return matches[0].trim();
        }
      }

      // Tenta por input com o link
      const inputs = document.querySelectorAll('input[value*="meli"]');
      if (inputs.length > 0) {
        return inputs[0].value;
      }

      return null;
    });

    if (gerarLinkResult) {
      console.log(`   ✅ Link gerado: ${gerarLinkResult}`);
      await saveCookies(page);
      await browser.close();
      return gerarLinkResult;
    } else {
      console.log('   ❌ Não consegui raspar o link gerado');
      console.log('   💡 Verifique manualmente no portal');
      await browser.close();
      return null;
    }

  } catch (err) {
    console.log(`   ⚠️  Erro: ${err.message}`);
    if (browser) await browser.close();
    return null;
  }
}

// ── Teste CLI ──────────────────────────────────────────────────────────────
if (process.argv[2]) {
  const productId = process.argv[2];
  const etiqueta = process.argv[3] || 'achadocertovip';

  gerarLinkAfiliadoML(productId, etiqueta).then((link) => {
    if (link) {
      console.log(`\n✅ Link final: ${link}`);
    } else {
      console.log('\n❌ Falha ao gerar link');
      process.exit(1);
    }
  });
}

export default gerarLinkAfiliadoML;
