import urllib.request
import urllib.parse
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def search_ddg(query):
    url = 'https://lite.duckduckgo.com/lite/'
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
        redirects = re.findall(r'href="((?:/|http).*?uddg=[^"]+)"', html)
        links = []
        for r in redirects:
            actual_url = urllib.parse.unquote(r.split('uddg=')[1].split('&')[0])
            if '.pdf' in actual_url.lower():
                links.append(actual_url)
        return list(set(links))
    except:
        return []

print(search_ddg('filetype:pdf "Produktinformationsblatt" Strom Vattenfall'))
