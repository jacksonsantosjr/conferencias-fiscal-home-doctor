from parsers.belem_parser import BelemParser
import os
p = 'Relatórios Prefeituras/Belém/Download - NFS-e - Relatório Serv. Tomados - 01-07-2026 a 31-07-2026 - Belém.xlsx'
parser = BelemParser()
res = parser.parse(p)
print(f'Total records parsed: {len(res)}')
for r in res[:5]:
    print(f"N: {r.get('numero')}, Vl: {r.get('valor')}, BC: {r.get('valor_base_calculo')}, ISS: {r.get('valor_iss')}, ISS_Retido: {r.get('iss_retido')}")
