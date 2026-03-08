/**
 * Serper.dev Service - Busca no Google com Fallback Inteligente
 * AchadoCerto.VIP
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTADOR_PATH = path.join(__dirname, '.serper-usage.json');
const LIMITE_SEGURANCA = 2400; // Avisa 100 antes do limite de 2500

/**
 * Carrega contador de uso
 */
function carregarContador() {
  try {
    if (fs.existsSync(CONTADOR_PATH)) {
      return JSON.parse(fs.readFileSync(CONTADOR_PATH, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️  Erro ao ler contador Serper:', e.message);
  }
  return { total: 0, mes_atual: new Date().getMonth(), logs: [] };
}

/**
 * Salva contador de uso
 */
function salvarContador(contador) {
  try {
    // Reset se mudou de mês (Serper é 2500/mês)
    const mesAtual = new Date().getMonth();
    if (contador.mes_atual !== mesAtual) {
      contador.total = 0;
      contador.mes_atual = mesAtual;
      contador.logs = [];
    }
    fs.writeFileSync(CONTADOR_PATH, JSON.stringify(contador, null, 2));
  } catch (e) {
    console.warn('⚠️  Erro ao salvar contador Serper:', e.message);
  }
}

/**
 * Faz requisição para Serper.dev
 */
function serperRequest(query, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ q: query, gl: 'br', hl: 'pt-br', num: 5 });
    
    const options = {
      hostname: 'google.serper.dev',
      path: '/search',
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else if (res.statusCode === 403 || res.statusCode === 429) {
          reject(new Error('QUOTA_EXCEEDED'));
        } else {
          reject(new Error(`Serper retornou ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout Serper'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Busca contexto enriquecido do produto
 */
export async function buscarContextoProduto(produtoNome, categoria, apiKey) {
  const contador = carregarContador();

  // Verifica limite
  if (contador.total >= LIMITE_SEGURANCA) {
    console.log(`⚠️  Serper: ${contador.total}/2500 consultas usadas este mês`);
    console.log('   💡 Usando apenas dados da API do marketplace');
    return null; // Fallback para ML API
  }

  if (!apiKey || apiKey === 'sua-key-serper-aqui') {
    console.log('   💡 Serper não configurado, usando apenas dados do marketplace');
    return null;
  }

  try {
    console.log(`   🔍 Buscando contexto via Serper (${contador.total}/2500)...`);

    // Faz 3 buscas estratégicas
    const queries = [
      `${produtoNome} avaliação vale a pena`,
      `${produtoNome} ${categoria} opinião compradores`,
      `${produtoNome.split(' ').slice(0, 2).join(' ')} reclame aqui`
    ];

    const resultados = await Promise.allSettled(
      queries.map(q => serperRequest(q, apiKey))
    );

    // Extrai snippets úteis
    const contexto = {
      avaliacoes: [],
      mencoes_positivas: [],
      mencoes_negativas: [],
      contexto_mercado: []
    };

    resultados.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value.organic) {
        res.value.organic.slice(0, 3).forEach(item => {
          const snippet = item.snippet || '';
          
          if (idx === 0 && snippet) contexto.avaliacoes.push(snippet);
          if (idx === 1 && snippet) contexto.mencoes_positivas.push(snippet);
          if (idx === 2 && snippet) {
            if (/nota|reputação|avaliação|score/i.test(snippet)) {
              contexto.contexto_mercado.push(snippet);
            }
          }
        });
      }
    });

    // Atualiza contador
    contador.total += queries.length;
    contador.logs.push({
      data: new Date().toISOString(),
      produto: produtoNome.slice(0, 50),
      consultas: queries.length
    });
    salvarContador(contador);

    console.log(`   ✅ Contexto enriquecido obtido (${contador.total}/2500 usados)`);
    
    return contexto.avaliacoes.length > 0 ? contexto : null;

  } catch (err) {
    if (err.message === 'QUOTA_EXCEEDED') {
      console.log('   ⚠️  Limite Serper atingido! Usando apenas dados do marketplace');
      contador.total = 2500;
      salvarContador(contador);
    } else {
      console.log(`   ⚠️  Erro Serper: ${err.message}`);
    }
    return null; // Fallback
  }
}

/**
 * Verifica status do contador
 */
export function verificarStatusSerper() {
  const contador = carregarContador();
  console.log(`\n📊 Status Serper.dev:`);
  console.log(`   Consultas usadas: ${contador.total}/2500`);
  console.log(`   Restantes: ${2500 - contador.total}`);
  
  if (contador.total > LIMITE_SEGURANCA) {
    console.log(`   ⚠️  AVISO: Próximo do limite! Fallback ativado automaticamente.`);
  }
  
  return contador;
}
