import pandas as pd
from parsers.irrf_reconciler import IRRFReconciler, find_col

file_bytes = open('CONCILIAÇÃO IRRF_CSRF/IRRF _ 06.2026.xlsx', 'rb')
xl = pd.ExcelFile(file_bytes)
sf1_sheet = 'SF1'
df = pd.read_excel(file_bytes, sheet_name=sf1_sheet, header=1)

irrf_col = find_col(df, ['irrf', 'ret']) or find_col(df, ['irrf']) or find_col(df, ['ret'])
num_col = find_col(df, ['numero']) or find_col(df, ['num']) or find_col(df, ['doc']) or find_col(df, ['nº'])
filial_col = find_col(df, ['filial'])
forn_col = find_col(df, ['fornecedor']) or find_col(df, ['forn']) or find_col(df, ['cod'])

print(f"Columns: {list(df.columns)}")
print(f"filial_col: {filial_col}")
print(f"num_col: {num_col}")
print(f"forn_col: {forn_col}")
print(f"irrf_col: {irrf_col}")
