"""
Adaptador de Parser para a Prefeitura de São José dos Campos.
Extrai notas fiscais do Registro de Notas Fiscais de Serviços Prestados de São José dos Campos (PDF ou CSV).
"""

import pdfplumber
import io
import csv
from typing import List, Dict, Any
from parsers.base_parser import BaseCityParser

class SaoJoseDosCamposParser(BaseCityParser):
    def __init__(self):
        super().__init__("São José dos Campos")

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
        current_city = "São José dos Campos"

        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue

                    for line in text.split('\n'):
                        if "SAO JOSE DOS CAMPOS" in line or "SÃO JOSÉ DOS CAMPOS" in line:
                            current_city = "São José dos Campos"
                        
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

                                    records.append({
                                        "id": f"SJC-{idx}",
                                        "pagina": page_idx + 1,
                                        "dia": dia,
                                        "serie": serie,
                                        "numero": numero,
                                        "valor": val,
                                        "raw_valor": base_calc,
                                        "cidade": "São José dos Campos"
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
            if ';' not in content and ',' in content:
                delimiter = ','
            else:
                delimiter = ';'

            lines = content.splitlines()
            reader = csv.reader(lines, delimiter=delimiter)
            headers = next(reader, None)
            if not headers: return []

            idx_situacao = None
            idx_valor = None
            idx_numero = None

            for idx, h in enumerate(headers):
                h_norm = h.lower().replace('ã', 'a').replace('ç', 'c').strip()
                if 'situa' in h_norm:
                    idx_situacao = idx
                elif 'valor servi' in h_norm or ('valor' in h_norm and idx_valor is None):
                    idx_valor = idx
                elif 'nr. nf' in h_norm or 'nf' in h_norm or 'numero' in h_norm:
                    if idx_numero is None: idx_numero = idx

            if idx_situacao is None: idx_situacao = 0
            if idx_valor is None: idx_valor = 9
            if idx_numero is None: idx_numero = 1

            for idx_row, row in enumerate(reader):
                if not row or len(row) <= idx_valor: continue

                if idx_situacao < len(row):
                    sit = row[idx_situacao].strip().upper()
                    if sit and sit not in ['ATIVA', 'ATIVO', 'T', 'TRIBUTADA']:
                        continue

                raw_val = row[idx_valor].strip() if idx_valor < len(row) else ""
                if not raw_val: continue

                try:
                    val = float(raw_val.replace('.', '').replace(',', '.'))
                    if val <= 0: continue
                    
                    num = row[idx_numero].strip() if idx_numero < len(row) else f"SJC-{idx_row+1}"

                    records.append({
                        "id": f"SJC-{len(records)+1}",
                        "linha": idx_row + 1,
                        "numero": num,
                        "valor": val,
                        "raw_valor": raw_val,
                        "cidade": "São José dos Campos"
                    })
                except ValueError:
                    pass
        except Exception:
            pass
        return records
