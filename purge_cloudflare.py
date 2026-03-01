#!/usr/bin/env python3
"""
Limpa cache do Cloudflare para achadocerto.vip
Requer variáveis de ambiente:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ZONE_ID
"""

import os
import requests
import json

API_TOKEN = os.environ.get('CLOUDFLARE_API_TOKEN')
ZONE_ID = os.environ.get('CLOUDFLARE_ZONE_ID')
DOMAIN = 'achadocerto.vip'

if not API_TOKEN or not ZONE_ID:
    print("Erro: Configure as variáveis de ambiente CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID")
    print("\nVocê pode obter o API Token em: https://dash.cloudflare.com/profile/api-tokens")
    print("E o Zone ID em: https://dash.cloudflare.com (copie de um post/API na dashboard)")
    exit(1)

print("=" * 80)
print("Limpando cache Cloudflare para: " + DOMAIN)
print("=" * 80)

url = f"https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/purge_cache"

headers = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

# Opção 1: Purgar tudo (mais eficaz)
data = {
    "purge_everything": True
}

response = requests.post(url, json=data, headers=headers)
result = response.json()

if result['success']:
    print("\n✓ Cache purged successfully!")
    print(f"  Dominio: {DOMAIN}")
    print(f"  Status: {result['result']}")
else:
    print("\n✗ Erro ao purgar cache:")
    for msg in result.get('errors', []):
        print(f"  - {msg}")
    exit(1)

print("\n" + "=" * 80)
print("Logo deve aparecer em 30 segundos")
print("=" * 80)
