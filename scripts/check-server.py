import urllib.request

url = "http://127.0.0.1:4173/"
with urllib.request.urlopen(url, timeout=5) as response:
    body = response.read()
    text = body.decode("utf-8", "replace")
    print("status", response.status)
    print("bytes", len(body))
    print("has_title", "OpenGrok" in text)
    print("has_hero", "我们要构建什么" in text)
    print("has_css", "css/site.css" in text)
