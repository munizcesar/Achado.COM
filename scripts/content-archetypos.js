/**
 * Arquetipos de Conteúdo - AchadoCerto.VIP
 * Sistema de variação para posts únicos e naturais
 */

// Títulos de seção por categoria - máxima variabilidade
export const TITULOS_SECOES = {
  Tech: {
    objecao: [
      'Questões Práticas do Dia a Dia',
      'Pontos de Atenção Antes de Decidir',
      'O Que Costuma Gerar Dúvida',
      'Aspectos Técnicos Relevantes',
      'Considerações de Uso Prolongado'
    ],
    durabilidade: [
      'Resistência e Vida Útil',
      'Construção e Materiais',
      'Sobre Durar Além da Garantia',
      'Qualidade ao Longo do Tempo'
    ]
  },
  Beleza: {
    objecao: [
      'Pontos Importantes Sobre Aplicação',
      'Questões de Sensibilidade e Tipo de Pele',
      'O Que Compradores Relatam',
      'Aspectos Práticos do Uso Diário',
      'Considerações Sobre Resultado'
    ],
    durabilidade: [
      'Duração e Rendimento do Produto',
      'Fixação e Resistência',
      'Sobre Quanto Tempo Dura',
      'Eficiência ao Longo do Uso'
    ]
  },
  'Casa & Lar': {
    objecao: [
      'Questões de Espaço e Instalação',
      'Pontos Práticos do Cotidiano',
      'O Que Avaliar Antes de Comprar',
      'Aspectos de Uso Real em Casa',
      'Considerações Sobre Manutenção'
    ],
    durabilidade: [
      'Durabilidade e Resistência',
      'Materiais e Acabamento',
      'Sobre Uso Frequente',
      'Qualidade Construtiva'
    ]
  },
  Esportes: {
    objecao: [
      'Pontos de Atenção no Treino',
      'Questões de Desempenho Real',
      'O Que Atletas Comentam',
      'Aspectos Práticos de Uso',
      'Considerações Sobre Performance'
    ],
    durabilidade: [
      'Resistência ao Uso Intenso',
      'Qualidade dos Materiais',
      'Sobre Treinos Prolongados',
      'Durabilidade em Prática'
    ]
  },
  Automotivo: {
    objecao: [
      'Compatibilidade e Instalação',
      'Questões Técnicas Importantes',
      'O Que Motoristas Relatam',
      'Aspectos de Uso no Dia a Dia',
      'Considerações Antes da Compra'
    ],
    durabilidade: [
      'Durabilidade e Resistência',
      'Qualidade e Confiabilidade',
      'Sobre Uso Prolongado',
      'Performance ao Longo do Tempo'
    ]
  },
  default: {
    objecao: [
      'Pontos Importantes a Considerar',
      'Questões Práticas do Uso',
      'O Que Compradores Relatam',
      'Aspectos Relevantes',
      'Considerações Antes de Decidir'
    ],
    durabilidade: [
      'Durabilidade e Qualidade',
      'Sobre Uso a Longo Prazo',
      'Resistência e Materiais',
      'Qualidade Construtiva'
    ]
  }
};

