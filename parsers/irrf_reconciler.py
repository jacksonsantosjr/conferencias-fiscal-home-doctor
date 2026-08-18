import pandas as pd
import pdfplumber
import re
from decimal import Decimal
import io
import math
import openpyxl

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
        file_bytes.seek(0)
        try:
            xl = pd.ExcelFile(file_bytes)
        except Exception as e:
            print(f"Notice: Could not load ExcelFile for SF1. Error: {e}")
            return
            
        sheet_names = xl.sheet_names
        forn_sheet = next((s for s in sheet_names if 'fornec' in s.lower()), None)
        sf1_sheet = next((s for s in sheet_names if 'sf1' in s.lower()), sheet_names[0])
        
        # 1. Achar linha de cabeçalho lendo apenas 10 linhas
        df_head = pd.read_excel(xl, sheet_name=sf1_sheet, nrows=10, header=None)
        header_idx = 0
        for i, row in df_head.iterrows():
            row_str = ' '.join([str(v).lower() for v in row if pd.notna(v)])
            if 'filial' in row_str and ('numero' in row_str or 'doc' in row_str or 'nº' in row_str or 'titulo' in row_str or 'título' in row_str or 'rend' in row_str):
                header_idx = i
                break
        
        # 2. Ler apenas as colunas estritamente necessárias
        def col_filter_sf1(c):
            c_low = str(c).lower().strip()
            return any(k in c_low for k in ['filial', 'titulo', 'título', 'numero', 'número', 'doc', 'nº', 'fornecedor', 'forn', 'cnpj', 'raz', 'nome', 'rend', 'irrf', 'ret', 'imp.'])

        try:
            df = pd.read_excel(xl, sheet_name=sf1_sheet, header=header_idx, usecols=col_filter_sf1)
        except Exception as e:
            print(f"Notice: Could not read SF1 sheet with filter: {e}")
            df = pd.read_excel(xl, sheet_name=sf1_sheet, header=header_idx)
            
        if df is None or df.empty:
            return

        irrf_col = find_col(df, ['rend']) or find_col(df, ['irrf']) or find_col(df, ['imp'])
        num_col = find_col(df, ['titulo']) or find_col(df, ['numero']) or find_col(df, ['doc']) or find_col(df, ['nº'])
        filial_col = find_col(df, ['filial'])
        forn_col = find_col(df, ['fornecedor']) or find_col(df, ['forn']) or find_col(df, ['cod'])
        cnpj_col_local = find_col(df, ['cnpj'])
        razao_col_local = find_col(df, ['raz']) or find_col(df, ['nome'])
        
        # 3. Carregar aba Fornecedor se existir (apenas colunas de Codigo, CNPJ e Razao)
        forn_map = {}
        if forn_sheet:
            try:
                def col_filter_forn(c):
                    c_low = str(c).lower().strip()
                    return c_low in ['codigo', 'código', 'cod', 'cód'] or c_low in ['cnpj/cpf', 'cnpj', 'cpf'] or 'razao' in c_low or 'razão' in c_low

                df_forn = pd.read_excel(xl, sheet_name=forn_sheet, usecols=col_filter_forn)
                if not df_forn.empty:
                    col_cod = find_col(df_forn, ['cod']) or df_forn.columns[0]
                    col_cnpj = find_col(df_forn, ['cnpj']) or find_col(df_forn, ['cpf']) or (df_forn.columns[1] if len(df_forn.columns) > 1 else None)
                    col_razao = find_col(df_forn, ['raz']) or (df_forn.columns[2] if len(df_forn.columns) > 2 else None)
                    
                    for _, row in df_forn.iterrows():
                        if col_cod is None or pd.isna(row.get(col_cod)): continue
                        codigo = str(row[col_cod]).strip().lstrip('0')
                        cnpj = clean_cnpj(row[col_cnpj]) if col_cnpj else ''
                        razao = str(row[col_razao]).strip() if col_razao and not pd.isna(row[col_razao]) else ''
                        if codigo:
                            forn_map[codigo] = {'cnpj': cnpj, 'razao': razao}
            except Exception as e:
                print(f"Notice: Could not read Fornecedor sheet: {e}")
        
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
            if cnpj_col_local and not pd.isna(row.get(cnpj_col_local)) and str(row.get(cnpj_col_local)).strip() != '' and str(row.get(cnpj_col_local)).strip().lower() != 'nan':
                cnpj = clean_cnpj(row.get(cnpj_col_local))
            if not cnpj and forn_code in forn_map:
                cnpj = forn_map[forn_code]['cnpj']

            razao = ''
            if razao_col_local and not pd.isna(row.get(razao_col_local)) and str(row.get(razao_col_local)).strip() != '' and str(row.get(razao_col_local)).strip().lower() != 'nan':
                razao = str(row.get(razao_col_local)).strip()
            if not razao and forn_code in forn_map:
                razao = forn_map[forn_code]['razao']

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
        tipo_col = find_col(df, ['tipo'])
        
        for _, row in df.iterrows():
            if tipo_col and pd.notna(row.get(tipo_col)):
                if str(row.get(tipo_col)).strip().upper() != 'PGT':
                    continue
            
            num_raw = row.get(num_col) if num_col else None
            if pd.isna(num_raw) or str(num_raw).strip() == '' or str(num_raw).strip().lower() == 'nan':
                continue

            ir_val = parse_currency(row.get(ir_col)) if ir_col else Decimal('0.00')
            if ir_val <= 0:
                continue

            num = clean_doc_num(num_raw)
            if not num:
                continue

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
        has_sf1 = len(self.sf1_data) > 0
        has_aglu = len(self.aglu_data) > 0
        has_r4020 = len(self.r4020_data) > 0
        num_active = sum([has_sf1, has_aglu, has_r4020])

        if num_active < 2:
            return {
                'conciliados': 0,
                'divergentes': 0,
                'ausentes': 0,
                'total': 0,
                'detalhes': [],
                'num_relatorios': num_active
            }

        # 0. Descobrir dinamicamente os prefixos válidos (raiz da matriz)
        todas_filiais_auxiliares = set()
        for item in self.aglu_data + self.r4020_data:
            f = item.get('filial', '')
            if f:
                todas_filiais_auxiliares.add(str(f).lstrip('0'))
        
        if not todas_filiais_auxiliares:
            for item in self.sf1_data:
                f = item.get('filial', '')
                if f:
                    todas_filiais_auxiliares.add(str(f).lstrip('0'))

        valid_prefixes = set(f[:4] for f in todas_filiais_auxiliares if len(f) >= 4)
        if not valid_prefixes:
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
                    'irrf_sf1': Decimal('0.00') if has_sf1 else None,
                    'irrf_aglu': Decimal('0.00') if has_aglu else None,
                    'irrf_r4020': Decimal('0.00') if has_r4020 else None,
                    'status': '',
                    'diagnostico': ''
                }
            return master[key]

        if has_sf1:
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

        if has_r4020:
            for item in self.r4020_data:
                rec = get_or_create(item.get('filial', ''), item['numero'])
                rec['irrf_r4020'] += item['irrf_r4020']
                if item.get('cnpj') and not rec['cnpj']: rec['cnpj'] = item['cnpj']
                if item.get('razao') and not rec['razao']: rec['razao'] = item['razao']

        if has_aglu:
            for item in self.aglu_data:
                rec = get_or_create(item.get('filial', ''), item['numero'])
                rec['irrf_aglu'] += item['irrf_aglu']

        # 2. Definir o status e montar array de resultados
        results = []
        conciliados = 0
        divergentes = 0
        ausentes = 0

        for key, rec in master.items():
            f_norm = str(rec['filial']).lstrip('0')
            if valid_prefixes:
                match = any(f_norm.startswith(p) for p in valid_prefixes)
                if not match:
                    continue

            active_vals = []
            if has_sf1 and rec['irrf_sf1'] is not None:
                active_vals.append(('SF1', rec['irrf_sf1']))
            if has_aglu and rec['irrf_aglu'] is not None:
                active_vals.append(('Aglu.', rec['irrf_aglu']))
            if has_r4020 and rec['irrf_r4020'] is not None:
                active_vals.append(('R-4020', rec['irrf_r4020']))

            non_zero_vals = [v for _, v in active_vals if v > 0]
            zero_sources = [name for name, v in active_vals if v == 0]

            if len(non_zero_vals) == len(active_vals) and len(non_zero_vals) > 0:
                if len(set(non_zero_vals)) == 1:
                    rec['status'] = 'Conciliado'
                    if num_active == 3:
                        rec['diagnostico'] = 'Sem divergências (SF1 = Aglu. = R-4020)'
                    elif has_sf1 and has_r4020:
                        rec['diagnostico'] = 'Conciliado (Base SF1 = REINF R-4020)'
                    elif has_sf1 and has_aglu:
                        rec['diagnostico'] = 'Conciliado (Base SF1 = Aglutinação)'
                    elif has_aglu and has_r4020:
                        rec['diagnostico'] = 'Conciliado (Aglutinação = REINF R-4020)'
                    conciliados += 1
                    diff = Decimal('0.00')
                else:
                    rec['status'] = 'Divergente'
                    rec['diagnostico'] = 'Divergência de Valores'
                    divergentes += 1
                    diff = max(non_zero_vals) - min(non_zero_vals)
            elif len(non_zero_vals) == 0:
                continue
            else:
                rec['status'] = 'Ausente'
                if has_r4020 and ('R-4020' in zero_sources) and (('SF1' not in zero_sources) or ('Aglu.' not in zero_sources)):
                    rec['diagnostico'] = 'Ausente no R-4020 (Pendente de Inclusão Manual no REINF)'
                else:
                    rec['diagnostico'] = f"Ausente em: {', '.join(zero_sources)}"
                ausentes += 1
                diff = max(non_zero_vals) if non_zero_vals else Decimal('0.00')
            
            forn = rec.get('fornecedor') or 'N/D'
            cnpj = rec.get('cnpj') or 'N/D'
            raz = rec.get('razao') or 'N/D'
            rec['chave_unica'] = f"{rec['filial']}_{rec['numero']}_{forn}_{cnpj}_{raz}"
            
            rec['diferenca'] = float(diff)
            rec['irrf_sf1'] = float(rec['irrf_sf1']) if has_sf1 else None
            rec['irrf_aglu'] = float(rec['irrf_aglu']) if has_aglu else None
            rec['irrf_r4020'] = float(rec['irrf_r4020']) if has_r4020 else None
            results.append(rec)
            
        return {
            'conciliados': conciliados,
            'divergentes': divergentes,
            'ausentes': ausentes,
            'total': len(results),
            'detalhes': results,
            'num_relatorios': num_active
        }
