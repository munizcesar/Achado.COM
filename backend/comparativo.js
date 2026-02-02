// Módulo para criar comparativos entre produtos

class Comparativo {
  constructor() {
    this.produtos = [];
  }

  // Adicionar produto ao comparativo
  adicionarProduto(produto) {
    this.produtos.push(produto);
  }

  // Adicionar múltiplos produtos
  adicionarProdutos(produtos) {
    this.produtos.push(...produtos);
  }

  // Ordenar por preço (menor primeiro)
  ordenarPorPreco() {
    return this.produtos.sort((a, b) => a.preco - b.preco);
  }

  // Ordenar por avaliação (maior primeiro)
  ordenarPorAvaliacao() {
    return this.produtos.sort((a, b) => b.avaliacao - a.avaliacao);
  }

  // Encontrar melhor custo-benefício
  melhorCustoBeneficio() {
    if (this.produtos.length === 0) return null;

    return this.produtos.reduce((melhor, atual) => {
      const scoreAtual = (atual.avaliacao / 5) / (atual.preco / 100);
      const scoreMelhor = (melhor.avaliacao / 5) / (melhor.preco / 100);
      return scoreAtual > scoreMelhor ? atual : melhor;
    });
  }

  // Gerar resumo do comparativo
  gerarResumo() {
    if (this.produtos.length === 0) return null;

    const precos = this.produtos.map(p => p.preco);
    const avaliacoes = this.produtos.map(p => p.avaliacao).filter(a => a > 0);

    return {
      totalProdutos: this.produtos.length,
      precoMinimo: Math.min(...precos),
      precoMaximo: Math.max(...precos),
      precoMedio: (precos.reduce((a, b) => a + b, 0) / precos.length).toFixed(2),
      avaliacaoMedia: avaliacoes.length > 0 ? (avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length).toFixed(1) : 0,
      maiorDesconto: Math.max(...this.produtos.map(p => p.desconto)),
      produtoMaisBarato: this.produtos.reduce((a, b) => a.preco < b.preco ? a : b),
      produtoMelhorAvaliado: this.produtos.reduce((a, b) => a.avaliacao > b.avaliacao ? a : b),
      melhorCustoBeneficio: this.melhorCustoBeneficio()
    };
  }

  // Gerar tabela comparativa em HTML
  gerarTabelaHTML() {
    if (this.produtos.length === 0) return '<p>Nenhum produto para comparar</p>';

    let html = `
      <table class="comparativo-tabela">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Preço</th>
            <th>Desconto</th>
            <th>Avaliação</th>
            <th>Vendedor</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
    `;

    this.produtos.forEach(p => {
      html += `
        <tr>
          <td>
            <div class="produto-info">
              <img src="${p.imagem}" alt="${p.titulo}" class="produto-thumb">
              <span class="produto-titulo">${p.titulo}</span>
            </div>
          </td>
          <td class="preco">R$ ${p.preco.toFixed(2)}</td>
          <td class="desconto">${p.desconto}%</td>
          <td class="avaliacao">⭐ ${p.avaliacao}</td>
          <td class="vendedor">${p.vendedor}</td>
          <td>
            <a href="${p.url}" target="_blank" class="btn-comprar">
              Ver no ML
            </a>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  }

  // Limpar produtos
  limpar() {
    this.produtos = [];
  }
}

module.exports = Comparativo;
