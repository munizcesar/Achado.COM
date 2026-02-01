#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MONITOR AUTOMÁTICO DE POSTS
Valida posts em tempo real conforme são modificados
Uso: python monitor-posts.py
"""

import os
import sys
import time
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import subprocess

class ValidadorEventHandler(FileSystemEventHandler):
    def __init__(self):
        self.ultimo_check = {}
    
    def on_modified(self, event):
        """Executado quando arquivo é modificado"""
        if event.is_directory:
            return
        
        # Apenas arquivos HTML
        if not event.src_path.endswith('.html'):
            return
        
        # Evitar múltiplos checks em segundos
        agora = time.time()
        if event.src_path in self.ultimo_check:
            if agora - self.ultimo_check[event.src_path] < 2:
                return
        
        self.ultimo_check[event.src_path] = agora
        
        # Excluir testes e templates
        if any(x in event.src_path for x in ['teste-', 'boilerplate', 'validador-', 'relatorio-']):
            return
        
        print(f"\n🔄 Detectado: {Path(event.src_path).name}")
        self._validar_arquivo(event.src_path)
    
    def _validar_arquivo(self, caminho):
        """Roda validador no arquivo"""
        try:
            # Rodar script de validação
            resultado = subprocess.run(
                ['python', 'validador-posts-auto.py', caminho],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Mostrar resultado
            if resultado.returncode == 0:
                print(f"✅ {Path(caminho).name} - Validação PASSOU")
            else:
                print(f"❌ {Path(caminho).name} - ERROS encontrados:")
                # Mostrar últimas linhas (erros)
                linhas = resultado.stdout.split('\n')
                for linha in linhas:
                    if '❌' in linha or '⚠️' in linha:
                        print(f"   {linha}")
        
        except subprocess.TimeoutExpired:
            print(f"⏱️  Timeout ao validar {Path(caminho).name}")
        except Exception as e:
            print(f"❌ Erro ao validar: {str(e)}")

def main():
    print("""
🔍 MONITOR AUTOMÁTICO DE POSTS
================================

Monitora alterações em arquivos HTML e valida automaticamente.

Começando monitoramento...
- Arquivos: blog/*.html e *.html (posts)
- Exclusões: teste-*, boilerplate, validador-*, relatorio-*
- Atualização: Automática ao salvar arquivo

Pressione Ctrl+C para parar.
    """)
    
    # Configurar observer
    event_handler = ValidadorEventHandler()
    observer = Observer()
    
    # Monitorar diretório atual
    observer.schedule(event_handler, '.', recursive=True)
    
    try:
        observer.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Monitor parado.")
        observer.stop()
    
    observer.join()

if __name__ == '__main__':
    try:
        from watchdog.observers import Observer
    except ImportError:
        print("❌ watchdog não instalado!")
        print("   Instale: pip install watchdog")
        sys.exit(1)
    
    main()
