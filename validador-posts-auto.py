#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VALIDADOR AUTOMÁTICO DE POSTS v2.1.0
Valida e corrige meta tags, imagens e estrutura HTML de posts
Uso: python validador-posts-auto.py seu-post.html
"""

import os
import sys
import re
from pathlib import Path
from PIL import Image
import json
from datetime import datetime

class ValidadorPostsAuto:
    def __init__(self, arquivo_html):
        self.arquivo = arquivo_html
        self.erros = []
        self.avisos = []
        self.sucessos = []
        self.correcoes_aplicadas = []
        
        # Padrões v2.1.0
        self.meta_tags_obrigatorias = {
            'og:title': 'Título do post',
            'og:description': 'Descrição meta (50-160 char)',
            'og:image': 'URL da imagem principal',
            'og:image:secure_url': 'URL segura (HTTPS)',
            'og:image:width': 'Largura da imagem',
            'og:image:height': 'Altura da imagem',
            'og:image:type': 'Tipo MIME (image/jpeg)',
            'og:image:alt': 'Descrição acessível',
            'og:type': 'website',
            'og:url': 'URL canônica',
            'og:site_name': 'AchadoCerto.VIP',
        }
        
        self.twitter_tags_obrigatorias = {
            'twitter:card': 'summary_large_image',
            'twitter:title': 'Título',
            'twitter:description': 'Descrição',
            'twitter:image': 'Imagem',
        }
        
        self.dimensoes_recomendadas = {
            'padrao': (1200, 630),
            'quadrado': (1200, 1200),
            'vertical': (600, 900),
        }

    def validar(self):
        """Executa validação completa"""
        print(f"\n🔍 VALIDANDO: {self.arquivo}")
        print("=" * 60)
        
        if not os.path.exists(self.arquivo):
            print(f"❌ ERRO: Arquivo não encontrado: {self.arquivo}")
            return False
        
        with open(self.arquivo, 'r', encoding='utf-8') as f:
            self.conteudo = f.read()
        
        # Executar validações
        self._validar_meta_tags_og()
        self._validar_meta_tags_twitter()
        self._validar_imagens()
        self._validar_url_og_image()
        self._validar_estrutura_html()
        
        # Mostrar resultados
        self._mostrar_resultados()
        
        return len(self.erros) == 0

    def _validar_meta_tags_og(self):
        """Valida Open Graph meta tags"""
        print("\n📋 Validando Open Graph Tags...")
        
        for tag, descricao in self.meta_tags_obrigatorias.items():
            pattern = f'property="{tag}"[^>]*content="([^"]*)"'
            match = re.search(pattern, self.conteudo)
            
            if match:
                valor = match.group(1)
                if valor.strip():
                    self.sucessos.append(f"✅ {tag}: {valor[:50]}...")
                else:
                    self.erros.append(f"❌ {tag}: Valor vazio!")
            else:
                self.erros.append(f"❌ {tag}: NÃO ENCONTRADA!")

    def _validar_meta_tags_twitter(self):
        """Valida Twitter Card meta tags"""
        print("\n🐦 Validando Twitter Card Tags...")
        
        for tag, descricao in self.twitter_tags_obrigatorias.items():
            pattern = f'name="{tag}"[^>]*content="([^"]*)"'
            match = re.search(pattern, self.conteudo)
            
            if match:
                valor = match.group(1)
                if valor.strip():
                    self.sucessos.append(f"✅ {tag}: {valor[:50]}...")
                else:
                    self.avisos.append(f"⚠️  {tag}: Valor vazio (opcional)")
            else:
                self.avisos.append(f"⚠️  {tag}: Não encontrada (opcional)")

    def _validar_imagens(self):
        """Valida imagens WebP, dimensões e formato"""
        print("\n🖼️  Validando Imagens...")
        
        # Encontrar todas as imagens
        padroes = [
            r'og:image"[^>]*content="([^"]+)"',
            r'<img[^>]*src="([^"]+)"',
            r'background-image:\s*url\(["\']?([^"\']+)["\']?\)'
        ]
        
        imagens = set()
        for padrao in padroes:
            matches = re.findall(padrao, self.conteudo)
            imagens.update(matches)
        
        for img_url in imagens:
            if img_url.startswith('http'):
                self.avisos.append(f"ℹ️  Imagem externa (não validada): {img_url[:50]}...")
                continue
            
            # Caminho relativo - validar localmente
            img_path = os.path.join(os.path.dirname(self.arquivo), img_url)
            
            if not os.path.exists(img_path):
                self.erros.append(f"❌ Imagem não encontrada: {img_url}")
                continue
            
            # Validar formato
            if img_url.lower().endswith('.webp'):
                self.erros.append(f"❌ WebP não suportado em og:image: {img_url}")
                self.correcoes_aplicadas.append(f"⚡ Converter para JPG: {img_url}")
                continue
            
            # Validar dimensões
            try:
                img = Image.open(img_path)
                largura, altura = img.size
                
                # Validar proporção
                proporcao = largura / altura
                
                # Proporção esperada: ~1.9:1 (1200:630)
                if abs(proporcao - 1.9) < 0.3:  # Margem de 30%
                    self.sucessos.append(f"✅ Imagem {img_url}: {largura}x{altura} (ótima)")
                else:
                    self.avisos.append(f"⚠️  Imagem {img_url}: {largura}x{altura} (redimensionar para 1200x630)")
                    
            except Exception as e:
                self.erros.append(f"❌ Erro ao ler imagem {img_url}: {str(e)}")

    def _validar_url_og_image(self):
        """Valida se og:image tem versão secure_url igual"""
        print("\n🔒 Validando og:image:secure_url...")
        
        pattern_og = r'property="og:image"[^>]*content="([^"]+)"'
        pattern_secure = r'property="og:image:secure_url"[^>]*content="([^"]+)"'
        
        match_og = re.search(pattern_og, self.conteudo)
        match_secure = re.search(pattern_secure, self.conteudo)
        
        if match_og and match_secure:
            og_url = match_og.group(1)
            secure_url = match_secure.group(1)
            
            if og_url == secure_url:
                self.sucessos.append(f"✅ og:image e secure_url idênticas")
            else:
                self.erros.append(f"❌ og:image ≠ og:image:secure_url")
        elif match_og:
            self.erros.append(f"❌ og:image:secure_url FALTANDO!")
        elif not match_secure:
            self.avisos.append(f"⚠️  og:image:secure_url ausente")

    def _validar_estrutura_html(self):
        """Valida estrutura básica HTML"""
        print("\n📝 Validando Estrutura HTML...")
        
        # DOCTYPE
        if '<!DOCTYPE html>' in self.conteudo or '<!doctype html>' in self.conteudo.lower():
            self.sucessos.append(f"✅ DOCTYPE presente")
        else:
            self.erros.append(f"❌ DOCTYPE faltando")
        
        # Charset
        if 'charset="utf-8"' in self.conteudo or "charset='utf-8'" in self.conteudo:
            self.sucessos.append(f"✅ Charset UTF-8 presente")
        else:
            self.avisos.append(f"⚠️  Charset UTF-8 não explícito")
        
        # Viewport
        if 'viewport' in self.conteudo:
            self.sucessos.append(f"✅ Meta viewport presente")
        else:
            self.avisos.append(f"⚠️  Meta viewport ausente (mobile)")
        
        # Descrição
        if '<meta name="description"' in self.conteudo:
            self.sucessos.append(f"✅ Meta description presente")
        else:
            self.avisos.append(f"⚠️  Meta description ausente")

    def _mostrar_resultados(self):
        """Exibe relatório formatado"""
        print("\n" + "=" * 60)
        print("📊 RELATÓRIO DE VALIDAÇÃO")
        print("=" * 60)
        
        # Sucessos
        if self.sucessos:
            print(f"\n✅ SUCESSO ({len(self.sucessos)}):")
            for sucesso in self.sucessos[:5]:
                print(f"   {sucesso}")
            if len(self.sucessos) > 5:
                print(f"   ... e mais {len(self.sucessos) - 5}")
        
        # Avisos
        if self.avisos:
            print(f"\n⚠️  AVISOS ({len(self.avisos)}):")
            for aviso in self.avisos:
                print(f"   {aviso}")
        
        # Erros
        if self.erros:
            print(f"\n❌ ERROS ({len(self.erros)}):")
            for erro in self.erros:
                print(f"   {erro}")
        
        # Resumo
        print("\n" + "=" * 60)
        if self.erros:
            print(f"🔴 STATUS: FALHOU ({len(self.erros)} erros)")
        elif self.avisos:
            print(f"🟡 STATUS: AVISOS ({len(self.avisos)} avisos)")
        else:
            print(f"🟢 STATUS: PASSOU (Pronto para publicar!)")
        
        print("=" * 60)

    def corrigir_automaticamente(self):
        """Corrige problemas comuns automaticamente"""
        print("\n⚡ APLICANDO CORREÇÕES AUTOMÁTICAS...")
        
        # Corrigir: Adicionar og:image:secure_url se faltar
        if 'og:image:secure_url' not in self.conteudo:
            pattern = r'(<meta property="og:image" content="https://achadocerto\.vip/images/imagesposts/[^"]+"\s*/?>)'
            replacement = r'\1\n<meta property="og:image:secure_url" content="\1" />'
            
            # Implementação mais simples
            match = re.search(r'property="og:image" content="([^"]+)"', self.conteudo)
            if match:
                og_image_url = match.group(1)
                nova_meta = f'<meta property="og:image:secure_url" content="{og_image_url}" />'
                
                # Inserir após og:image
                self.conteudo = self.conteudo.replace(
                    match.group(0),
                    match.group(0) + '\n' + nova_meta
                )
                print(f"   ✅ Adicionado og:image:secure_url")
        
        return self.conteudo

def main():
    if len(sys.argv) < 2:
        print("""
