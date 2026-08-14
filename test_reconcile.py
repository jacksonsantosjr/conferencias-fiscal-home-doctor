# -*- coding: utf-8 -*-
import sys, io
sys.path.append('.')
from parsers.csrf_reconciler import CSRFReconciler

reconciler = CSRFReconciler()
with open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\Relatório_PCC_04.2026 I - RECIFE.xlsx', 'rb') as f:
    aglu_bytes = io.BytesIO(f.read())
with open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\PCC_04.2026.xlsx', 'rb') as f:
    se2_bytes = io.BytesIO(f.read())
with open(r'C:\Users\jackson.junior\OneDrive - Home Health Care Doctor Serv. Med. Dom\Documentos\Antigravity\Conferência do Faturamento\CONCILIAÇÃO IRRF_CSRF\PCC\relatorio_conferencia_reinf_R-4020_042026_export_1779208964439_RECIFE.xlsx', 'rb') as f:
    r4020_bytes = io.BytesIO(f.read())

reconciler.parse_se2(se2_bytes)
reconciler.parse_aglutinacao(aglu_bytes, is_excel=True)
reconciler.parse_r4020(r4020_bytes)

print('Aglu data len:', len(reconciler.aglu_data))
result = reconciler.reconcile()

print('Reconcile completed.')
if result['divergentes']:
    print(f'First divergente: {result["divergentes"][0]}')
if result['ausentes']:
    print(f'First ausente: {result["ausentes"][0]}')
