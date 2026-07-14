/**
 * Validador Anti-Genérico - AchadoCerto.VIP
 * Garante qualidade e unicidade do conteúdo
 */

export const VALIDACOES = {
  
  /**
   * Verifica se há preço exato no texto
   */
  semPrecoExato: (texto) => {
    const temPreco = /R\$\s?\d+|reais|\d+,\d{2}/.test(texto);
    return {
      valido: !temPreco,
      mensagem: temPreco ? '❌ Contém preço exato (remover)' : '✅ Sem preços exatos'
    };
  },

  /**
   * Verifica se há datas específicas
   */
  semDataEspecifica: (texto) => {
    const temData = /lançado em|versão \d+|\b20\d{2}\b|em \d{4}/.test(texto);
    return {
      valido: !temData,
      mensagem: temData ? '❌ Contém data específica (remover)' : '✅ Conteúdo evergreen'
    };
  },

  /**
   * Verifica títulos genéricos de seção
   */
  semTitulosGenericos: (texto) => {
    const temGenerico = /^##?\s*(introdução|conclusão|benefícios|prós e contras|nossa análise|sobre o produto)/im.test(texto);
    return {
      valido: !temGenerico,
      mensagem: temGenerico ? '⚠️  Título genérico detectado (melhorar)' : '✅ Títulos específicos'
    };
  },

  /**
   * Verifica metalinguagem
   */
  semMetalinguagem: (texto) => {
    const temMeta = /neste artigo|vamos falar|vou mostrar|hoje vamos|neste post/i.test(texto);
    return {
      valido: !temMeta,
      mensagem: temMeta ? '❌ Metalinguagem detectada (remover)' : '✅ Sem metalinguagem'
    };
  },

  /**
   * Verifica se há prova social/real
   */
  temProvaReal: (texto) => {
    const temProva = /compradores|quem já (comprou|usa|testou)|avaliações|avaliadores|reclame aqui|usuários relatam/i.test(texto);
    return {
      valido: temProva,
      mensagem: temProva ? '✅ Contém prova social' : '⚠️  Sem prova social (adicionar se possível)'
    };
  },

  /**
   * Verifica se há CTA natural
   */
  temCtaNatural: (texto) => {
    const temCta = /conferir|confira|ver (na|o|disponibilidade)|próximo passo|acessar|consultar oferta/i.test(texto);
    return {
      valido: temCta,
      mensagem: temCta ? '✅ CTA natural presente' : '❌ Sem CTA (adicionar)'
    };
  },

  /**
   * Verifica linguagem evergreen
   */
  temEvergreen: (texto) => {
    const temEvergreen = /atualmente|no mercado|na categoria|disponível|entre as opções/i.test(texto);
    return {
      valido: temEvergreen,
      mensagem: temEvergreen ? '✅ Linguagem evergreen' : '⚠️  Considerar termos evergreen'
    };
  },

  /**
   * Verifica extensão mínima
   */
  extensaoAdequada: (texto) => {
    const palavras = texto.split(/\s+/).length;
    const adequada = palavras >= 400 && palavras <= 1500;
    return {
      valido: adequada,
      mensagem: adequada 
        ? `✅ Extensão adequada (${palavras} palavras)` 
        : `⚠️  Extensão ${palavras < 400 ? 'curta' : 'longa'} (${palavras} palavras)`
    };
  },

  /**
   * Verifica se tem especificações do produto
   */
  temEspecificacoes: (texto) => {
    const temSpecs = /especificações|características|detalhes técnicos|\*\*[^*]+:\*\*|^\s*-\s+\*\*/m.test(texto);
    return {
      valido: temSpecs,
      mensagem: temSpecs ? '✅ Especificações presentes' : '⚠️  Sem especificações técnicas'
    };
  },

  /**
   * Verifica se há frases de enrolação genérica (fluff)
   */
  semEnrolacao: (texto) => {
    const frasesEnrolacao = [
      /se destaca (dentro|na) (sua )?categoria/i,
      /reunir (atributos|características) que interessam/i,
      /algo equilibrado entre proposta e entrega/i,
      /alternativa que merece atenç[ãa]o/i,
      /equilíbrio entre as características/i,
      /produtos bem posicionados no mercado/i,
      /experiência satisfat[óo]ria para a maioria dos perfis/i,
      /qualidade e bom custo-benefício/i,
      /aparece entre as opções disponíveis/i,
      /opções disponíveis no mercado/i,
      /reputação da loja são bons indicadores/i,
    ];
    const encontrou = frasesEnrolacao.some(re => re.test(texto));
    return {
      valido: !encontrou,
      mensagem: encontrou 
        ? '❌ Frases de enrolação detectadas (conteúdo genérico)' 
        : '✅ Sem enrolação'
    };
  }
};

