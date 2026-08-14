import re

with open('static/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

ids = re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', js)
unique_ids = set(ids)

with open('static/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

for i in unique_ids:
    if f'id="{i}"' not in html and f'id=\'{i}\'' not in html:
        print(f'MISSING in HTML: {i}')
