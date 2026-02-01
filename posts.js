const postsData = [
  {
    "titulo": "JBL Wave Buds 2 - Fone Bluetooth Premium com Som Incomparável",
    "resumo": "Análise completa do JBL Wave Buds 2 preto. Som de qualidade premium, bateria de 8 horas, Bluetooth 5.3 e design confortável. Descubra por que é a escolha ideal.",
    "imagem": "images/imagesposts/jbl-wave-buds-2.webp",
    "link": "blog/jbl-wave-buds-2.html",
    "chamada": "� Ver Detalhes",
    "categoria": "tech",
    "keywords": "JBL Wave Buds 2, fone bluetooth, earbuds, qualidade de som, bateria, Bluetooth 5.3"
  },
  {
    "titulo": "💊 Colágeno II + Condroitina + Glucosamina Bionatus 30 Comprimidos",
    "resumo": "Colágeno II + Condroitina + Glucosamina Bionatus: a solução completa para saúde articular. Vegano, sem glúten. 649 avaliações 4.8★. Elimine dores nas articulações.",
    "imagem": "images/imagesposts/colagen-ii-bionatus-30-comprimidos.webp",
    "link": "blog/colagen-ii-bionatus-saude-articular.html",
    "chamada": "📖 Ver Guia Completo",
    "categoria": "saude",
    "keywords": "colágeno condroitina glucosamina bionatus saúde articular dor articulações osteoartrite artrose suplemento vegano sem glúten comprimidos mobilidade osseo"
  },
  {
    "titulo": "🏋️ Calça Legging Fitness Zero Transparência Cintura Alta Selene 2026",
    "resumo": "Legging fitness Selene com zero transparência, tecido grosso e sem costura. A segurança e conforto total que a academia pediu. Cintura alta e durável.",
    "imagem": "images/imagesposts/legging-fitness-zero-transparencia-selene.webp",
    "link": "blog/legging-fitness-zero-transparencia-selene.html",
    "chamada": "📖 Ver Guia Completo",
    "categoria": "estilo",
    "keywords": "legging fitness zero transparência cintura alta selene tecido grosso sem costura treino academia musculação agachamento conforto segurança mulher moda esportiva roupas fitness elástica durável lavável preto cinza verde azul exercício"
  },
  {
    "titulo": "🛡️ Mercado Livre é Seguro? Veja como comprar com confiança",
    "resumo": "Descubra por que a Compra Garantida e a entrega FULL fazem deste marketplace o lugar favorito.",
    "imagem": "images/imagesposts/seguranca-ml.jpg", 
    "link": "blog/guia-seguranca-mercado-livre.html",
    "chamada": "📖 Ver Guia de Segurança",
    "categoria": "dicas",
    "keywords": "mercado livre seguro compra garantida full frete grátis devolução marketplace ecommerce compras online vendedor reputação avaliação como comprar segurança proteção fraude golpe dicas confiável mercado pago pagamento cartão pix boleto entrega rastreamento"
  },
  {
    "titulo": "☕ Cafeteira Italiana Inox: O Segredo do Café Perfeito em Casa",
    "resumo": "Descubra como elevar o nível do seu café matinal com a praticidade e o sabor incomparável da prensa italiana em aço inox.",
    "imagem": "images/imagesposts/cafeteira-italiana-inox-fundo-colorido.webp",
    "link": "blog/cafeteira-italiana-inox.html",
    "chamada": "📖 Ver Segredo do Café",
    "categoria": "lar",
    "keywords": "cafeteira italiana moka inox aço inoxidável café expresso pressão casa cozinha bialetti fogão como fazer espresso cremoso moagem pó café grãos barista qualidade sabor aroma durável manual prático econômico cafézinho manhã preparo tradicional"
  },
  {
    "titulo": "📱 Comparativo: Poco X7 Pro vs Redmi Note 14 Pro+ vs Xiaomi 15T Pro e 15T",
    "resumo": "Os 4 últimos lançamentos Xiaomi e Poco comparados! Descubra qual smartphone é perfeito para você: gamer, fotógrafo ou quem busca custo-benefício.",
    "imagem": "images/imagesposts/produtos_xiaomi.jpg",
    "link": "blog/comparativo-xiaomi-poco-2026.html",
    "chamada": "📖 Ver Comparativo Completo",
    "categoria": "tech",
    "keywords": "xiaomi poco x7 pro redmi note 14 pro+ 15t smartphone celular android mediatek dimensity 8400 qualcomm snapdragon tela amoled 120hz câmera 50mp bateria 6000mah carregamento rápido 90w gamer fotografia custo benefício preço barato bom 2026 lançamento melhor celular processador performance fotos vídeo"
  },
  {
    "titulo": "📺 Melhor TV 55\" 2026: TCL vs Samsung vs LG",
    "resumo": "Comparativo completo com as melhores opções custo-benefício, imagem premium e tecnologias que realmente importam.",
    "imagem": "images/imagesposts/melhor-tv-55-2026.webp",
    "link": "blog/melhor-tv-55-polegadas-2026.html",
    "chamada": "Ver Comparativo Completo",
    "categoria": "tech",
    "keywords": "tv televisão 55 polegadas smart tv 4k uhd hdr qled oled nanocell tcl samsung lg comparativo melhor custo benefício 2026 android google tv tizen webos netflix youtube prime video streaming games console ps5 xbox taxa atualização 120hz hdmi 2.1 dolby atmos som qualidade imagem brilho contraste"
  },
  {
    "titulo": "⚡ Arginina: O Segredo da Potência e Vascularização",
    "resumo": "Acelere sua recuperação e maximize o 'pump' muscular. O suplemento essencial para performance esportiva.",
    "imagem": "images/imagesposts/arginina.png",
    "link": "blog/guia-arginina.html",
    "chamada": "📖 Ver Matéria Completa",
    "categoria": "saude",
    "keywords": "arginina l-arginina suplemento pump vascularização vasodilatador óxido nítrico pré treino performance muscular academia musculação força resistência recuperação circulação sanguínea veias definição muscular dose como tomar benefícios aminoácido essencial saúde cardiovascular"
  },
  {
    "titulo": "💪 Whey Pro Max Titanium: O Guia Definitivo para sua Evolução",
    "resumo": "Descubra por que o Whey Pro é o aliado perfeito para ganhar massa magra e acelerar sua recuperação muscular com o melhor custo-benefício.",
    "imagem": "images/imagesposts/whey-pro-max-titanium-premium.jpg",
    "link": "blog/whey-pro-max-titanium.html",
    "chamada": "📖 Ler Matéria Completa",
    "categoria": "saude",
    "keywords": "whey protein pro max titanium suplemento proteína academia musculação hipertrofia ganhar massa magra músculos recuperação pós treino shake aminoácidos bcaa concentrado isolado hidrolisado melhor whey barato custo benefício sabores chocolate morango baunilha como tomar dose porção"
  },
  {
    "titulo": "⚡ Creatina: Guia Completo para Máxima Performance",
    "resumo": "Aprenda tudo sobre creatina: como funciona, qual é a melhor marca, dosagem correta e efeitos colaterais. Aumentar força nunca foi tão simples.",
    "imagem": "images/imagesposts/creatina-soldiers-500g.jpeg",
    "link": "blog/guia-creatina-performance.html",
    "chamada": "📖 Ver Guia Completo",
    "categoria": "saude",
    "keywords": "creatina performance guia completo monohidratada creatina etil éster qual melhor dose como tomar efeitos colaterais segurança científico comprovado"
  },
  {
    "titulo": "💪 Creatina Monohidratada 500g Pura: Potencialize seu Desempenho",
    "resumo": "Descubra por que a creatina monohidratada é o suplemento mais comprovado para ganho de força e massa muscular. Qualidade importada 99.8% pura com laudo de pureza garantido.",
    "imagem": "images/imagesposts/creatinarefil.webp",
    "link": "blog/creatina-soldiers-500g.html",
    "chamada": "🎯 Ler Artigo Completo",
    "categoria": "saude",
    "keywords": "creatina monohidratada 500g soldiers nutrition pura importada laudo pureza 99.8% suplemento academia musculação força explosão performance ganho massa muscular hipertrofia recuperação energia atp treino intenso benefits como tomar dose saturação manutenção seguro científico comprovado"
  }
];
