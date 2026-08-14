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
        # Read the 'Fornecedor' sheet first to map Codigo -> CNPJ/Razao
        forn_map = {}
        try:
            xl = pd.ExcelFile(file_bytes)
            forn_sheet = None
            for sname in xl.sheet_names:
                if 'fornec' in sname.lower():
                    forn_sheet = sname
                    break
            
            if forn_sheet:
                df_forn = pd.read_excel(file_bytes, sheet_name=forn_sheet, header=0)
                col_cod = df_forn.columns[0]
                col_cnpj = find_col(df_forn, ['cnpj']) or df_forn.columns[min(3, len(df_forn.columns)-1)]
                col_razao = find_col(df_forn, ['raz']) or df_forn.columns[min(4, len(df_forn.columns)-1)]
                
                for _, row in df_forn.iterrows():
                    codigo = str(row[col_cod]).strip().lstrip('0') if not pd.isna(row[col_cod]) else ''
                    cnpj = clean_cnpj(row[col_cnpj])
                    razao = str(row[col_razao]).strip() if not pd.isna(row[col_razao]) else ''
                    if codigo:
                        forn_map[codigo] = {'cnpj': cnpj, 'razao': razao}
        except Exception as e:
            print("Notice: Could not read Fornecedor sheet:", e)

        file_bytes.seek(0)
        
        # Read SF1 sheet with fallback
        df = None
        try:
            xl = pd.ExcelFile(file_bytes)
            sf1_sheet = None
            for sname in xl.sheet_names:
                if 'sf1' in sname.lower():
                    sf1_sheet = sname
                    break
            
            if sf1_sheet:
                df = pd.read_excel(file_bytes, sheet_name=sf1_sheet, header=None)
            else:
                df = pd.read_excel(file_bytes, sheet_name=0, header=None)
                
            header_idx = -1
            for i, row in df.head(10).iterrows():
                row_str = ' '.join([str(v).lower() for v in row if not pd.isna(v)])
                if 'filial' in row_str and 'numero' in row_str:
                    header_idx = i
                    break
            
            if header_idx != -1:
                df.columns = df.iloc[header_idx]
                df = df.iloc[header_idx+1:].reset_index(drop=True)
            else:
                file_bytes.seek(0)
                df = pd.read_excel(file_bytes, sheet_name=sf1_sheet or 0)
                
        except Exception:
            file_bytes.seek(0)
            df = pd.read_excel(file_bytes, sheet_name=0)
        
        if df is None or df.empty:
            return

        # Encontrar colunas baseadas em palavras chaves para ser a prova de falhas de codificacao/formatacao
        irrf_col = find_col(df, ['irrf', 'ret']) or find_col(df, ['irrf']) or find_col(df, ['ret'])
        num_col = find_col(df, ['numero']) or find_col(df, ['num']) or find_col(df, ['doc']) or find_col(df, ['nº'])
        filial_col = find_col(df, ['filial'])
        forn_col = find_col(df, ['fornecedor']) or find_col(df, ['forn']) or find_col(df, ['cod'])
        
        for _, row in df.iterrows():
            if num_col and pd.isna(row.get(num_col)):
                continue
            
            irrf_val = parse_currency(row.get(irrf_col)) if irrf_col else Decimal('0.00')
            if irrf_val <= 0:
                continue

            num = clean_doc_num(row.get(num_col)) if num_col else ''
            if not num:
                continue
            
            forn_code_raw = row.get(forn_col) if forn_col else ''
            if isinstance(forn_code_raw, pd.Series):
                forn_code_raw = forn_code_raw.iloc[0]

            forn_code = str(forn_code_raw).strip().lstrip('0') if not pd.isna(forn_code_raw) else ''
            
            cnpj = ''
            razao = ''
            if forn_code in forn_map:
                cnpj = forn_map[forn_code]['cnpj']
                razao = forn_map[forn_code]['razao']
            else:
                cnpj_col_local = find_col(df, ['cnpj'])
                if cnpj_col_local and not pd.isna(row[cnpj_col_local]):
                    cnpj = clean_cnpj(row[cnpj_col_local])
                razao_col_local = find_col(df, ['raz']) or find_col(df, ['nome'])
                if razao_col_local and not pd.isna(row[razao_col_local]):
                    razao = str(row[razao_col_local]).strip()

            self.sf1_data.append({
                'numero': num,
                'fornecedor_codigo': forn_code,
                'cnpj': cnpj,
                'razao': razao,
                'irrf_sf1': irrf_val,
                'filial': clean_doc_num(row.get(filial_col)) if filial_col else ''
            })

    def parse_aglutinacao(self, file_bytes, is_excel=False):
        try:
            if is_excel:
                try:
                    df = pd.read_excel(file_bytes)
                except Exception:
                    file_bytes.seek(0)
                    df = pd.read_csv(file_bytes)
                
                col_filial = None
                col_numero = None
                col_valor = None
                
                for col in df.columns:
                    col_str = str(col).lower().strip()
                    if 'filial' in col_str: col_filial = col
                    elif 'numero' in col_str or 'título' in col_str or 'titulo' in col_str or 'documento' in col_str: col_numero = col
                    elif 'valor' in col_str or 'irrf' in col_str: col_valor = col
                
                if not col_filial or not col_numero or not col_valor:
                    print("Aviso: Colunas vitais ausentes no arquivo de Aglutinação.")
                    return
                
                df[col_filial] = df[col_filial].ffill()
                
                for _, row in df.iterrows():
                    filial_raw = str(row[col_filial]) if pd.notna(row[col_filial]) else ''
                    numero_raw = str(row[col_numero]) if pd.notna(row[col_numero]) else ''
                    
                    if not filial_raw or not numero_raw: continue
                    if 'tota' in filial_raw.lower() or not any(c.isdigit() for c in filial_raw) or not any(c.isdigit() for c in numero_raw):
                        continue
                    
                    filial = filial_raw.split('.')[0].lstrip('0')
                    numero = numero_raw.split('.')[0].lstrip('0')
                    if not filial or not numero: continue
                    
                    valor = parse_currency(row[col_valor])
                    
                    self.aglu_data.append({
                        'numero': numero,
                        'filial': filial,
                        'irrf_aglu': valor
                    })
                return

            with pdfplumber.open(file_bytes) as pdf:
                pattern = r'^(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s+([\d/]+)\s+([\d/]+)\s+([\d/]+)\s+(IRF|IRRF)\s+([\d.,]+)$'
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    for line in text.split('\n'):
                        line_str = line.strip()
                        if not line_str:
                            continue
                        
                        match = re.match(pattern, line_str)
                        if match:
                            filial = match.group(1).lstrip('0')
                            numero = match.group(2).lstrip('0')
                            valor = parse_currency(match.group(9))
                            self.aglu_data.append({
                                'numero': numero,
                                'filial': filial,
                                'irrf_aglu': valor
                            })
                        else:
                            parts = line_str.split()
                            if len(parts) >= 5 and ('IRF' in line_str or 'IRRF' in line_str):
                                digits_parts = [p for p in parts if p.isdigit()]
                                if len(digits_parts) >= 3:
                                    filial = digits_parts[0].lstrip('0')
                                    # Se houver 4 blocos de dígitos, o índice 1 é o Prefixo e o índice 2 é o Número
                                    numero = digits_parts[2].lstrip('0') if len(digits_parts) >= 4 else digits_parts[1].lstrip('0')
                                    valor = parse_currency(parts[-1])
                                    if valor > 0:
                                        self.aglu_data.append({
                                            'numero': numero,
                                            'filial': filial,
                                            'irrf_aglu': valor
                                        })
        except Exception as e:
            print("Notice: Could not parse Aglutinacao PDF:", e)

    def parse_r4020(self, file_bytes):
        try:
            df = pd.read_excel(file_bytes, header=0)
        except Exception:
            file_bytes.seek(0)
            df = pd.read_excel(file_bytes)
            
        if df is None or df.empty:
            return
        
        ir_col = find_col(df, ['valor', 'ir']) or find_col(df, ['irrf']) or find_col(df, ['ir']) or find_col(df, ['valor'])
        num_col = find_col(df, ['documento']) or find_col(df, ['numero']) or find_col(df, ['doc']) or find_col(df, ['nº'])
        cnpj_col = find_col(df, ['cnpj', 'participante']) or find_col(df, ['cnpj']) or find_col(df, ['cpf'])
        razao_col = find_col(df, ['nome', 'benef']) or find_col(df, ['nome']) or find_col(df, ['raz']) or find_col(df, ['participante'])
        filial_col = find_col(df, ['filial'])
        # Preenche valores vazios com o valor da linha superior (comum em relatórios do Protheus)
        if filial_col: df[filial_col] = df[filial_col].ffill()
        if cnpj_col: df[cnpj_col] = df[cnpj_col].ffill()
        if num_col: df[num_col] = df[num_col].ffill()
        if razao_col: df[razao_col] = df[razao_col].ffill()
        
        for _, row in df.iterrows():
            ir_val = parse_currency(row.get(ir_col)) if ir_col else Decimal('0.00')
            if ir_val <= 0:
                continue

            num = clean_doc_num(row.get(num_col)) if num_col else ''
            cnpj = clean_cnpj(row.get(cnpj_col)) if cnpj_col else ''
            razao = str(row.get(razao_col)).strip() if razao_col and not pd.isna(row.get(razao_col)) else ''
            filial = clean_doc_num(row.get(filial_col)) if filial_col else ''

            self.r4020_data.append({
                'numero': num,
                'filial': filial,
                'cnpj': cnpj,
                'razao': razao,
                'irrf_r4020': ir_val
            })

    def reconcile(self):
        # 0. Descobrir dinamicamente os prefixos válidos (raiz da matriz)
        todas_filiais_auxiliares = set()
        for item in self.aglu_data + self.r4020_data:
            f = item.get('filial', '')
            if f:
                todas_filiais_auxiliares.add(str(f).lstrip('0'))
        
        valid_prefixes = set(f[:4] for f in todas_filiais_auxiliares if len(f) >= 4)
        if not valid_prefixes:
            # Fallback se houver códigos com menos de 4 dígitos (improvável)
            valid_prefixes = set(f for f in todas_filiais_auxiliares if f)

        # 1. Agrupar tudo por Filial + Número do Documento
        master = {}

        def get_or_create(filial, num):
            key = f"{filial}_{num}"
            if key not in master:
                master[key] = {
                    'filial': filial,
                    'numero': num,
                    'fornecedor': '',
                    'cnpj': '',
                    'razao': '',
                    'irrf_sf1': Decimal('0.00'),
                    'irrf_aglu': Decimal('0.00'),
                    'irrf_r4020': Decimal('0.00'),
                    'status': ''
                }
            return master[key]

        for item in self.sf1_data:
            f_norm = str(item.get('filial', '')).lstrip('0')
            
            if valid_prefixes:
                match = any(f_norm.startswith(p) for p in valid_prefixes)
                if not match:
                    continue

            rec = get_or_create(item.get('filial', ''), item['numero'])
            rec['irrf_sf1'] += item['irrf_sf1']
            if item.get('cnpj'): rec['cnpj'] = item['cnpj']
            if item.get('razao'): rec['razao'] = item['razao']
            if item.get('fornecedor_codigo'): rec['fornecedor'] = item['fornecedor_codigo']

        for item in self.r4020_data:
            rec = get_or_create(item.get('filial', ''), item['numero'])
            rec['irrf_r4020'] += item['irrf_r4020']
            if item.get('cnpj') and not rec['cnpj']: rec['cnpj'] = item['cnpj']
            if item.get('razao') and not rec['razao']: rec['razao'] = item['razao']

        for item in self.aglu_data:
            rec = get_or_create(item.get('filial', ''), item['numero'])
            rec['irrf_aglu'] += item['irrf_aglu']

        # 2. Definir o status e montar array de resultados
        results = []
        conciliados = 0
        divergentes = 0
        ausentes = 0
        
        target_filiais = set()
        for item in self.aglu_data:
            if item.get('filial'):
                target_filiais.add(item['filial'])
        for item in self.r4020_data:
            if item.get('filial'):
                target_filiais.add(item['filial'])

        for key, rec in master.items():
            if target_filiais and rec['filial'] not in target_filiais:
                if rec['irrf_aglu'] == 0 and rec['irrf_r4020'] == 0:
                    continue

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
            
            forn = rec.get('fornecedor') or 'N/D'
            cnpj = rec.get('cnpj') or 'N/D'
            raz = rec.get('razao') or 'N/D'
            rec['chave_unica'] = f"{rec['filial']}_{rec['numero']}_{forn}_{cnpj}_{raz}"
            
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