export const ARQUETIPOS = {
  A: {
    nome: 'A Dúvida do Comprador',
    estrutura: {
      abertura: 'duvida_paralisante',
      desenvolvimento: 'criterios_diferenciais',
      aplicacao: 'casos_uso_reais',
      objecao: 'pontos_praticos',
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
      objecao: 'duvidas_frequentes',
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
    'Tudo sobre {produto}: do que importa ao que ignorar',
    '{produto}: guia definitivo antes de decidir',
    'Review completo: {produto} atende suas expectativas?',
    'O que você precisa saber sobre {categoria}',
    '{produto} - análise técnica e opinião de uso',
    '{produto}: o que avaliar antes de decidir',
    'Por que {produto} se destaca na categoria {categoria}?',
    '{produto}: pontos fortes, fracos e para quem vale',
    'Análise honesta: {produto} entrega o que promete?',
    '{produto} — experiência real de uso e pontos de atenção',
    'Quem deve comprar {produto} e quem deve evitar',
    '{categoria}: como {produto} se compara ao mercado',
    '{produto}: análise sem enrolação para quem quer decidir logo'
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
    'Quando você olha várias opções parecidas, os diferenciais que realmente importam ficam mais claros...',
    'Decisões de compra bem informadas começam com perguntas certas, não com impulso...',
    'No mercado atual de {categoria}, separar marketing de realidade exige atenção aos detalhes...',
    'Investir tempo pesquisando antes economiza dinheiro e frustração depois...',
    'A maioria das pessoas decide pela capa. Quem lê o miolo raramente se arrepende...',
    'Especificações técnicas importam — mas o que realmente define uma boa compra é o uso no dia a dia...',
    'Nem sempre o mais caro é o melhor. Nem sempre o mais barato é o pior. O segredo está no encaixe...',
    'Há produtos que parecem iguais na descrição mas se comportam de formas muito diferentes no uso...',
    'O que faz um produto ser recomendado por quem comprou meses depois? Isso é o que vale analisar...'
  ],

  transicoes: [
    'É nesse ponto que essa opção aparece com uma proposta diferente...',
    'O que chama atenção é a combinação de características que poucas alternativas oferecem juntas...',
    'Segundo compradores que já passaram por essa mesma dúvida...',
    'Dentro da categoria, poucos produtos entregam esse nível de especificação...',
    'Comparando com alternativas na mesma faixa, os diferenciais ficam claros...',
    'Avaliações de quem comprou apontam para um padrão consistente...',
    'O histórico deste produto no mercado brasileiro mostra...',
    'Entre as opções disponíveis, esse modelo se destaca por...',
    'Compradores experientes nesta categoria identificam rapidamente...',
    'A reputação consolidada deste item não é coincidência...'
  ],

  fechamentos: [
    'Para quem está pesquisando há algum tempo e não quer se arrepender, o próximo passo é conferir a disponibilidade e condições atuais',
    'Se os pontos levantados acima fazem sentido para o seu uso, vale conferir o produto diretamente na plataforma',
    'Quem valoriza esses critérios vai encontrar aqui uma escolha que justifica a pesquisa',
    'A melhor forma de confirmar se faz sentido para você é ver as avaliações reais de compradores',
    'Compradores que valorizam esses aspectos costumam se satisfazer com essa escolha',
    'O histórico de avaliações sugere que essa opção atende bem ao público que busca essas características',
    'Se esses critérios conversam com suas necessidades, vale conferir as condições atuais',
    'Decisões bem informadas começam com pesquisa - o próximo passo é verificar disponibilidade e feedback recente',
    'Para quem leu até aqui e se identificou com os pontos, vale conferir o produto na prática'
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
 * Sorteia variação com seed
 */
export function sortearVariacao(array, seed) {
  const index = (seed * 7919 + 104729) % array.length;
  return array[index];
}

/**
 * Gera seed robusto baseado nos caracteres do título + categoria + posição
 * Evita colisões entre produtos com títulos de mesmo comprimento
 */
function gerarSeedRobusto(produto) {
  const str = produto.title + '|' + produto.category + '|' + (produto.affiliateUrl || '');
  return str.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
}

/**
 * Gera contexto de variações para o produto
 */
export function gerarContextoVariacoes(produto, arquetipo) {
  const seed = gerarSeedRobusto(produto);

  // Seleciona títulos de seção específicos da categoria
  const categoria = produto.category in TITULOS_SECOES ? produto.category : 'default';
  const titulosCategoria = TITULOS_SECOES[categoria];

  return {
    arquetipo: ARQUETIPOS[arquetipo],
    titulo: sortearVariacao(VARIACOES.titulos, seed)
      .replace('{produto}', produto.title.split(' ').slice(0, 4).join(' '))
      .replace('{categoria}', produto.category.toLowerCase()),
    abertura: sortearVariacao(VARIACOES.aberturas, seed + 1),
    transicao: sortearVariacao(VARIACOES.transicoes, seed + 2)
      .replace('{produto}', produto.title.split(' ').slice(0, 3).join(' ')),
    fechamento: sortearVariacao(VARIACOES.fechamentos, seed + 3),
    tituloObjecao: sortearVariacao(titulosCategoria.objecao, seed + 4),
    tituloDurabilidade: sortearVariacao(titulosCategoria.durabilidade, seed + 5),
    cta: VARIACOES.ctas_por_loja[produto.store] || {
      texto: 'Ver produto na loja oficial',
      gatilho: 'avaliações de compradores reais'
    }
  };
}
