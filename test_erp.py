from parsers.erp_parser import ERPParser
p = 'Relatórios Prefeituras/Belém/Relatório de Notas Fiscais Serviços Tomados Belém 07-2026.pdf'
res = ERPParser().parse_file(p)
res_gt0 = [r for r in res if r.get('valor_iss', 0) > 0]
print('ISS > 0:', len(res_gt0))
for r in res_gt0:
    print(f"N: {r.get('nf_num')}, ISS: {r.get('valor_iss')}")
