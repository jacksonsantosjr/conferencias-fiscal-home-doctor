from parsers.irrf_reconciler import IRRFReconciler
r = IRRFReconciler()
with open('CONCILIAÇÃO IRRF_CSRF/IRRF _ 06.2026.xlsx', 'rb') as f:
    r.parse_sf1(f)
with open('CONCILIAÇÃO IRRF_CSRF/Relatório_IRRF_062026 I - CURITIBA.pdf', 'rb') as f:
    r.parse_aglutinacao(f)
with open('CONCILIAÇÃO IRRF_CSRF/relatorio_conferencia_reinf_R-4020_062026_export_1786474215151.xlsx', 'rb') as f:
    r.parse_r4020(f)

res = r.reconcile()
print('Total:', res['total'])
print('Conciliados:', res['conciliados'])
print('Divergentes:', res['divergentes'])
print('Ausentes:', res['ausentes'])

print('\nTop 10 detalhe:')
for item in res['detalhes'][:10]:
    print(f"{item['filial']} - {item['numero']} - {item['status']} - SF1: {item['irrf_sf1']} - Aglu: {item['irrf_aglu']} - R4020: {item['irrf_r4020']}")
