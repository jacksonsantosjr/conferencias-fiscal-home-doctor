import pandas as pd
import pdfplumber
import re
from decimal import Decimal
import io
import math

def clean_doc_num(num):
    if pd.isna(num): return ""
    try:
        if isinstance(num, float):
            num = int(num)
        return str(num).strip().lstrip('0')
    except:
        return str(num).strip().lstrip('0')

def clean_cnpj(cnpj):
    if pd.isna(cnpj): return ""
    return re.sub(r'\D', '', str(cnpj))

def parse_currency(val):
    if pd.isna(val) or val == '': return Decimal('0.00')
    if isinstance(val, (int, float)):
        return Decimal(str(round(val, 2)))
    val_str = str(val).strip().replace('.', '').replace(',', '.')
    try:
        return Decimal(val_str)
    except:
        return Decimal('0.00')

def find_col(df, keywords):
    """Retorna a primeira coluna cujo nome contenha todas as keywords especificadas."""
    for col in df.columns:
        col_str = str(col).lower()
        if all(kw.lower() in col_str for kw in keywords):
            return col
    return None

class IRRFReconciler:
    def __init__(self):
        self.sf1_data = []
        self.aglu_data = []
        self.r4020_data = []

    def parse_sf1(self, file_bytes):
        # Read the 'Fornecedor ' sheet first to map Codigo -> CNPJ/Razao
        try:
            df_forn = pd.read_excel(file_bytes, sheet_name='Fornecedor ', header=0)
            forn_map = {}
            col_cod = df_forn.columns[0]
            col_cnpj = find_col(df_forn, ['cnpj']) or df_forn.columns[3]
            col_razao = find_col(df_forn, ['raz']) or df_forn.columns[4]
            
            for _, row in df_forn.iterrows():
                codigo = str(row[col_cod]).strip().lstrip('0') if not pd.isna(row[col_cod]) else ''
                cnpj = clean_cnpj(row[col_cnpj])
                razao = str(row[col_razao]).strip() if not pd.isna(row[col_razao]) else ''
                if codigo:
                    forn_map[codigo] = {'cnpj': cnpj, 'razao': razao}
        except Exception as e:
            print("Notice: Could not read Fornecedor sheet:", e)
            forn_map = {}

        file_bytes.seek(0)
        
        # Read SF1 sheet
        df = pd.read_excel(file_bytes, sheet_name='SF1', header=1)
        
        # Encontrar colunas baseadas em palavras chaves para ser a prova de falhas de codificacao/formatacao
        irrf_col = find_col(df, ['irrf', 'ret'])
        num_col = find_col(df, ['numero'])
        filial_col = find_col(df, ['filial'])
        forn_col = find_col(df, ['fornecedor'])
        
        for _, row in df.iterrows():
            if pd.isna(row.get(num_col)):
                continue
            
            irrf_val = parse_currency(row.get(irrf_col)) if irrf_col else Decimal('0.00')
            if irrf_val <= 0:
                continue

            num = clean_doc_num(row.get(num_col))
            
            forn_code_raw = row.get(forn_col)
            if isinstance(forn_code_raw, pd.Series):
                forn_code_raw = forn_code_raw.iloc[0]

            forn_code = str(forn_code_raw).strip().lstrip('0')
            
            cnpj = ''
            razao = ''
            if forn_code in forn_map:
                cnpj = forn_map[forn_code]['cnpj']
                razao = forn_map[forn_code]['razao']
            else:
                if 'CNPJ' in row and not pd.isna(row['CNPJ']):
                    cnpj = clean_cnpj(row['CNPJ'])
                razao_col_local = find_col(df, ['raz'])
                if razao_col_local and not pd.isna(row[razao_col_local]):
                    razao = str(row[razao_col_local]).strip()

            self.sf1_data.append({
                'numero': num,
                'fornecedor_codigo': forn_code,
                'cnpj': cnpj,
                'razao': razao,
                'irrf_sf1': irrf_val,
                'filial': str(row.get(filial_col)).strip() if filial_col else ''
            })

    def parse_aglutinacao(self, file_bytes):
        with pdfplumber.open(file_bytes) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                
                # Exemplo: 0208000001 000000109 01 TX 09/06/2026 20/07/2026 20/07/2026 IRF 189,73
                pattern = r'^(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s+([\d/]+)\s+([\d/]+)\s+([\d/]+)\s+(IRF)\s+([\d.,]+)$'
                
                for line in text.split('\n'):
                    match = re.match(pattern, line.strip())
                    if match:
                        filial = match.group(1).lstrip('0')
                        numero = match.group(2).lstrip('0')
                        valor = parse_currency(match.group(9))
                        self.aglu_data.append({
                            'numero': numero,
                            'filial': filial,
                            'irrf_aglu': valor
                        })

    def parse_r4020(self, file_bytes):
        df = pd.read_excel(file_bytes, header=0)
        
        ir_col = find_col(df, ['valor', 'ir'])
        num_col = find_col(df, ['documento']) # Trata o Nº
        cnpj_col = find_col(df, ['cnpj', 'participante'])
        razao_col = find_col(df, ['nome', 'benef'])
        
        for _, row in df.iterrows():
            ir_val = parse_currency(row.get(ir_col)) if ir_col else Decimal('0.00')
            if ir_val <= 0:
                continue

            num = clean_doc_num(row.get(num_col)) if num_col else ''
            cnpj = clean_cnpj(row.get(cnpj_col)) if cnpj_col else ''
            razao = str(row.get(razao_col)).strip() if razao_col and not pd.isna(row.get(razao_col)) else ''

            self.r4020_data.append({
                'numero': num,
                'cnpj': cnpj,
                'razao': razao,
                'irrf_r4020': ir_val
            })

    def reconcile(self):
        # 1. Agrupar tudo pelo Número do Documento
        master = {}

        def get_or_create(num):
            if num not in master:
                master[num] = {
                    'numero': num,
                    'cnpj': '',
                    'razao': '',
                    'irrf_sf1': Decimal('0.00'),
                    'irrf_aglu': Decimal('0.00'),
                    'irrf_r4020': Decimal('0.00'),
                    'status': ''
                }
            return master[num]

        for item in self.sf1_data:
            rec = get_or_create(item['numero'])
            rec['irrf_sf1'] += item['irrf_sf1']
            if item['cnpj'] and not rec['cnpj']: rec['cnpj'] = item['cnpj']
            if item['razao'] and not rec['razao']: rec['razao'] = item['razao']

        for item in self.r4020_data:
            rec = get_or_create(item['numero'])
            rec['irrf_r4020'] += item['irrf_r4020']
            if item['cnpj'] and not rec['cnpj']: rec['cnpj'] = item['cnpj']
            if item['razao'] and not rec['razao']: rec['razao'] = item['razao']

        for item in self.aglu_data:
            rec = get_or_create(item['numero'])
            rec['irrf_aglu'] += item['irrf_aglu']

        # 2. Definir o status e montar array de resultados
        results = []
        conciliados = 0
        divergentes = 0
        ausentes = 0
        
        for num, rec in master.items():
            s = rec['irrf_sf1']
            a = rec['irrf_aglu']
            r = rec['irrf_r4020']

            if s > 0 and a > 0 and r > 0 and s == a and a == r:
                rec['status'] = 'Conciliado'
                conciliados += 1
            elif (s == 0 or a == 0 or r == 0) and (s > 0 or a > 0 or r > 0):
                rec['status'] = 'Ausente'
                ausentes += 1
            else:
                rec['status'] = 'Divergente'
                divergentes += 1
            
            rec['irrf_sf1'] = float(s)
            rec['irrf_aglu'] = float(a)
            rec['irrf_r4020'] = float(r)
            results.append(rec)
            
        return {
            'conciliados': conciliados,
            'divergentes': divergentes,
            'ausentes': ausentes,
            'total': len(results),
            'detalhes': results
        }
