# 📸 Otimizador de Imagens OG - Guia de Uso

## O que foi feito

✅ **Todas as 15 imagens OG foram redimensionadas para 1200x630px**
- Padrão ideal para compartilhamento em redes sociais
- Backup automático criado em `frontend/images/imagesposts_backup`
- Qualidade otimizada (85%) para melhor visualização

## Quando usar no futuro

**Sempre que adicionar novos posts com imagens**, rode o script para otimizá-las:

### Uso Básico (recomendado)
```bash
python otimizar_og.py
```
Isso:
- Processa `frontend/images/imagesposts/` automaticamente
- Cria backup da pasta
- Redimensiona todas as imagens para 1200x630px
- Otimiza qualidade JPEG

### Uso Avançado

**Especificar diretório customizado:**
```bash
python otimizar_og.py -d caminho/para/pasta
```

**Alterar tamanho alvo (ex: 1600x900):**
```bash
python otimizar_og.py -w 1600 -e 900
```

**Mudar qualidade (padrão 85, menor = mais comprimido):**
```bash
python otimizar_og.py -q 75
```

**Ver detalhes de cada imagem processada:**
```bash
python otimizar_og.py -v
```

**Não criar backup (use com cuidado!):**
```bash
python otimizar_og.py --no-backup
```

**Combinar opções:**
```bash
python otimizar_og.py -d fronted/images/novos -q 80 -v
```

---

## Backup - Como restaurar

Se precisar restaurar uma imagem original:

1. Procure a pasta `backend/images/imagesposts_backup_YYYYMMDD_HHMMSS`
2. Copie a imagem de lá
3. Coloque de volta em `frontend/images/imagesposts`
4. Rode o script novamente: `python otimizar_og.py`

---

## Verificar se está correto

Rodei o comando `python otimizar_og.py` uma vez, então agora:
- ✅ Todas as imagens têm 1200x630px
- ✅ Estão otimizadas para redes sociais
- ✅ Compartilhamento em WhatsApp, Twitter, Facebook aparecerá **perfeito**

---

## Padrões OG Brasil

| Rede Social | Tamanho Recomendado | Aspecto |
|---|---|---|
| Facebook | 1200x630 | 16:9 |
| Twitter/X | 1200x630 | 16:9 |
| WhatsApp | 1200x630 | 16:9 |
| Instagram | 1200x1200 | 1:1 |
| LinkedIn | 1200x627 | 16:9 |

**Usamos 1200x630px pois funciona em todas!**

---

## Troubleshooting

### Erro: "Diretório não encontrado"
- Verifique o caminho
- Use caminhos relativos (ex: `frontend/images/imagesposts`)

### Imagens distorcidas após otimização
- O script faz crop inteligente (mantém proporção)
- Se ficou ruim, restaure do backup e tente tamanho diferente

### Arquivo muito grande (>300KB)
- Use `-q 70` para mais compressão
- `python otimizar_og.py -q 70`

### Preciso converter PNG para JPG
- Coloque os PNGs em uma pasta
- `python otimizar_og.py -d pasta_com_pngs`
- O script converte automaticamente

---

## Próximos passos

Sempre que criar novo post:
1. Adicione imagem OG em `frontend/images/imagesposts/`
2. Rode: `python otimizar_og.py`
3. Compartilhe o post na rede social
4. Imagem aparecerá **perfeita** 🎉

---

**Última atualização:** 28 de fevereiro de 2026  
**Versão:** 1.0  
**Status:** Pronto para usar
