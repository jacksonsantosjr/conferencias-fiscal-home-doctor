import re
with open('parsers/erp_parser.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = re.sub(r'\"SERVI.*OS TOMADOS\" in text\.upper\(\):', '\"TOMADOS\" in text.upper() and \"SERVI\" in text.upper():', content)

with open('parsers/erp_parser.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Replaced:', content != new_content)