/**
 * Valida conteúdo completo
 */
export function validarConteudo(texto) {
  console.log('\n📋 Validando qualidade do conteúdo...\n');
  
  const resultados = {};
  let pontuacao = 0;
  const total = Object.keys(VALIDACOES).length;

  for (const [nome, validador] of Object.entries(VALIDACOES)) {
    const resultado = validador(texto);
    resultados[nome] = resultado;
    console.log(`   ${resultado.mensagem}`);
    if (resultado.valido) pontuacao++;
  }

  const percentual = Math.round((pontuacao / total) * 100);
  
  console.log(`\n   📊 Pontuação: ${pontuacao}/${total} (${percentual}%)`);
  
  if (percentual >= 80) {
    console.log('   ✅ Qualidade EXCELENTE!\n');
  } else if (percentual >= 60) {
    console.log('   ⚠️  Qualidade BOA (revisar pontos marcados)\n');
  } else {
    console.log('   ❌ Qualidade BAIXA (revisar conteúdo)\n');
  }

  return {
    pontuacao,
    total,
    percentual,
    aprovado: percentual >= 80,
    resultados
  };
}

/**
 * Corrige problemas comuns automaticamente
 */
export function corrigirAutomatico(texto) {
  let corrigido = texto;

  // Remove preços exatos
  corrigido = corrigido.replace(/R\$\s?\d+[,.]?\d*/g, 'preço atrativo');
  
  // Remove anos específicos
  corrigido = corrigido.replace(/\b20\d{2}\b/g, 'atualmente');
  
  // Remove metalinguagem comum
  corrigido = corrigido
    .replace(/neste artigo,?\s*/gi, '')
    .replace(/vamos falar sobre/gi, 'Veja sobre')
    .replace(/vou mostrar/gi, 'confira');

  // Melhora títulos genéricos
  corrigido = corrigido
    .replace(/^##\s*Introdução\s*$/gm, '## Por Que Este Produto Se Destaca')
    .replace(/^##\s*Conclusão\s*$/gm, '## Vale a Pena?')
    .replace(/^##\s*Benefícios\s*$/gm, '## Principais Vantagens');

  return corrigido;
}

/**
 * Análise detalhada para debug
 */
export function analisarDetalhado(texto) {
  const analise = {
    palavras: texto.split(/\s+/).length,
    paragrafos: texto.split(/\n\n+/).length,
    titulos: (texto.match(/^##\s+.+$/gm) || []).length,
    listas: (texto.match(/^\s*-\s+/gm) || []).length,
    negritos: (texto.match(/\*\*[^*]+\*\*/g) || []).length,
    links: (texto.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length,
  };

  console.log('\n📊 Análise Detalhada:');
  console.log(`   Palavras: ${analise.palavras}`);
  console.log(`   Parágrafos: ${analise.paragrafos}`);
  console.log(`   Títulos (##): ${analise.titulos}`);
  console.log(`   Itens de lista: ${analise.listas}`);
  console.log(`   Termos em negrito: ${analise.negritos}`);
  console.log(`   Links: ${analise.links}\n`);

  return analise;
}
