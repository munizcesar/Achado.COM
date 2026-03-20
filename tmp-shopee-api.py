import requests, re
final='https://shopee.com.br/opaanlp/1215229492/23694229374?__mobile__=1'
m=re.search(r'/opaanlp/(\d+)/(\d+)', final)
print('matcher', m and m.groups())
if m:
    shopid,itemid=m.groups()
    headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36','Referer': final,'Accept':'application/json, text/plain, */*','x-api-source':'pc','x-requested-with':'XMLHttpRequest'}
    for endpoint in ['https://shopee.com.br/api/v4/item/get','https://shopee.com.br/api/v4/product/get','https://shopee.com.br/api/v2/item/get']:
        r = requests.get(f'{endpoint}?itemid={itemid}&shopid={shopid}', headers=headers, timeout=30)
        print(endpoint, r.status_code, r.text[:500])
