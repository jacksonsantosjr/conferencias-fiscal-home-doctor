"""
Adaptador de Parser para a Prefeitura de São Luís (MA).
Extrai notas fiscais do relatório oficial da Prefeitura de São Luís em PDF (Relação de Notas Fiscais/Declarações Prestadas),
considerando estritamente a coluna 'Vl. NF' (conforme premissa do usuário) e filtrando notas canceladas.
"""

import pdfplumber
import openpyxl
import io
import csv
from typing import List, Dict, Any
from parsers.base_parser import BaseCityParser, safe_read_bytes

class SaoLuisParser(BaseCityParser):
    def __init__(self):
        super().__init__("São Luís")

    def parse(self, file_source) -> List[Dict[str, Any]]:
        data_bytes = safe_read_bytes(file_source)
        if not data_bytes:
            return []

        if data_bytes.startswith(b'%PDF'):
            return self._parse_pdf_bytes(data_bytes)
        elif data_bytes.startswith(b'PK'):
            return self._parse_xlsx_bytes(data_bytes)
        else:
            return self._parse_csv_bytes(data_bytes)

    def _parse_pdf_bytes(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        records = []
        idx = 1
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text: continue

                    for line in text.split('\n'):
                        # Filtra linhas irrelevantes
                        if any(k in line for k in ['TOTAIS:', 'PREFEITURA', 'Contribuinte:', 'Legenda:', 'Tomador DOCUMENTO', 'CPF/CNPJ']):
                            continue

                        parts = line.split()
                        if len(parts) < 8:
                            continue

                        for i, p in enumerate(parts):
                            if p == 'NFSe' or 'NFSe' in p:
                                if i > 0 and parts[i-1].isdigit():
                                    num_nf = str(int(parts[i-1]))
                                    
                                    # Descarte de canceladas (flag C)
                                    is_cancelada = False
                                    for st in parts[i:i+5]:
                                        if st == 'C':
                                            is_cancelada = True
                                            break

                                    if is_cancelada:
                                        break

                                    val_nf = None
                                    for k in range(i, len(parts)):
                                        p_tok = parts[k]
                                        if ',' in p_tok and not p_tok.endswith('%'):
                                            try:
                                                v = float(p_tok.replace('.', '').replace(',', '.'))
                                                if v > 0:
                                                    val_nf = v
                                                    break
                                            except ValueError:
                                                pass

                                    if val_nf and val_nf > 0:
                                        records.append({
                                            "id": f"SL-{idx}",
                                            "pagina": page_idx + 1,
                                            "numero": num_nf,
                                            "valor": val_nf,
                                            "raw_valor": str(val_nf),
                                            "cidade": "São Luís"
                                        })
                                        idx += 1
                                    break
        except Exception:
            pass

        return records

    def _parse_xlsx_bytes(self, xlsx_bytes: bytes) -> List[Dict[str, Any]]:
        records = []
        try:
            wb = openpyxl.load_workbook(io.BytesIO(xlsx_bytes), data_only=True)
            sheet = wb.active

            headers = [sheet.cell(row=1, column=j).value for j in range(1, sheet.max_column+1)]
            idx_numero = None
            idx_valor = None
            idx_cancelamento = None
            idx_tomador = None

            for idx, h in enumerate(headers):
                if not h: continue
                h_norm = str(h).lower().replace('ã', 'a').replace('ç', 'c').strip()
                if 'numero' in h_norm and idx_numero is None:
                    idx_numero = idx
                elif 'vl. nf' in h_norm or 'valor nf' in h_norm or ('valor' in h_norm and idx_valor is None):
                    idx_valor = idx
                elif 'cancelamento' in h_norm or 'status' in h_norm:
                    idx_cancelamento = idx
                elif 'tomador' in h_norm:
                    idx_tomador = idx

            if idx_numero is None: idx_numero = 0
            if idx_valor is None: idx_valor = 8

            for row_idx in range(2, sheet.max_row+1):
                num_cell = sheet.cell(row=row_idx, column=idx_numero+1).value
                val_cell = sheet.cell(row=row_idx, column=idx_valor+1).value
                canc_cell = sheet.cell(row=row_idx, column=idx_cancelamento+1).value if idx_cancelamento is not None else None
                tomador_cell = sheet.cell(row=row_idx, column=idx_tomador+1).value if idx_tomador is not None else ''

                if canc_cell and str(canc_cell).strip().upper() in ['CANCELADA', 'C']:
                    continue

                if val_cell is None: continue
                val_str = str(val_cell).replace('R$', '').replace(' ', '').replace('\xa0', '').strip()
                if not val_str: continue

                try:
                    val = float(val_str.replace('.', '').replace(',', '.')) if ',' in val_str else float(val_str)
                    if val <= 0: continue

                    nf = str(int(num_cell)) if isinstance(num_cell, (int, float)) else str(num_cell).strip()

                    records.append({
                        "id": f"SL-{len(records)+1}",
                        "linha": row_idx,
                        "numero": nf,
                        "valor": val,
                        "raw_valor": str(val_cell),
                        "tomador": str(tomador_cell or ''),
                        "cidade": "São Luís"
                    })
                except ValueError:
                    pass
        except Exception:
            pass

        return records

    def _parse_csv_bytes(self, csv_bytes: bytes) -> List[Dict[str, Any]]:
        records = []
        try:
            content = csv_bytes.decode('utf-8', errors='replace')
            lines = content.splitlines()
            delimiter = ';' if any(';' in line for line in lines[:5]) else ','
            reader = csv.reader(lines, delimiter=delimiter)
            headers = next(reader, None)
            if not headers: return []

            idx_numero = None
            idx_valor = None
            idx_cancelamento = None

            for idx, h in enumerate(headers):
                h_norm = h.lower().replace('ã', 'a').replace('ç', 'c').strip()
                if 'numero' in h_norm and idx_numero is None: idx_numero = idx
                elif 'vl. nf' in h_norm or 'valor nf' in h_norm or ('valor' in h_norm and idx_valor is None): idx_valor = idx
                elif 'cancelamento' in h_norm or 'status' in h_norm: idx_cancelamento = idx

            if idx_numero is None: idx_numero = 0
            if idx_valor is None: idx_valor = 8

            for idx_row, row in enumerate(reader):
                if not row or len(row) <= idx_valor: continue
                if idx_cancelamento is not None and idx_cancelamento < len(row) and row[idx_cancelamento].strip().upper() in ['CANCELADA', 'C']:
                    continue

                raw_val = row[idx_valor].strip() if idx_valor < len(row) else ""
                if not raw_val: continue
                try:
                    val = float(raw_val.replace('.', '').replace(',', '.')) if ',' in raw_val else float(raw_val)
                    if val <= 0: continue
                    num_cell = row[idx_numero].strip() if idx_numero < len(row) else f"SL-{idx_row+1}"
                    nf = str(int(num_cell)) if num_cell.isdigit() else num_cell

                    records.append({
                        "id": f"SL-{len(records)+1}",
                        "linha": idx_row + 1,
                        "numero": nf,
                        "valor": val,
                        "raw_valor": raw_val,
                        "cidade": "São Luís"
                    })
                except ValueError: pass
        except Exception: pass
        return records
