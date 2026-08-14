import requests
import urllib3
urllib3.disable_warnings()

url = 'http://localhost:8000/api/reconcile-csrf'

files = {
    'se2_file': ('PCC_04.2026.xlsx', open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\PCC_04.2026.xlsx', 'rb'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    'aglu_file': ('Relatório_PCC_04.2026 I - RECIFE.xlsx', open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\Relatório_PCC_04.2026 I - RECIFE.xlsx', 'rb'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    'r4020_file': ('relatorio_conferencia_reinf_R-4020_042026_export_1779208964439_RECIFE.xlsx', open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\relatorio_conferencia_reinf_R-4020_042026_export_1779208964439_RECIFE.xlsx', 'rb'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

response = requests.post(url, files=files)
data = response.json()

if 'detalhes' in data:
    for item in data['detalhes']:
        if item.get('numero') == '1':
            print('API Result for numero 1:', item)
            break
else:
    print('Error:', data)
