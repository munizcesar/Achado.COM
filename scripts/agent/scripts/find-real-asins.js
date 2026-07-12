#!/usr/bin/env node
/**
 * find-real-asins.js — Busca ASINs reais via Serper para todos os produtos do catálogo
 * AchadoCerto.VIP
 *
 * Uso:
 *   node scripts/agent/scripts/find-real-asins.js
 *
 * Para cada produto inexistente (HTTP 404), busca no Google:
 *   site:amazon.com.br/dp/ "nome do produto"
 * e extrai o ASIN da primeira URL de produto encontrada.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const AGENT_DIR   = path.resolve(__dirname, '..');
const CATALOG_DIR = path.join(AGENT_DIR, 'catalog');

config({ path: path.resolve(AGENT_DIR, '..', '..', 'backend', '.env') });

const SERPER_KEY = process.env.SERPER_API_KEY;
const TIMEOUT_MS = 10000;

// ── HTTP helpers ──────────────────────────────────────────────

async function httpGet(urlStr) {
  return new Promise((resolve) => {
    const lib = urlStr.startsWith('https') ? https : http;
    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: TIMEOUT_MS,
    }, (res) => {
      // Segue redirects (Amazon redireciona produtos válidos)
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        // Segue apenas 1 redirect para não cair em loop
        const lib2 = res.headers.location.startsWith('https') ? https : http;
        lib2.get(res.headers.location, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: TIMEOUT_MS,
        }, (res2) => {
          let data = '';
          res2.on('data', c => data += c);
          res2.on('end', () => resolve({ status: res2.statusCode, body: data.slice(0, 5000) }));
        }).on('error', () => resolve({ status: 0, body: '' }))
          .on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 5000) }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
  });
}

function asinFromUrl(url) {
  // Amazon URLs: /dp/B0XXXXX or /product/B0XXXXX or /gp/product/B0XXXXX
  const m = url.match(/\/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
  return m ? m[1] : null;
}

// ── Serper search ─────────────────────────────────────────────

function serperSearch(query) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ q: query, gl: 'br', hl: 'pt-br', num: 5 });
    const req = https.request({
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(null); }
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

async function findAsinOnAmazon(productName) {
  // Tenta 3 estratégias de busca
  const queries = [
    `site:amazon.com.br/dp/ "${productName}"`,
    `site:amazon.com.br "${productName}"`,
    `amazon.com.br ${productName} comprar`,
  ];

  for (const query of queries) {
    const result = await serperSearch(query);
    if (!result || !result.organic) continue;

    for (const item of result.organic) {
      const link = item.link || '';
      const asin = asinFromUrl(link);
      if (asin) {
        // Verifica se o ASIN realmente existe
        const checkUrl = `https://www.amazon.com.br/dp/${asin}`;
        const check = await httpGet(checkUrl);
        if (check.status === 200) {
          return { asin, title: item.title || '', url: checkUrl };
        }
        if (check.status === 0) {
          // Timeout/erro de rede - assume que pode ser válido
          return { asin, title: item.title || '', url: checkUrl, uncertain: true };
        }
      }
    }
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('🔍 FINDER DE ASINs REAIS — AchadoCerto.VIP');
  console.log('='.repeat(60));

  if (!SERPER_KEY || SERPER_KEY === 'sua-key-serper-aqui') {
    console.error('❌ SERPER_API_KEY não configurada no backend/.env');
    process.exit(1);
  }

  const pillars = ['beleza', 'saude', 'casa'];
  let totalFound = 0;
  let totalNotFound = 0;
  let totalSkipped = 0;
  let totalUncertain = 0;

  for (const pillar of pillars) {
    const filepath = path.join(CATALOG_DIR, `${pillar}.json`);
    const products = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    console.log(`\n📋 ${pillar.toUpperCase()} — ${products.length} produtos`);
    console.log('-'.repeat(40));

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const asin = product.asin;
      const name = product.nome;

      process.stdout.write(`  ${i + 1}/${products.length} ${asin} — ${name.slice(0, 35).padEnd(35)} `);

      // Verifica se o ASIN atual já existe
      const checkUrl = `https://www.amazon.com.br/dp/${asin}`;
      const check = await httpGet(checkUrl);

      if (check.status === 200) {
        process.stdout.write('✅ Já válido\n');
        totalSkipped++;
        continue;
      }

      // Busca novo ASIN via Serper
      process.stdout.write('🔍 buscando... ');
      const found = await findAsinOnAmazon(name);

      if (found) {
        const oldAsin = product.asin;
        product.asin = found.asin;
        const certainty = found.uncertain ? '⚠️' : '✅';
        process.stdout.write(`${certainty} ${found.asin}\n`);
        totalFound++;

        // Verifica se o Serper respondeu com um título melhor
        if (found.title && found.title.length > 5 && found.title.length < 200) {
          console.log(`       Título Amazon: "${found.title.slice(0, 80)}"`);
        }

        if (found.uncertain) {
          totalUncertain++;
          console.log('       ⚠️  ASIN encontrado mas página não respondeu (timeout) — pode ser válido');
        }
      } else {
        process.stdout.write('❌ Não encontrado\n');
        totalNotFound++;
      }

      // Pequena pausa entre requisições para não sobrecarregar
      await new Promise(r => setTimeout(r, 500));
    }

    // Salva catálogo atualizado
    fs.writeFileSync(filepath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`  💾 Catálogo ${pillar}.json atualizado`);
  }

  // ── Resumo ──────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`  ✅ Já válidos (mantidos): ${totalSkipped}`);
  console.log(`  🔍 Substituídos:         ${totalFound}`);
  console.log(`  ❌ Não encontrados:      ${totalNotFound}`);
  if (totalUncertain > 0) {
    console.log(`  ⚠️  Incertos (timeout):   ${totalUncertain}`);
  }
  console.log(`\n  Total: ${totalFound + totalNotFound + totalSkipped} produtos`);
}

main().catch(err => console.error('🔴 ERRO:', err));
