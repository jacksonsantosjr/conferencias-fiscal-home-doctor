# -*- coding: utf-8 -*-
import sys, io
sys.path.append('.')
from parsers.csrf_reconciler import CSRFReconciler

reconciler = CSRFReconciler()
with open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\Relatório_PCC_04.2026 I - RECIFE.xlsx', 'rb') as f:
    aglu_bytes = io.BytesIO(f.read())

reconciler.parse_aglutinacao(aglu_bytes, is_excel=True)

print('Aglu data items (first 5):')
for item in reconciler.aglu_data[:5]:
    print(item)
