const axios = require('axios');

class MercadoLivreAPI {
  constructor(apiKey, apiHost) {
    this.apiKey = apiKey;
    this.apiHost = apiHost;
    this.baseURL = 'https://mercado-libre7.p.rapidapi.com';
    this.cache = new Map();
  }

  // Configuração dos headers da API
  getHeaders() {
    return {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': this.apiHost,
      'Content-Type': 'application/json'
    };
  }

  // Buscar dados de um produto pelo URL
  async buscarProduto(urlProduto) {
    try {
      // Verifica cache
      if (this.cache.has(urlProduto)) {
        const cached = this.cache.get(urlProduto);
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
          console.log('📦 Retornando do cache:', urlProduto);
          return cached.data;
        }
      }

      console.log('🔍 Buscando:', urlProduto);

      const response = await axios.get(`${this.baseURL}/listing_data`, {
        params: {
          url: urlProduto
        },
        headers: this.getHeaders(),
        timeout: 10000
      });

      // Cacheia resposta
      this.cache.set(urlProduto, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error.message);
      throw new Error(`Erro ao buscar produto: ${error.message}`);
    }
  }

  // Buscar avaliações de um produto
  async buscarAvaliacoes(urlProduto) {
    try {
      const response = await axios.get(`${this.baseURL}/reviews_for_listing`, {
        params: {
          url: urlProduto
        },
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error.message);
      throw new Error(`Erro ao buscar avaliações: ${error.message}`);
    }
  }

  // Buscar produtos por termo de busca
  async buscarPorTermo(termo) {
    try {
      console.log('🔎 Buscando termo:', termo);

      const response = await axios.get(`${this.baseURL}/listings_for_search`, {
        params: {
          query: termo,
          limit: 10
        },
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro na busca:', error.message);
      throw new Error(`Erro na busca: ${error.message}`);
    }
  }

  // Buscar produtos por categoria
  async buscarPorCategoria(categoriaId) {
    try {
      console.log('📂 Buscando categoria:', categoriaId);

      const response = await axios.get(`${this.baseURL}/listings_for_category`, {
        params: {
          category_id: categoriaId,
          limit: 10
        },
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar categoria:', error.message);
      throw new Error(`Erro ao buscar categoria: ${error.message}`);
    }
  }

  // Formatar dados do produto para o site
  formatarProduto(dados) {
    if (!dados) return null;

    return {
      titulo: dados.title || 'Sem título',
      preco: dados.price || 0,
      precoOriginal: dados.original_price || dados.price || 0,
      desconto: this.calcularDesconto(dados.price, dados.original_price),
      imagem: dados.picture || dados.thumbnail || '',
      url: dados.permalink || '',
      avaliacao: dados.rating || 0,
      vendidos: dados.sold_quantity || 0,
      vendedor: dados.seller_nickname || 'Vendedor não informado',
      condicao: dados.condition || 'novo',
      estoque: dados.available_quantity || 0,
      descricao: dados.short_description || '',
      dataColeta: new Date().toISOString()
    };
  }

  // Calcular percentual de desconto
  calcularDesconto(preco, precoOriginal) {
    if (!precoOriginal || precoOriginal <= 0) return 0;
    const desconto = ((precoOriginal - preco) / precoOriginal) * 100;
    return Math.round(desconto);
  }

  // Limpar cache
  limparCache() {
    this.cache.clear();
    console.log('🧹 Cache limpo');
  }
}

module.exports = MercadoLivreAPI;
