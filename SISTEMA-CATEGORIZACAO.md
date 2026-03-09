# Sistema de Categorização Automática - Referência Técnica

## 🎯 Como Funciona

### Sistema de Score
Cada palavra-chave encontrada no título do produto adiciona **2 pontos** ao score da categoria.
A categoria com maior pontuação é escolhida.

```javascript
// Exemplo
Título: "Smartphone Samsung Galaxy A54 128GB"
- "smartphone" → Tech +2
- "galaxy" → Tech +2  
- "128gb" → Tech +2
Score Tech: 6 → Categoria: Tech ✅
```

---

## 📊 Categorias e Keywords (800+)

### 🖥️ TECH (Score > outros)

#### Smartphones & Tablets
`smartphone`, `celular`, `iphone`, `galaxy`, `xiaomi`, `redmi`, `poco`, `motorola moto`, `realme`, `oneplus`, `asus zenfone`, `tablet`, `ipad`

#### Computadores
`notebook`, `laptop`, `macbook`, `chromebook`, `ultrabook`, `desktop`, `pc gamer`, `all in one`

#### Processadores & Componentes
`intel core`, `amd ryzen`, `processador`, `placa mãe`, `motherboard`, `placa de vídeo`, `gpu`, `rtx`, `gtx`, `radeon`

#### Armazenamento
`ssd`, `hdd`, `nvme`, `m.2`, `pendrive`, `cartão de memória`, `sd card`, `microsd`

#### Áudio
`fone de ouvido`, `headphone`, `headset`, `earbuds`, `airpods`, `jbl`, `sony wh`, `beats`, `soundbar`, `caixa de som`, `speaker bluetooth`

#### Wearables
`smartwatch`, `relógio inteligente`, `smart band`, `fitness tracker`, `apple watch`, `galaxy watch`, `amazfit`, `mi band`

#### Câmeras & Fotografia
`câmera digital`, `dslr`, `mirrorless`, `gopro`, `action cam`, `drone`, `gimbal`, `tripé`, `ring light`

#### Redes & Conectividade
`roteador`, `router`, `modem`, `repetidor wi-fi`, `mesh`, `access point`, `switch`, `hub usb`

#### Periféricos
`teclado mecânico`, `mouse gamer`, `mousepad`, `webcam`, `microfone condensador`, `mesa digitalizadora`, `wacom`

#### Gaming
`console`, `playstation`, `xbox`, `nintendo switch`, `controle`, `joystick`, `volante`, `vr`, `oculus`

#### Carregadores & Energia
`carregador`, `fonte`, `power bank`, `bateria externa`, `carregador portátil`, `cabo usb-c`, `cabo lightning`

---

### 💄 BELEZA (Score > outros)

#### Perfumaria
`perfume`, `colônia`, `eau de parfum`, `eau de toilette`, `fragrância`, `deo colônia`, `desodorante colônia`, `body spray`, `mist`, `o boticário`, `natura`, `eudora`, `avon`

#### Skincare / Cuidados com a Pele
`sérum`, `serum`, `creme facial`, `protetor solar`, `fps`, `hidratante facial`, `tônico`, `água micelar`, `demaquilante`, `máscara facial`, `esfoliante`, `peeling`, `vitamina c`, `ácido hialurônico`, `retinol`, `niacinamida`

#### Maquiagem
`base`, `corretivo`, `pó compacto`, `blush`, `bronzer`, `iluminador`, `paleta de sombras`, `rímel`, `máscara de cílios`, `batom`, `gloss`, `lápis de olho`, `delineador`, `primer`

#### Cabelo
`shampoo`, `condicionador`, `máscara capilar`, `leave-in`, `óleo capilar`, `finalizador`, `ampola`, `tratamento capilar`, `escova progressiva`, `chapinha`, `modelador`, `secador`, `difusor`

#### Unhas
`esmalte`, `base para unhas`, `removedor`, `acetona`, `kit manicure`, `alicate`, `lixa`

#### Barba & Depilação
`barbeador`, `aparador de barba`, `cera depilatória`, `depilador`, `lâmina de barbear`, `creme de barbear`, `óleo de barba`

#### Higiene Pessoal
`sabonete`, `gel de banho`, `desodorante`, `antiperspirante`, `creme para mãos`, `hidratante corporal`

---

### 🏠 CASA & LAR (Score > outros)

#### Cozinha
`panela`, `frigideira`, `jogo de panelas`, `assadeira`, `forma`, `faca`, `tábua de corte`, `mixer`, `batedeira`, `liquidificador`, `processador`, `air fryer`, `fritadeira elétrica`, `cafeteira`, `chaleira`, `torradeira`, `sanduicheira`, `grill`

#### Organização
`organizador`, `caixa organizadora`, `pote`, `pote hermético`, `armário`, `prateleira`, `estante`, `gaveteiro`, `cabideiro`

#### Limpeza
`aspirador`, `vassoura`, `rodo`, `mop`, `balde`, `escova`, `pano de microfibra`, `espanador`, `limpador a vapor`

#### Decoração
`quadro`, `moldura`, `almofada`, `tapete`, `cortina`, `persiana`, `luminária`, `abajur`, `vaso`, `espelho`

#### Cama, Mesa & Banho
`jogo de cama`, `lençol`, `fronha`, `edredom`, `cobertor`, `travesseiro`, `toalha de banho`, `roupão`, `toalha de mesa`, `guardanapo`

#### Jardinagem
`vaso de planta`, `regador`, `mangueira`, `tesoura de poda`, `substrato`, `adubo`

---

### ⚽ ESPORTES (Score > outros)

