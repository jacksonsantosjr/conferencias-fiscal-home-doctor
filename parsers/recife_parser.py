"""
Adaptador de Parser para a Prefeitura de Recife.
Lê arquivos PDF do Registro de Notas Fiscais de Serviços Prestados (Mod. 51).
Trata exceções de arquivos não-PDF para evitar travamentos.
"""

import pdfplumber
import io
from typing import List, Dict, Any
from parsers.base_parser import BaseCityParser

class RecifeParser(BaseCityParser):
    def __init__(self):
        super().__init__("Recife")

    def parse(self, file_source) -> List[Dict[str, Any]]:
        records = []
        idx = 1
        current_city = "Recife"

        try:
            # Verifica se os bytes/arquivo iniciam com a assinatura PDF '%PDF'
            if isinstance(file_source, bytes):
                if not file_source.startswith(b'%PDF'):
                    return []
                pdf_obj = pdfplumber.open(io.BytesIO(file_source))
            elif isinstance(file_source, str):
                if not file_source.lower().endswith('.pdf'):
                    # Tenta ler primeiros bytes se for caminho
                    try:
                        with open(file_source, 'rb') as f_chk:
                            if not f_chk.read(4).startswith(b'%PDF'):
                                return []
                    except Exception:
                        pass
                pdf_obj = pdfplumber.open(file_source)
            else:
                pdf_obj = pdfplumber.open(file_source)
        except Exception:
            # Se o arquivo não for um PDF válido ou falhar ao abrir, retorna lista vazia
            return []

        try:
            with pdf_obj as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue

                    for line in text.split('\n'):
                        if "RECIFE/PE" in line:
                            current_city = "Recife"
                        elif "JOAO PESSOA" in line or "JOÃO PESSOA" in line:
                            current_city = "João Pessoa"
                        
                        if '|' not in line:
                            continue

                        parts = [p.strip() for p in line.split('|')]
                        
                        if len(parts) >= 5:
                            dia = parts[1]
                            serie = parts[2]
                            numero = parts[3]
                            base_calc = parts[4]

                            if current_city == "Recife" and dia.isdigit() and numero.isdigit() and base_calc.replace('.', '').replace(',', '').isdigit():
                                    try:
                                        val = float(base_calc.replace('.', '').replace(',', '.'))
                                        if val <= 0:
                                            continue
                                            
                                        val_iss = 0.0
                                        if len(parts) >= 7:
                                            iss_raw = parts[6].strip()
                                            if iss_raw:
                                                try:
                                                    val_iss = float(iss_raw.replace('.', '').replace(',', '.'))
                                                except ValueError:
                                                    pass

                                        records.append({
                                            "id": f"REC-{idx}",
                                            "pagina": page_idx + 1,
                                            "dia": dia,
                                            "serie": serie,
                                            "numero": numero,
                                            "valor": val,
                                            "valor_iss": val_iss,
                                            "raw_valor": base_calc,
                                            "cidade": "Recife"
                                        })
                                        idx += 1
                                    except ValueError:
                                        pass
        except Exception:
            pass

        return records
