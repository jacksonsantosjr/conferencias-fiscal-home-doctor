# -*- coding: utf-8 -*-
import sys, io
sys.path.append('.')
from parsers.csrf_reconciler import CSRFReconciler

reconciler = CSRFReconciler()
with open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\PCC_04.2026.xlsx', 'rb') as f:
    se2_bytes = io.BytesIO(f.read())

reconciler.parse_se2(se2_bytes)

print('SE2 data items (first 5):')
for item in reconciler.se2_data[:5]:
    print(item)
