/**
 * Arquetipos de Conteúdo - AchadoCerto.VIP
 * Sistema de variação para posts únicos e naturais
 */

export const ARQUETIPOS = {
  A: {
    nome: 'A Dúvida do Comprador',
    estrutura: {
      abertura: 'duvida_paralisante',
      desenvolvimento: 'criterios_diferenciais',
      aplicacao: 'casos_uso_reais',
      objecao: 'durabilidade_entrega',
      fechamento: 'proximo_passo'
    }
  },
  B: {
    nome: 'A Experiência de Quem Comprou',
    estrutura: {
      abertura: 'experiencia_pos_compra',
      desenvolvimento: 'primeiras_impressoes',
      aplicacao: 'cenarios_cotidianos',
      contraste: 'comparacao_faixa_preco',
      fechamento: 'indicacao_objetiva'
    }
  },
  C: {
    nome: 'O Guia da Decisão Certa',
    estrutura: {
      abertura: 'erros_comuns',
      desenvolvimento: 'criterios_importantes',
      aplicacao: 'atendimento_criterios',
      objecao: 'faq_duvidas_reais',
      fechamento: 'criterios_marcados'
    }
  },
  D: {
    nome: 'O Contexto de Mercado',
    estrutura: {
      abertura: 'variacao_qualidade',
      desenvolvimento: 'marcas_consolidadas',
      aplicacao: 'posicionamento_mercado',
      contraste: 'concorrentes_diretos',
      fechamento: 'escolha_logica'
    }
  }
};

export const VARIACOES = {
  titulos: [
    '{produto}: vale a pena comprar ou existe opção melhor?',
    'O que ninguém te conta antes de comprar {categoria}',
    '{produto} é bom mesmo? O que dizem quem já comprou',
    'Como escolher {categoria} sem se arrepender depois',
    '{produto}: análise completa para quem está em dúvida',
    'Antes de comprar {produto}, leia isso',
    '{produto} vs alternativas: qual faz mais sentido para você',
    'Tudo sobre {produto}: do que importa ao que ignorar'
  ],

  aberturas: [
    'Pesquisar muito antes de comprar faz parte do processo, e com razão...',
    'A dúvida não é se o produto é bom - é se ele é bom para o seu caso específico...',
    'Quem já errou em uma compra por falta de informação sabe como a sensação é frustrante...',
    'Nos principais marketplaces brasileiros, esse item acumula histórico consistente entre compradores...',
    'Antes de olhar o preço, vale entender o que você está de fato avaliando aqui...',
    'Não faltam opções no mercado - o difícil é saber qual entrega o que você realmente precisa...',
    'Entre tantas alternativas disponíveis, algumas escolhas acabam se destacando por motivos específicos...',
    'Avaliar bem antes de comprar evita aquela frustração de quem percebe tarde demais que escolheu errado...',
    'O que separa uma boa compra de uma compra que você celebra meses depois? Escolher com critério...',
    'Fotos bonitas e descrições genéricas todo produto tem - o que importa mesmo está nos detalhes...',
    'Comprar sem pesquisar pode funcionar, mas quem pesquisa raramente se arrepende...',
    'Quando você olha várias opções parecidas, os diferenciais que realmente importam ficam mais claros...'
  ],

  transicoes: [
    'É nesse ponto que o {produto} aparece com uma proposta diferente...',
    'O que chama atenção nessa opção é a combinação entre {spec1} e {spec2}...',
    'Segundo compradores que já passaram por essa mesma dúvida...',
    'Dentro da faixa {posicao_preco}, poucos produtos entregam o que essa opção entrega em...'
  ],

  fechamentos: [
    'Para quem está pesquisando há algum tempo e não quer se arrepender, o próximo passo é conferir a disponibilidade e condições atuais',
    'Se os pontos levantados acima fazem sentido para o seu uso, vale conferir o produto diretamente na plataforma',
    'Quem valoriza {beneficio} vai encontrar aqui uma escolha que justifica a pesquisa',
    'A melhor forma de confirmar se faz sentido para você é ver as avaliações reais de compradores'
  ],

  ctas_por_loja: {
    'Mercado Livre': {
      texto: 'Ver avaliações e disponibilidade no Mercado Livre',
      gatilho: 'reputação consolidada entre compradores'
    },
    'Amazon': {
      texto: 'Conferir condições atuais na Amazon',
      gatilho: 'avaliações verificadas de compra'
    },
    'Magalu': {
      texto: 'Ver oferta atual na Magazine Luiza',
      gatilho: 'entrega rápida e suporte pós-venda'
    }
  }
};

/**
 * Seleciona arquetipo aleatório com seed baseado no produto
 */
export function selecionarArquetipo(produtoNome) {
  const seed = produtoNome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tipos = Object.keys(ARQUETIPOS);
  return tipos[seed % tipos.length];
}

/**
 * Sorteia variação com seed melhorada
 */
export function sortearVariacao(array, seed) {
  // Usa múltiplos fatores para melhor distribuição
  const index = (seed * 7919 + 104729) % array.length;
  return array[index];
}

/**
 * Gera contexto de variações para o produto
 */
export function gerarContextoVariacoes(produto, arquetipo) {
  const seed = produto.title.length + produto.category.length;
  
  return {
    arquetipo: ARQUETIPOS[arquetipo],
    titulo: sortearVariacao(VARIACOES.titulos, seed)
      .replace('{produto}', produto.title.split(' ').slice(0, 4).join(' '))
      .replace('{categoria}', produto.category.toLowerCase()),
    abertura: sortearVariacao(VARIACOES.aberturas, seed + 1),
    transicao: sortearVariacao(VARIACOES.transicoes, seed + 2)
      .replace('{produto}', produto.title.split(' ').slice(0, 3).join(' ')),
    fechamento: sortearVariacao(VARIACOES.fechamentos, seed + 3),
    cta: VARIACOES.ctas_por_loja[produto.store] || {
      texto: 'Ver produto na loja oficial',
      gatilho: 'avaliações de compradores reais'
    }
  };
}
