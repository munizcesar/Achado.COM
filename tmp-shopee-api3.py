import requests,re
shopid='1215229492'
itemid='23694229374'
headers={
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Referer':f'https://shopee.com.br/product/{shopid}/{itemid}',
    'Accept':'application/json, text/plain, */*',
    'x-api-source':'pc',
    'x-requested-with':'XMLHttpRequest',
    'Sec-Fetch-Mode':'cors',
    'Sec-Fetch-Site':'same-origin',
    'Sec-Fetch-Dest':'empty'
}
for endpoint in ['https://shopee.com.br/api/v4/item/get','https://shopee.com.br/api/v4/product/get','https://shopee.com.br/api/v2/item/get','https://shopee.com.br/api/v4/product/get_item_detail','https://shopee.com.br/api/v4/pages/get_item_base_info']:
    r=requests.get(f'{endpoint}?itemid={itemid}&shopid={shopid}', headers=headers, timeout=30)
    print(endpoint, r.status_code, r.text[:500])
