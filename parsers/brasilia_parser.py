"""
Adaptador de Parser para a Prefeitura de Brasília (Distrito Federal).
Extrai notas fiscais do Relatório de Serviços Prestados de Brasília (CSV ou PDF).
"""

import pdfplumber
import io
import csv
from typing import List, Dict, Any
from parsers.base_parser import BaseCityParser

class BrasiliaParser(BaseCityParser):
    def __init__(self):
        super().__init__("Brasília")

    def parse(self, file_source) -> List[Dict[str, Any]]:
        records = []
        
        if isinstance(file_source, bytes):
            if file_source.startswith(b'%PDF'):
                return self._parse_pdf_bytes(file_source)
            else:
                return self._parse_csv_bytes(file_source)
        elif isinstance(file_source, str):
            if file_source.lower().endswith('.pdf'):
                with open(file_source, 'rb') as f:
                    return self._parse_pdf_bytes(f.read())
            else:
                with open(file_source, 'rb') as f:
                    return self._parse_csv_bytes(f.read())
        return records

    def _parse_pdf_bytes(self, pdf_bytes: bytes) -> List[Dict[str, Any]]:
        records = []
        idx = 1
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue

                    for line in text.split('\n'):
                        if '|' not in line:
                            continue

                        parts = [p.strip() for p in line.split('|')]
                        if len(parts) >= 5:
                            dia = parts[1]
                            serie = parts[2]
                            numero = parts[3]
                            base_calc = parts[4]

                            if dia.isdigit() and numero.isdigit() and base_calc.replace('.', '').replace(',', '').isdigit():
                                try:
                                    val = float(base_calc.replace('.', '').replace(',', '.'))
                                    if val <= 0:
                                        continue

                                    num_clean = str(int(numero))

                                    records.append({
                                        "id": f"DF-{idx}",
                                        "pagina": page_idx + 1,
                                        "dia": dia,
                                        "serie": serie,
                                        "numero": num_clean,
                                        "valor": val,
                                        "raw_valor": base_calc,
                                        "cidade": "Brasília"
                                    })
                                    idx += 1
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

            header_idx = 0
            for idx, l in enumerate(lines[:10]):
                if 'Natureza' in l or 'Valor Documento' in l or 'Nº' in l or 'N°' in l:
                    header_idx = idx
                    break

            delimiter = ';' if any(';' in line for line in lines[:5]) else ','
            reader = csv.reader(lines[header_idx:], delimiter=delimiter)
            headers = next(reader, None)
            if not headers: return []

            idx_natureza = None
            idx_valor = None
            idx_numero = None
            idx_cnpj = None

            for idx, h in enumerate(headers):
                h_norm = h.lower().replace('ã', 'a').replace('ç', 'c').strip()
                if 'natureza' in h_norm:
                    idx_natureza = idx
                elif 'valor documento' in h_norm or ('valor' in h_norm and idx_valor is None):
                    idx_valor = idx
                elif h.strip() in ['Nº', 'N°', 'NÂ°', 'NÂº', 'Numero', 'Número'] or ('n' in h_norm and 'doc' not in h_norm and idx_numero is None):
                    if idx_numero is None: idx_numero = idx
                elif 'cpf' in h_norm or 'cnpj' in h_norm:
                    if idx_cnpj is None: idx_cnpj = idx

            if idx_natureza is None: idx_natureza = 4
            if idx_valor is None: idx_valor = 5
            if idx_numero is None: idx_numero = 2
            if idx_cnpj is None: idx_cnpj = 3

            for idx_row, row in enumerate(reader):
                if not row or len(row) <= idx_valor: continue

                natureza = row[idx_natureza].strip().upper() if idx_natureza < len(row) else ''

                # REGRA DO USUÁRIO: Apenas linhas "Exigível" ou "Operação tributável" (descarta "Anulada")
                if not any(k in natureza for k in ['EXIGIVEL', 'EXIGÍVEL', 'TRIBUTAVEL', 'TRIBUTÁVEL', 'TRIBUTADA']):
                    continue

                raw_val = row[idx_valor].strip() if idx_valor < len(row) else ''
                if not raw_val: continue

                try:
                    val = float(raw_val.replace('.', '').replace(',', '.'))
                    if val <= 0: continue

                    nf = row[idx_numero].strip() if idx_numero < len(row) else f"DF-{idx_row+1}"
                    cnpj = row[idx_cnpj].strip() if idx_cnpj < len(row) else ''

                    records.append({
                        "id": f"DF-{len(records)+1}",
                        "linha": idx_row + 1,
                        "numero": nf,
                        "valor": val,
                        "raw_valor": raw_val,
                        "cnpj_tomador": cnpj,
                        "cidade": "Brasília"
                    })
                except ValueError:
                    pass
        except Exception:
            pass

        return records