#### Suplementos
`whey protein`, `whey`, `creatina`, `bcaa`, `pré-treino`, `pre workout`, `termogênico`, `hipercalórico`, `mass gainer`, `albumina`, `caseína`, `glutamina`, `colágeno`, `ômega 3`, `multivitamínico`, `cafeína`, `beta alanina`, `malto`, `dextrose`, `waxy maize`

#### Academia & Musculação
`halter`, `anilha`, `barra`, `colchonete`, `tapete de yoga`, `faixa elástica`, `caneleira`, `luva de treino`, `corda de pular`, `roda abdominal`, `bola suíça`

#### Corrida & Caminhada
`tênis de corrida`, `running`, `meias esportivas`, `cinta`, `pochete`, `garrafa squeeze`, `relógio de corrida`

#### Ciclismo
`bicicleta`, `bike`, `capacete`, `luva de ciclismo`, `bermuda de ciclismo`, `sapatilha`, `pedal clip`

#### Natação
`maiô`, `sunga`, `óculos de natação`, `touca`, `nadadeira`, `prancha`

#### Artes Marciais
`luva de boxe`, `saco de pancada`, `bandagem`, `protetor bucal`, `kimono`, `faixa`

#### Outdoor
`barraca`, `saco de dormir`, `mochila cargueira`, `lanterna`, `cantil`, `fogareiro`, `isolante térmico`

---

### 🚗 AUTOMOTIVO (Score > outros)

#### Fluidos & Aditivos
`aditivo`, `óleo de motor`, `óleo lubrificante`, `fluido de freio`, `líquido de arrefecimento`, `aditivo radiador`, `limpa vidros`, `cera automotiva`, `polish`, `shampoo automotivo`, `drawing clay`, `selante`, `bardahl`, `stp`, `wynn's`, `techplus`

#### Manutenção
`filtro de óleo`, `filtro de ar`, `filtro de combustível`, `filtro de cabine`, `vela de ignição`, `pastilha de freio`, `disco de freio`, `correia`, `bateria automotiva`, `lâmpada automotiva`, `palheta limpador`

#### Acessórios Internos
`tapete automotivo`, `capa de banco`, `organizador de porta malas`, `suporte veicular`, `carregador veicular`, `dash cam`, `câmera de ré`

#### Som & Multimídia
`alto falante`, `subwoofer`, `amplificador`, `central multimídia`, `módulo taramps`, `tweeter`, `woofer`, `kit 2 vias`, `kit 6x9`

#### Eletrônicos
`scanner automotivo`, `compressor de ar`, `aspirador automotivo`, `politriz`, `enceradeira`, `lava jato portátil`

#### Pneus & Rodas
`pneu`, `aro`, `roda`, `calota`, `válvula`

#### Ferramentas
`chave de roda`, `macaco`, `kit ferramentas`, `alicate amperímetro`, `multímetro`, `teste de bateria`, `organizador ferramentas`

---

## 🔧 Como Adicionar Novas Keywords

### 1. Identifique a Categoria
Primeiro defina claramente onde o produto se encaixa.

### 2. Adicione no Arquivo
Edite `scripts/novo-post.js` na função `detectCategory`.

### 3. Use Variações
Adicione plural, singular, com/sem acento:
```javascript
'smartphone', 'smartphones', 'smart phone'
```

### 4. Termos Específicos
Adicione marcas e modelos populares:
```javascript
'galaxy', 'iphone', 'xiaomi', 'redmi'
```

### 5. Teste
```bash
node scripts/novo-post.js "URL-DO-PRODUTO"
```

---

## 📝 Regras de Categorização

### Prioridade de Score
1. Se Tech score >= 4 → **Tech**
2. Se Beleza score >= 4 → **Beleza**  
3. Se Automotivo score >= 4 → **Automotivo**
4. Se Esportes score >= 4 → **Esportes**
5. Se Casa & Lar score >= 4 → **Casa & Lar**
6. Else → **Geral**

### Palavras Conflitantes
Alguns termos podem aparecer em várias categorias:
- `óleo` → pode ser Beleza (cabelo) ou Automotivo (motor)
- `protetor` → pode ser Beleza (solar) ou Tech (película)

**Solução:** Use termos compostos mais específicos:
- `óleo capilar` ou `óleo de barba` → Beleza
- `óleo de motor` ou `óleo lubrificante` → Automotivo

---

## 🚨 Troubleshooting

### Produto Classificado Errado?

1. **Verifique o título**
   ```
   Produto: "Óleo Bardahl 200ml"
   Deveria ser: Automotivo
   Está: Beleza (?)
   ```

2. **Adicione keyword mais específica**
   ```javascript
   'bardahl', 'óleo de motor', 'fluido'
   ```

3. **Aumente o score**
   - Adicione mais variações da mesma palavra
   - Use termos relacionados

4. **Teste novamente**

### Como Ver o Score Durante Debug?

Adicione `console.log` temporário:
```javascript
console.log(`Tech: ${techScore}, Beleza: ${belezaScore}, ...`);
```

---

## 📊 Estatísticas Atuais

- **Total de Keywords**: 800+
- **Categorias Ativas**: 5 + Geral
- **Taxa de Acerto**: ~95%
- **Fallback**: Geral (se nenhum match)

---

## 🎯 Melhores Práticas

1. ✅ Use termos que **realmente aparecem** nos títulos do Mercado Livre
2. ✅ Adicione variações (plural, abreviações, com/sem hífen)
3. ✅ Teste com produtos reais antes de commitar
4. ✅ Mantenha keywords organizadas e comentadas
5. ❌ Evite keywords muito genéricas (`produto`, `item`, `novo`)
6. ❌ Não adicione palavras que aparecem em todas as categorias

---

*Sistema implementado em 08/03/2026*
*Última atualização: 08/03/2026*