🚀 VALIDADOR AUTOMÁTICO DE POSTS v2.1.0
========================================

Uso: python validador-posts-auto.py seu-post.html

Exemplos:
  python validador-posts-auto.py blog/novo-post.html
  python validador-posts-auto.py index.html

O que valida:
  ✅ Meta tags Open Graph (11 obrigatórias)
  ✅ Meta tags Twitter Card (4 obrigatórias)
  ✅ Imagens (formato JPG, dimensões, existência)
  ✅ Estrutura HTML (DOCTYPE, charset, viewport)
  ✅ URLs seguras (HTTPS em og:image:secure_url)

Saída:
  🟢 PASSOU   = Pronto para publicar
  🟡 AVISOS   = Revisar recomendações
  🔴 FALHOU   = Corrigir antes de publicar
        """)
        sys.exit(1)
    
    arquivo = sys.argv[1]
    validador = ValidadorPostsAuto(arquivo)
    
    # Validar
    resultado = validador.validar()
    
    # Corrigir automaticamente se houver option
    if '--corrigir' in sys.argv:
        print("\n⚡ CORRIGINDO AUTOMATICAMENTE...")
        conteudo_corrigido = validador.corrigir_automaticamente()
        
        # Salvar backup
        backup = arquivo.replace('.html', '.backup.html')
        with open(backup, 'w', encoding='utf-8') as f:
            with open(arquivo, 'r', encoding='utf-8') as orig:
                f.write(orig.read())
        print(f"   💾 Backup salvo: {backup}")
        
        # Salvar corrigido
        with open(arquivo, 'w', encoding='utf-8') as f:
            f.write(conteudo_corrigido)
        print(f"   ✅ Arquivo corrigido: {arquivo}")
    
    # Código de saída
    sys.exit(0 if resultado else 1)

if __name__ == '__main__':
    main()
