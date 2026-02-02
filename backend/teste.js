const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Cores para terminal
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[36m'
};

// Teste 1: Health Check
async function testarHealthCheck() {
  console.log(`\n${cores.azul}🔍 TESTE 1: Health Check${cores.reset}`);
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    console.log(`${cores.verde}✅ Servidor está funcionando!${cores.reset}`);
    console.log('Resposta:', response.data);
    return true;
  } catch (error) {
    console.log(`${cores.vermelho}❌ Servidor não está respondendo${cores.reset}`);
    console.log('Certifique-se de executar: npm start');
    return false;
  }
}

// Teste 2: Buscar Produto
async function testarBuscarProduto() {
  console.log(`\n${cores.azul}🔍 TESTE 2: Buscar Produto${cores.reset}`);
  
  // URL de exemplo - replace com uma URL real do ML
  const urlExemplo = 'https://www.mercadolivre.com.br/motorola-moto-e14-64gb-cinza-grafite/p/MLA33017055';

  try {
    console.log(`Buscando: ${urlExemplo}`);
    const response = await axios.post(`${API_URL}/api/produto`, {
      url: urlExemplo
    });

    if (response.data.sucesso) {
      const p = response.data.produto;
      console.log(`${cores.verde}✅ Produto encontrado!${cores.reset}`);
      console.log(`
  📦 ${p.titulo}
  💰 Preço: R$ ${p.preco.toFixed(2)}
  🏷️  Desconto: ${p.desconto}%
  ⭐ Avaliação: ${p.avaliacao}
  📊 Vendidos: ${p.vendidos}
  👤 Vendedor: ${p.vendedor}
      `);
      return true;
    }
  } catch (error) {
    console.log(`${cores.vermelho}❌ Erro ao buscar produto${cores.reset}`);
    console.log('Erro:', error.response?.data?.erro || error.message);
    return false;
  }
}

// Teste 3: Criar Comparativo
async function testarComparativo() {
  console.log(`\n${cores.azul}🔍 TESTE 3: Criar Comparativo${cores.reset}`);

  const urls = [
    'https://www.mercadolivre.com.br/xiaomi-poco-m6-128gb-azul/p/MLA22845784',
    'https://www.mercadolivre.com.br/samsung-galaxy-a15-128gb-azul/p/MLA23115963',
    'https://www.mercadolivre.com.br/motorola-moto-g54-128gb-ouro/p/MLA22768123'
  ];

  try {
    console.log('📊 Comparando 3 produtos...');
    const response = await axios.post(`${API_URL}/api/comparativo`, { urls });

    if (response.data.sucesso) {
      const r = response.data.resumo;
      console.log(`${cores.verde}✅ Comparativo criado!${cores.reset}`);
      console.log(`
  📊 Resumo:
  • Total: ${r.totalProdutos} produtos
  • Preço mínimo: R$ ${r.precoMinimo.toFixed(2)}
  • Preço máximo: R$ ${r.precoMaximo.toFixed(2)}
  • Preço médio: R$ ${r.precoMedio}
  • Melhor avaliação: ${r.avaliacaoMedia} ⭐
  • Maior desconto: ${r.maiorDesconto}%
  
  🏆 Melhor custo-benefício: ${r.melhorCustoBeneficio.titulo}
      `);
      return true;
    }
  } catch (error) {
    console.log(`${cores.vermelho}❌ Erro ao criar comparativo${cores.reset}`);
    console.log('Erro:', error.response?.data?.erro || error.message);
    return false;
  }
}

// Teste 4: Gerar Post
async function testarGerarPost() {
  console.log(`\n${cores.azul}🔍 TESTE 4: Gerar Post HTML${cores.reset}`);

  const url = 'https://www.mercadolivre.com.br/motorola-moto-e14-64gb-cinza-grafite/p/MLA33017055';

  try {
    console.log('📝 Gerando template de post...');
    const response = await axios.post(`${API_URL}/api/gerar-post`, {
      url: url,
      titulo: 'Motorola Moto E14 - Achado Especial',
      categoria: 'tech'
    });

    if (response.data.sucesso) {
      console.log(`${cores.verde}✅ Post gerado com sucesso!${cores.reset}`);
      console.log(`\n${cores.amarelo}📄 Primeiras 500 caracteres do HTML:${cores.reset}`);
      console.log(response.data.postHTML.substring(0, 500) + '...\n');
      
      // Salvar arquivo
      const fs = require('fs');
      fs.writeFileSync('./post-teste.html', response.data.postHTML);
      console.log(`${cores.verde}✅ Post salvo em: post-teste.html${cores.reset}`);
      return true;
    }
  } catch (error) {
    console.log(`${cores.vermelho}❌ Erro ao gerar post${cores.reset}`);
    console.log('Erro:', error.response?.data?.erro || error.message);
    return false;
  }
}

// Teste 5: Buscar por Termo
async function testarBuscarTermo() {
  console.log(`\n${cores.azul}🔍 TESTE 5: Buscar por Termo${cores.reset}`);

  try {
    console.log('🔎 Buscando "iPhone"...');
    const response = await axios.get(`${API_URL}/api/buscar/iPhone?limit=5`);

    if (response.data.sucesso) {
      console.log(`${cores.verde}✅ Busca realizada!${cores.reset}`);
      console.log(`Encontrados resultados para: ${response.data.termo}`);
      return true;
    }
  } catch (error) {
    console.log(`${cores.vermelho}❌ Erro na busca${cores.reset}`);
    console.log('Erro:', error.response?.data?.erro || error.message);
    return false;
  }
}

// Executar todos os testes
async function executarTodos() {
  console.log(`
╔════════════════════════════════════════════╗
║     🧪 TESTES DO BACKEND ACHADOCERTO      ║
║     Iniciar: npm start (em outra aba)     ║
╚════════════════════════════════════════════╝
  `);

  const testes = [
    { nome: 'Health Check', funcao: testarHealthCheck },
    { nome: 'Buscar Produto', funcao: testarBuscarProduto },
    { nome: 'Criar Comparativo', funcao: testarComparativo },
    { nome: 'Gerar Post', funcao: testarGerarPost },
    { nome: 'Buscar por Termo', funcao: testarBuscarTermo }
  ];

  let sucessos = 0;
  let falhas = 0;

  for (const teste of testes) {
    const resultado = await teste.funcao();
    if (resultado) {
      sucessos++;
    } else {
      falhas++;
    }
    // Esperar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Resumo final
  console.log(`
╔════════════════════════════════════════════╗
║          📊 RESUMO DOS TESTES             ║
╠════════════════════════════════════════════╣
║ ✅ Sucessos: ${sucessos}                          ║
║ ❌ Falhas: ${falhas}                           ║
╚════════════════════════════════════════════╝
  `);

  if (falhas === 0) {
    console.log(`${cores.verde}🎉 TUDO FUNCIONANDO! Pronto para integrar no site.${cores.reset}\n`);
  } else {
    console.log(`${cores.vermelho}⚠️  Verifique os erros acima e tente novamente.${cores.reset}\n`);
  }
}

// Executar
executarTodos().catch(console.error);
