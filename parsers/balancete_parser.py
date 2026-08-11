import io
import pandas as pd
import pdfplumber
import re
from typing import Optional

def _parse_numeric(val_str: str) -> float:
    if not isinstance(val_str, str):
        return float(val_str)
    # Remove thousand separators and replace decimal comma with dot
    clean = val_str.replace('.', '').replace(',', '.')
    try:
        return float(clean)
    except ValueError:
        return 0.0

class BalanceteParser:
    def parse(self, file_bytes: bytes, filename: str) -> Optional[float]:
        if filename.lower().endswith('.pdf'):
            return self._parse_pdf(file_bytes)
        elif filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            return self._parse_excel(file_bytes, filename)
        return None

    def _parse_pdf(self, file_bytes: bytes) -> Optional[float]:
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    for line in text.split('\n'):
                        if '3.1.1.02.0001' in line or 'SERVICOS PRESTADOS' in line.upper():
                            tokens = line.split()
                            numerics = []
                            for token in reversed(tokens):
                                if re.match(r'^[\d.,]+$', token):
                                    numerics.insert(0, token)
                                else:
                                    break
                            
                            # The 'Mov periodo' should be the second to last numeric value (index -2)
                            if len(numerics) >= 2:
                                return _parse_numeric(numerics[-2])
            return None
        except Exception as e:
            print(f"Error parsing PDF Balancete: {e}")
            return None

    def _parse_excel(self, file_bytes: bytes, filename: str) -> Optional[float]:
        try:
            if filename.lower().endswith('.csv'):
                try:
                    df = pd.read_csv(io.BytesIO(file_bytes), sep=';')
                except:
                    df = pd.read_csv(io.BytesIO(file_bytes), sep=',')
                sheet_names = [None]
                xls = None
            else:
                xls = pd.ExcelFile(io.BytesIO(file_bytes))
                sheet_names = xls.sheet_names

            for sheet in sheet_names:
                if xls:
                    df = pd.read_excel(xls, sheet_name=sheet)
                
                for _, row in df.iterrows():
                    row_values = [str(x).strip() for x in row.values if pd.notnull(x)]
                    row_str = ' | '.join(row_values).upper()
                    
                    if '3.1.1.02.0001' in row_str or 'SERVICOS PRESTADOS' in row_str:
                        numerics = []
                        for val in row.values:
                            if pd.notnull(val):
                                if isinstance(val, (int, float)):
                                    numerics.append(float(val))
                                elif isinstance(val, str) and re.match(r'^-?[\d.,]+$', val.strip()):
                                    try:
                                        numerics.append(_parse_numeric(val.strip()))
                                    except:
                                        pass
                        
                        if len(numerics) >= 2:
                            return numerics[-2]
            return None
        except Exception as e:
            print(f"Error parsing Excel Balancete: {e}")
            return None
