#!/usr/bin/env python3
import subprocess
import time
import requests
import os

def start_server():
    """Inicia o servidor Node.js"""
    os.chdir('c:/Users/Cesar Victor/Desktop/AchadoCerto.Vip/AchadoCerto.VIP/backend')
    
    print("🚀 Iniciando servidor Node.js...")
    # Usar Popen para iniciar em background
    proc = subprocess.Popen(['node', 'server.js'], 
                           stdout=subprocess.PIPE, 
                           stderr=subprocess.STDOUT)
    
    print("⏳ Aguardando servidor iniciar...")
    time.sleep(5)
    
    # Testar API
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            response = requests.get('http://localhost:3001/api/health', timeout=2)
            print(f"✅ Servidor respondendo! Status: {response.status_code}")
            print(f"📊 Resposta: {response.json()}")
            return True
        except Exception as e:
            print(f"⏳ Tentativa {attempt+1}/{max_attempts}: {e}")
            time.sleep(1)
    
    print("❌ Servidor não respondeu após múltiplas tentativas")
    return False

if __name__ == '__main__':
    start_server()
    print("\n✅ Servidor está rodando em http://localhost:3001")
    print("Aperte Ctrl+C para parar")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Encerrando servidor...")
