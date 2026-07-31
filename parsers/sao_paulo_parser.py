"""
Adaptador de Parser para a Prefeitura de São Paulo.
Extrai notas fiscais do Registro de Notas Fiscais de Serviços Prestados (Mod. 51) de São Paulo.
"""

import pdfplumber
import io
import csv
from typing import List, Dict, Any
from parsers.base_parser import BaseCityParser

class SaoPauloParser(BaseCityParser):
    def __init__(self):
        super().__init__("São Paulo")

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
        current_city = "São Paulo"

        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue

                    for line in text.split('\n'):
                        if "SAO PAULO/SP" in line or "SÃO PAULO/SP" in line:
                            current_city = "São Paulo"
                        
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
                                        "id": f"SP-{idx}",
                                        "pagina": page_idx + 1,
                                        "dia": dia,
                                        "serie": serie,
                                        "numero": numero,
                                        "valor": val,
                                        "raw_valor": base_calc,
                                        "cidade": "São Paulo"
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
            content = csv_bytes.decode('latin1', errors='replace')
            lines = content.splitlines()
            reader = csv.reader(lines, delimiter=';')
            headers = next(reader, None)
            if not headers: return []

            idx_situacao = None
            idx_valor = None
            idx_numero = None

            for idx, h in enumerate(headers):
                h_norm = h.lower()
                if 'situa' in h_norm and 'nota' in h_norm:
                    idx_situacao = idx
                elif 'valor dos servi' in h_norm or 'base' in h_norm:
                    if idx_valor is None: idx_valor = idx
                elif 'nfs' in h_norm or 'numero' in h_norm or 'nota' in h_norm:
                    if idx_numero is None: idx_numero = idx

            for idx_row, row in enumerate(reader):
                if not row or len(row) <= (idx_valor or 0): continue

                # Filtro de Situação 'T' (Tributada) caso exista a coluna
                if idx_situacao is not None and idx_situacao < len(row):
                    sit = row[idx_situacao].strip().upper()
                    if sit and sit != 'T':
                        continue

                raw_val = row[idx_valor].strip() if idx_valor < len(row) else ""
                if not raw_val: continue

                try:
                    val = float(raw_val.replace('.', '').replace(',', '.'))
                    if val <= 0: continue
                    
                    num = row[idx_numero].strip() if idx_numero and idx_numero < len(row) else f"SP-{idx_row+1}"

                    records.append({
                        "id": f"SP-{len(records)+1}",
                        "linha": idx_row + 1,
                        "numero": num,
                        "valor": val,
                        "raw_valor": raw_val,
                        "cidade": "São Paulo"
                    })
                except ValueError:
                    pass
        except Exception:
            pass
        return records
