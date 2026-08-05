"""
Servidor Web de Conferência Fiscal do Faturamento (Python Standard Library HTTP Server).
Suporta Prefeituras de Recife, SP, SJC, Santos, Campinas, Brasília, RJ, VR, JP, Fortaleza, São Luís, Belém, Curitiba, Uberlândia, Salvador, Belo Horizonte, Goiânia e Aracaju com conciliação individual e em lote (todas as prefeituras de uma vez).
"""

import http.server
import socketserver
import json
import os
import sys
import io
import zipfile
import concurrent.futures
from typing import Dict, Any, List

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from parsers.erp_parser import ERPParser
from parsers.recife_parser import RecifeParser
from parsers.sao_paulo_parser import SaoPauloParser
from parsers.sao_jose_dos_campos_parser import SaoJoseDosCamposParser
from parsers.santos_parser import SantosParser
from parsers.campinas_parser import CampinasParser
from parsers.brasilia_parser import BrasiliaParser
from parsers.rio_de_janeiro_parser import RioDeJaneiroParser
from parsers.volta_redonda_parser import VoltaRedondaParser
from parsers.joao_pessoa_parser import JoaoPessoaParser
from parsers.fortaleza_parser import FortalezaParser
from parsers.sao_luis_parser import SaoLuisParser
from parsers.belem_parser import BelemParser
from parsers.curitiba_parser import CuritibaParser
from parsers.uberlandia_parser import UberlandiaParser
from parsers.salvador_parser import SalvadorParser
from parsers.belo_horizonte_parser import BeloHorizonteParser
from parsers.goiania_parser import GoianiaParser
from parsers.aracaju_parser import AracajuParser
from engine.reconciler import ReconciliationEngine

PORT = 8000

ALL_CITIES_CONFIG = [
    {"name": "Aracaju", "folder": "Aracaju", "erp": "Relatório de Notas Fiscais Emitidas Aracaju.pdf", "city_file": "NFS-e Emitidas - BAHIA HOME CARE SERVICOS MEDICOS DOMICILIARES LTDA - 07.766.008_0005-36_Aracaju.csv", "parser": AracajuParser},
    {"name": "Belém", "folder": "Belém", "erp": "Relatório de Notas Fiscais Emitidas Belém.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Belém.xlsx", "parser": BelemParser},
    {"name": "Belo Horizonte", "folder": "Belo Horizonte", "erp": "Relatório de Notas Fiscais Emitidas Belo Horizonte.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Belo Horizonte.xlsx", "parser": BeloHorizonteParser},
    {"name": "Brasília", "folder": "Brasilia", "erp": "Relatório de Notas Fiscais Emitidas Brasilia.pdf", "city_file": "Download - NFS-e - Relatório Serv. Prestados - 01-07-2026 a 31-07-2026 - Brasilia.xlsx", "parser": BrasiliaParser},
    {"name": "Campinas", "folder": "Campinas", "erp": "Relatório de Notas Fiscais Emitidas Campinas.pdf", "city_file": "Nota Fiscal Prefeitura de Campinas.csv", "parser": CampinasParser},
    {"name": "Curitiba", "folder": "Curitiba", "erp": "Relatório de Notas Fiscais Emitidas Curitiba.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Curitiba.xlsx", "parser": CuritibaParser},
    {"name": "Fortaleza", "folder": "Fortaleza", "erp": "Relatório de Notas Fiscais Emitidas Fortaleza.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Fortaleza.xlsx", "parser": FortalezaParser},
    {"name": "Goiânia", "folder": "Goiânia", "erp": "Relatório de Notas Fiscais Emitidas Goiânia.pdf", "city_file": "Relatorio de Notas Fiscais Prefeitura de Goiânia 062026.csv", "parser": GoianiaParser},
    {"name": "João Pessoa", "folder": "João Pessoa", "erp": "Relatório de Notas Fiscais Emitidas João Pessoa.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 João Pessoa.xlsx", "parser": JoaoPessoaParser},
    {"name": "Recife", "folder": "Recife", "erp": "NFe_E_V3_06199364_20260601_20260630.csv", "city_file": "Relatório de Notas Fiscais Emitidas Recife.pdf", "parser": RecifeParser},
    {"name": "Rio de Janeiro", "folder": "Rio de Janeiro", "erp": "Relatório de Notas Fiscais Emitidas Rio de Janeiro.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Rio de Janeiro.xlsx", "parser": RioDeJaneiroParser},
    {"name": "Salvador", "folder": "Salvador", "erp": "Relatório de Notas Fiscais Emitidas Salvador.pdf", "city_file": "NFSe_E_27112200186_20260601_20260630.csv", "parser": SalvadorParser},
    {"name": "Santos", "folder": "Santos", "erp": "Relatório de Notas Fiscais Emitidas Santos.pdf", "city_file": "consulta_xlsx_0.xlsx", "parser": SantosParser},
    {"name": "São José dos Campos", "folder": "São Jose dos Campos", "erp": "Nota Fiscal.csv", "city_file": "Relatório de Notas Fiscais Emitidas São José dos Campos.pdf", "parser": SaoJoseDosCamposParser},
    {"name": "São Luís", "folder": "São Luis", "erp": "Relatório de Notas Fiscais Emitidas São Luis.pdf", "city_file": "Prefeitura_São_Luis_relatorioServicosPrestados_062026.pdf", "parser": SaoLuisParser},
    {"name": "São Paulo", "folder": "São Paulo", "erp": "NFSe_E_24851175_20260601_20260630.csv", "city_file": "Relatório de Notas Fiscais Emitidas São Paulo.pdf", "parser": SaoPauloParser},
    {"name": "Uberlândia", "folder": "Uberlândia", "erp": "Relatório de Notas Fiscais Emitidas Uberlândia.pdf", "city_file": "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Uberlândia.xlsx", "parser": UberlandiaParser},
    {"name": "Volta Redonda", "folder": "Volta Redonda", "erp": "Relatório de Notas Fiscais Emitidas Volta Redonda.pdf", "city_file": "08965795000265 NFS-E EMITIDAS - 30_07_2026.xls", "parser": VoltaRedondaParser}
]

def parse_multipart_data(data: bytes, boundary: bytes) -> Dict[str, Any]:
    fields = {}
    parts = data.split(b'--' + boundary)
    for part in parts:
        if not part or part == b'--\r\n' or part == b'--':
            continue
        if b'\r\n\r\n' in part:
            header_part, content = part.split(b'\r\n\r\n', 1)
            if content.endswith(b'\r\n'):
                content = content[:-2]
            header_text = header_part.decode('latin1', errors='replace')
            name = None
            for line in header_text.split('\r\n'):
                if 'Content-Disposition:' in line:
                    for item in line.split(';'):
                        item = item.strip()
                        if item.startswith('name='):
                            name = item.split('=', 1)[1].strip('"\'')
            if name:
                fields[name] = content
    return fields


class ReconciliationHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path == "/" or path == "/index.html":
            return os.path.join(CURRENT_DIR, "static", "index.html")
        elif path.startswith("/static/"):
            rel_path = path[len("/static/"):]
            return os.path.join(CURRENT_DIR, "static", rel_path)
        return super().translate_path(path)

    def do_POST(self):
        if self.path == "/api/reconcile-demo":
            self.handle_demo_reconcile(mode="faturamento")
        elif self.path == "/api/reconcile":
            self.handle_upload_reconcile(mode="faturamento")
        elif self.path == "/api/reconcile-batch-demo":
            self.handle_batch_demo_reconcile(mode="faturamento")
        elif self.path == "/api/reconcile-batch":
            self.handle_batch_upload_reconcile(mode="faturamento")
        elif self.path == "/api/reconcile-iss-demo":
            self.handle_demo_reconcile(mode="iss")
        elif self.path == "/api/reconcile-iss":
            self.handle_upload_reconcile(mode="iss")
        elif self.path == "/api/reconcile-iss-tomados-demo":
            self.handle_demo_reconcile(mode="iss-tomados")
        elif self.path == "/api/reconcile-iss-tomados":
            self.handle_upload_reconcile(mode="iss-tomados")
        elif self.path == "/api/reconcile-iss-batch-demo":
            self.handle_batch_demo_reconcile(mode="iss")
        elif self.path == "/api/reconcile-iss-batch":
            self.handle_batch_upload_reconcile(mode="iss")
        elif self.path == "/api/reconcile-iss-tomados-batch-demo":
            self.handle_batch_demo_reconcile(mode="iss-tomados")
        elif self.path == "/api/reconcile-iss-tomados-batch":
            self.handle_batch_upload_reconcile(mode="iss-tomados")
        else:
            self.send_error(404, "Endpoint não encontrado")

    def handle_batch_demo_reconcile(self, mode="faturamento"):
        try:
            def process_single_city_demo(cfg):
                cname = cfg["name"]
                cfolder = cfg["folder"]
                c_parser_cls = cfg["parser"]

                city_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", cfolder)
                erp_p = os.path.join(city_dir, cfg["erp"])
                city_p = os.path.join(city_dir, cfg["city_file"])

                if not os.path.exists(erp_p) or not os.path.exists(city_p):
                    return None

                erp_parser = ERPParser()
                engine = ReconciliationEngine(tolerance=0.04)

                erp_items = erp_parser.parse_file(erp_p)
                city_items = c_parser_cls().parse(city_p)
                
                if mode == "iss":
                    for item in erp_items:
                        item["valor"] = item.get("valor_iss", 0.0)
                    for item in city_items:
                        item["valor"] = item.get("valor_iss", 0.0)

                rec_res = engine.reconcile(erp_items, city_items)

                resumo = rec_res.get("resumo", {})
                is_divergent = resumo.get("divergentes_qtd", 0) > 0 or resumo.get("somente_erp_qtd", 0) > 0 or resumo.get("somente_prefeitura_qtd", 0) > 0

                return {
                    "city": cname,
                    "resumo": resumo,
                    "items": rec_res.get("items", []),
                    "status": "DIVERGENTE" if is_divergent else "CONCILIADO",
                    "is_divergent": is_divergent
                }

            results_by_city = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                futures = [executor.submit(process_single_city_demo, cfg) for cfg in ALL_CITIES_CONFIG]
                for f in futures:
                    res = f.result()
                    if res:
                        results_by_city.append(res)

            total_global_erp_val = sum(r["resumo"].get("total_erp_valor", 0.0) for r in results_by_city)
            total_global_pref_val = sum(r["resumo"].get("total_prefeitura_valor", 0.0) for r in results_by_city)
            matched_cities = sum(1 for r in results_by_city if not r["is_divergent"])
            divergent_cities = sum(1 for r in results_by_city if r["is_divergent"])

            total_cities = len(results_by_city)
            accuracy = (matched_cities / total_cities * 100) if total_cities > 0 else 100.0

            global_summary = {
                "total_cities": total_cities,
                "matched_cities": matched_cities,
                "divergent_cities": divergent_cities,
                "total_erp_valor": round(total_global_erp_val, 2),
                "total_prefeitura_valor": round(total_global_pref_val, 2),
                "accuracy": round(accuracy, 1)
            }

            self.send_json_response({
                "success": True,
                "global_summary": global_summary,
                "cities_results": results_by_city
            })

        except Exception as e:
            self.send_json_response({"success": False, "error": f"Erro ao processar lote de demonstração: {str(e)}"})

    def handle_batch_upload_reconcile(self, mode="faturamento"):
        try:
            content_type = self.headers.get('content-type', '')
            if 'multipart/form-data' not in content_type:
                self.send_json_response({"success": False, "error": "Formato de envio inválido."})
                return

            boundary_str = None
            for part in content_type.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary_str = part.split('=', 1)[1].strip('"\'')

            if not boundary_str:
                self.send_json_response({"success": False, "error": "Boundary do formulário não encontrado."})
                return

            content_length = int(self.headers.get('content-length', 0))
            body_bytes = self.rfile.read(content_length)

            fields = parse_multipart_data(body_bytes, boundary_str.encode('utf-8'))
            zip_bytes = fields.get('zip_file')

            if not zip_bytes:
                self.send_json_response({"success": False, "error": "Arquivo .ZIP não foi selecionado."})
                return

            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
            
            # Carrega arquivos do ZIP para mapa de memória (Thread Safe)
            zip_data_map = {}
            for fname in zf.namelist():
                if not fname.endswith('/'):
                    zip_data_map[fname] = zf.read(fname)

            city_folders = {}
            for fname in zip_data_map.keys():
                parts = fname.replace('\\', '/').split('/')
                if len(parts) >= 2:
                    cfolder = parts[0].strip()
                    if cfolder not in city_folders:
                        city_folders[cfolder] = []
                    city_folders[cfolder].append(fname)

            def process_city_upload(cfg):
                cname = cfg["name"]
                cfolder = cfg["folder"]
                c_parser_cls = cfg["parser"]

                matching_fpaths = None
                for folder_in_zip, fpaths in city_folders.items():
                    if folder_in_zip.lower() == cfolder.lower() or folder_in_zip.lower() == cname.lower():
                        matching_fpaths = fpaths
                        break

                if not matching_fpaths:
                    return None

                erp_parser = ERPParser()
                engine = ReconciliationEngine(tolerance=0.04)

                file1_bytes = None
                file2_bytes = None

                if len(matching_fpaths) == 1:
                    single_fp = matching_fpaths[0]
                    single_bytes = zip_data_map[single_fp]
                    items_as_erp = erp_parser.parse_file(single_bytes)

                    local_dir = os.path.join(CURRENT_DIR, 'Relatórios Modelo', cfolder)
                    local_erp_p = os.path.join(local_dir, cfg['erp'])
                    local_city_p = os.path.join(local_dir, cfg['city_file'])

                    if len(items_as_erp) > 0 and os.path.exists(local_city_p):
                        file1_bytes = single_bytes
                        with open(local_city_p, 'rb') as f: file2_bytes = f.read()
                    elif os.path.exists(local_erp_p):
                        with open(local_erp_p, 'rb') as f: file1_bytes = f.read()
                        file2_bytes = single_bytes
                else:
                    candidates = [(fp, zip_data_map[fp]) for fp in matching_fpaths]
                    if len(candidates) >= 2:
                        fA_bytes = candidates[0][1]
                        fB_bytes = candidates[1][1]

                        fA_name = os.path.basename(candidates[0][0]).lower()
                        fB_name = os.path.basename(candidates[1][0]).lower()

                        if ('nfe_e' in fA_name or 'nota fiscal.csv' in fA_name or 'relatório de notas fiscais emitidas' in fA_name) and not ('nfe_e' in fB_name or 'nota fiscal.csv' in fB_name or 'relatório de notas fiscais emitidas' in fB_name):
                            file1_bytes, file2_bytes = fA_bytes, fB_bytes
                        elif ('nfe_e' in fB_name or 'nota fiscal.csv' in fB_name or 'relatório de notas fiscais emitidas' in fB_name) and not ('nfe_e' in fA_name or 'nota fiscal.csv' in fA_name or 'relatório de notas fiscais emitidas' in fA_name):
                            file1_bytes, file2_bytes = fB_bytes, fA_bytes
                        else:
                            file1_bytes, file2_bytes = fA_bytes, fB_bytes
                    elif len(candidates) == 1:
                        file1_bytes = candidates[0][1]
                        file2_bytes = candidates[0][1]

                if not file1_bytes or not file2_bytes:
                    return None

                erp_items = erp_parser.parse_file(file1_bytes)
                city_items = c_parser_cls().parse(file2_bytes)



                if not erp_items or not city_items:
                    return None

                if mode == "iss":
                    for item in erp_items:
                        item["valor"] = item.get("valor_iss", 0.0)
                    for item in city_items:
                        item["valor"] = item.get("valor_iss", 0.0)

                rec_res = engine.reconcile(erp_items, city_items)
                resumo = rec_res.get("resumo", {})
                is_divergent = resumo.get("divergentes_qtd", 0) > 0 or resumo.get("somente_erp_qtd", 0) > 0 or resumo.get("somente_prefeitura_qtd", 0) > 0

                return {
                    "city": cname,
                    "resumo": resumo,
                    "items": rec_res.get("items", []),
                    "status": "DIVERGENTE" if is_divergent else "CONCILIADO",
                    "is_divergent": is_divergent
                }

            results_by_city = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                futures = [executor.submit(process_city_upload, cfg) for cfg in ALL_CITIES_CONFIG]
                for f in futures:
                    res = f.result()
                    if res:
                        results_by_city.append(res)

            total_global_erp_val = sum(r["resumo"].get("total_erp_valor", 0.0) for r in results_by_city)
            total_global_pref_val = sum(r["resumo"].get("total_prefeitura_valor", 0.0) for r in results_by_city)
            matched_cities = sum(1 for r in results_by_city if not r["is_divergent"])
            divergent_cities = sum(1 for r in results_by_city if r["is_divergent"])

            total_cities = len(results_by_city)
            accuracy = (matched_cities / total_cities * 100) if total_cities > 0 else 100.0

            global_summary = {
                "total_cities": total_cities,
                "matched_cities": matched_cities,
                "divergent_cities": divergent_cities,
                "total_erp_valor": round(total_global_erp_val, 2),
                "total_prefeitura_valor": round(total_global_pref_val, 2),
                "accuracy": round(accuracy, 1)
            }

            self.send_json_response({
                "success": True,
                "global_summary": global_summary,
                "cities_results": results_by_city
            })

        except Exception as e:
            self.send_json_response({"success": False, "error": f"Erro ao processar arquivo .ZIP em lote: {str(e)}"})

    def handle_demo_reconcile(self, mode="faturamento"):
        try:
            content_length = int(self.headers.get('content-length', 0))
            city = "Recife"
            if content_length > 0:
                body = self.rfile.read(content_length)
                try:
                    payload = json.loads(body.decode('utf-8'))
                    city = payload.get("city", "Recife")
                except Exception:
                    pass

            city_norm = city.lower()

            if "são paulo" in city_norm or "sao paulo" in city_norm:
                sp_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "São Paulo")
                erp_path = os.path.join(sp_dir, "NFSe_E_24851175_20260601_20260630.csv")
                city_path = os.path.join(sp_dir, "Relatório de Notas Fiscais Emitidas São Paulo.pdf")
                city_parser = SaoPauloParser()

            elif "jose" in city_norm or "josé" in city_norm:
                sjc_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "São Jose dos Campos")
                erp_path = os.path.join(sjc_dir, "Nota Fiscal.csv")
                city_path = os.path.join(sjc_dir, "Relatório de Notas Fiscais Emitidas São José dos Campos.pdf")
                city_parser = SaoJoseDosCamposParser()

            elif "santos" in city_norm:
                san_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Santos")
                erp_path = os.path.join(san_dir, "Relatório de Notas Fiscais Emitidas Santos.pdf")
                city_path = os.path.join(san_dir, "consulta_xlsx_0.xlsx")
                city_parser = SantosParser()

            elif "campinas" in city_norm:
                cam_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Campinas")
                erp_path = os.path.join(cam_dir, "Relatório de Notas Fiscais Emitidas Campinas.pdf")
                city_path = os.path.join(cam_dir, "Nota Fiscal Prefeitura de Campinas.csv")
                city_parser = CampinasParser()

            elif "brasilia" in city_norm or "brasília" in city_norm:
                bsb_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Brasilia")
                erp_path = os.path.join(bsb_dir, "Relatório de Notas Fiscais Emitidas Brasilia.pdf")
                city_path = os.path.join(bsb_dir, "Nota Fiscal Prefeitura de Brasilia.csv")
                city_parser = BrasiliaParser()

            elif "rio de janeiro" in city_norm or "rio" in city_norm:
                rj_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Rio de Janeiro")
                erp_path = os.path.join(rj_dir, "Relatório de Notas Fiscais Emitidas Rio de Janeiro.pdf")
                city_path = os.path.join(rj_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Rio de Janeiro.xlsx")
                city_parser = RioDeJaneiroParser()

            elif "volta redonda" in city_norm or "volta" in city_norm:
                vr_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Volta Redonda")
                erp_path = os.path.join(vr_dir, "Relatório de Notas Fiscais Emitidas Volta Redonda.pdf")
                city_path = os.path.join(vr_dir, "08965795000265 NFS-E EMITIDAS - 30_07_2026.xls")
                city_parser = VoltaRedondaParser()

            elif "joão pessoa" in city_norm or "joao pessoa" in city_norm:
                jp_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "João Pessoa")
                erp_path = os.path.join(jp_dir, "Relatório de Notas Fiscais Emitidas João Pessoa.pdf")
                city_path = os.path.join(jp_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 João Pessoa.xlsx")
                city_parser = JoaoPessoaParser()

            elif "fortaleza" in city_norm:
                for_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Fortaleza")
                erp_path = os.path.join(for_dir, "Relatório de Notas Fiscais Emitidas Fortaleza.pdf")
                city_path = os.path.join(for_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Fortaleza.xlsx")
                city_parser = FortalezaParser()

            elif "são luis" in city_norm or "sao luis" in city_norm or "são luís" in city_norm or "sao luís" in city_norm:
                sl_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "São Luis")
                erp_path = os.path.join(sl_dir, "Relatório de Notas Fiscais Emitidas São Luis.pdf")
                city_path = os.path.join(sl_dir, "Prefeitura_São_Luis_relatorioServicosPrestados_062026.pdf")
                city_parser = SaoLuisParser()

            elif "belém" in city_norm or "belem" in city_norm:
                bel_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Belém")
                erp_path = os.path.join(bel_dir, "Relatório de Notas Fiscais Emitidas Belém.pdf")
                city_path = os.path.join(bel_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Belém.xlsx")
                city_parser = BelemParser()

            elif "curitiba" in city_norm:
                cur_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Curitiba")
                erp_path = os.path.join(cur_dir, "Relatório de Notas Fiscais Emitidas Curitiba.pdf")
                city_path = os.path.join(cur_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Curitiba.xlsx")
                city_parser = CuritibaParser()

            elif "uberlândia" in city_norm or "uberlandia" in city_norm:
                udi_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Uberlândia")
                erp_path = os.path.join(udi_dir, "Relatório de Notas Fiscais Emitidas Uberlândia.pdf")
                city_path = os.path.join(udi_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Uberlândia.xlsx")
                city_parser = UberlandiaParser()

            elif "salvador" in city_norm:
                ssa_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Salvador")
                erp_path = os.path.join(ssa_dir, "Relatório de Notas Fiscais Emitidas Salvador.pdf")
                city_path = os.path.join(ssa_dir, "NFSe_E_27112200186_20260601_20260630.csv")
                city_parser = SalvadorParser()

            elif "belo horizonte" in city_norm or "bh" in city_norm:
                bh_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Belo Horizonte")
                erp_path = os.path.join(bh_dir, "Relatório de Notas Fiscais Emitidas Belo Horizonte.pdf")
                city_path = os.path.join(bh_dir, "Download - NFS-e - Relatório - 01-06-2026 a 30-06-2026 Belo Horizonte.xlsx")
                city_parser = BeloHorizonteParser()

            elif "goiânia" in city_norm or "goiania" in city_norm:
                gyn_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Goiânia")
                erp_path = os.path.join(gyn_dir, "Relatório de Notas Fiscais Emitidas Goiânia.pdf")
                city_path = os.path.join(gyn_dir, "Relatorio de Notas Fiscais Prefeitura de Goiânia 062026.csv")
                city_parser = GoianiaParser()

            elif "aracaju" in city_norm:
                aju_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Aracaju")
                erp_path = os.path.join(aju_dir, "Relatório de Notas Fiscais Emitidas Aracaju.pdf")
                city_path = os.path.join(aju_dir, "NFS-e Emitidas - BAHIA HOME CARE SERVICOS MEDICOS DOMICILIARES LTDA - 07.766.008_0005-36_Aracaju.csv")
                city_parser = AracajuParser()

            else:
                rec_dir = os.path.join(CURRENT_DIR, "Relatórios Modelo", "Recife")
                erp_path = os.path.join(rec_dir, "NFe_E_V3_06199364_20260601_20260630.csv")
                if not os.path.exists(erp_path):
                    erp_path = os.path.join(CURRENT_DIR, "NFe_E_V3_06199364_20260601_20260630.csv")

                city_path = os.path.join(rec_dir, "Relatório de Notas Fiscais Emitidas Recife.pdf")
                if not os.path.exists(city_path):
                    city_path = os.path.join(rec_dir, "Relatório de Notas Fiscais Emitidas Recife - MODELO.pdf")
                if not os.path.exists(city_path):
                    city_path = os.path.join(CURRENT_DIR, "Relatório de Notas Fiscais Emitidas Recife - MODELO.pdf")
                city_parser = RecifeParser()

            if not os.path.exists(erp_path) or not os.path.exists(city_path):
                self.send_json_response({"success": False, "error": f"Arquivos de modelo para {city} não foram localizados."})
                return

            erp_parser = ERPParser()
            engine = ReconciliationEngine(tolerance=0.04)

            erp_items = erp_parser.parse_file(erp_path)
            city_items = city_parser.parse(city_path)

            if mode == "iss":
                erp_items = [
                    item for item in erp_items
                    if item.get("valor_iss", 0.0) > 0
                ]
                for item in erp_items:
                    item["valor"] = item.get("valor_iss", 0.0)

                city_items = [
                    item for item in city_items
                    if item.get("iss_retido", "N").strip().upper() == "N" and item.get("valor_iss", 0.0) > 0
                ]
                for item in city_items:
                    item["valor"] = item.get("valor_iss", 0.0)
            elif mode == "iss-tomados":
                pass

            result = engine.reconcile(erp_items, city_items)
            self.send_json_response({"success": True, "result": result})

        except Exception as e:
            self.send_json_response({"success": False, "error": f"Erro no processamento da demonstração: {str(e)}"})

    def handle_upload_reconcile(self, mode="faturamento"):
        try:
            content_type = self.headers.get('content-type', '')
            if 'multipart/form-data' not in content_type:
                self.send_json_response({"success": False, "error": "Formato de envio inválido."})
                return

            boundary_str = None
            for part in content_type.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary_str = part.split('=', 1)[1].strip('"\'')

            if not boundary_str:
                self.send_json_response({"success": False, "error": "Boundary do formulário não encontrado."})
                return

            content_length = int(self.headers.get('content-length', 0))
            body_bytes = self.rfile.read(content_length)

            fields = parse_multipart_data(body_bytes, boundary_str.encode('utf-8'))

            file1_bytes = fields.get('erp_file')
            file2_bytes = fields.get('city_file')
            city_param = fields.get('city', b'Recife').decode('utf-8', errors='replace')
            city_norm = city_param.lower()

            if not file1_bytes or not file2_bytes:
                self.send_json_response({"success": False, "error": "Ambos os arquivos devem ser selecionados."})
                return

            erp_parser = ERPParser()
            
            if "são paulo" in city_norm or "sao paulo" in city_norm:
                city_parser = SaoPauloParser()
            elif "jose" in city_norm or "josé" in city_norm:
                city_parser = SaoJoseDosCamposParser()
            elif "santos" in city_norm:
                city_parser = SantosParser()
            elif "campinas" in city_norm:
                city_parser = CampinasParser()
            elif "brasilia" in city_norm or "brasília" in city_norm:
                city_parser = BrasiliaParser()
            elif "rio de janeiro" in city_norm or "rio" in city_norm:
                city_parser = RioDeJaneiroParser()
            elif "volta redonda" in city_norm or "volta" in city_norm:
                city_parser = VoltaRedondaParser()
            elif "joão pessoa" in city_norm or "joao pessoa" in city_norm:
                city_parser = JoaoPessoaParser()
            elif "fortaleza" in city_norm:
                city_parser = FortalezaParser()
            elif "são luis" in city_norm or "sao luis" in city_norm or "são luís" in city_norm or "sao luís" in city_norm:
                city_parser = SaoLuisParser()
            elif "belém" in city_norm or "belem" in city_norm:
                city_parser = BelemParser()
            elif "curitiba" in city_norm:
                city_parser = CuritibaParser()
            elif "uberlândia" in city_norm or "uberlandia" in city_norm:
                city_parser = UberlandiaParser()
            elif "salvador" in city_norm:
                city_parser = SalvadorParser()
            elif "belo horizonte" in city_norm or "bh" in city_norm:
                city_parser = BeloHorizonteParser()
            elif "goiânia" in city_norm or "goiania" in city_norm:
                city_parser = GoianiaParser()
            elif "aracaju" in city_norm:
                city_parser = AracajuParser()
            else:
                city_parser = RecifeParser()

            # Processamento direto: ERP file1, Prefeitura file2 (sem inversão)
            erp_items = erp_parser.parse_file(file1_bytes)
            city_items = city_parser.parse(file2_bytes)

            print(f"DEBUG app.py: erp_items={len(erp_items) if erp_items else 0}, city_items={len(city_items) if city_items else 0}, city_param={city_param}", flush=True)

            if not erp_items:
                self.send_json_response({
                    "success": False,
                    "error": "Não foi possível identificar os dados do ERP. Verifique se o relatório contendo a 'Base de Cálculo' foi selecionado."
                })
                return

            if not city_items:
                self.send_json_response({
                    "success": False,
                    "error": f"Não foi possível extrair notas do relatório da Prefeitura de {city_param}. Verifique se o arquivo em PDF/CSV/XLSX/XLS foi anexado."
                })
                return

            engine = ReconciliationEngine(tolerance=0.04)

            if mode == "iss":
                erp_items = [
                    item for item in erp_items
                    if item.get("valor_iss", 0.0) > 0
                ]
                for item in erp_items:
                    item["valor"] = item.get("valor_iss", 0.0)

                city_items = [
                    item for item in city_items
                    if str(item.get("iss_retido", "N")).strip().upper() in ["N", "NÃO", "NAO", "NO"] and item.get("valor_iss", 0.0) > 0
                ]
                for item in city_items:
                    item["valor"] = item.get("valor_iss", 0.0)
            elif mode == "iss-tomados":
                pass

            result = engine.reconcile(erp_items, city_items)
            self.send_json_response({"success": True, "result": result})

        except Exception as e:
            self.send_json_response({"success": False, "error": f"Erro no processamento: {str(e)}"})

    def send_json_response(self, data: Dict[str, Any], status_code: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server():
    with ThreadedHTTPServer(("", PORT), ReconciliationHandler) as httpd:
        print("============================================================")
        print(" Servidor de Conferência Fiscal (Multi-Thread) iniciado com sucesso!")
        print(f" Acesse no seu navegador: http://localhost:{PORT}")
        print("============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor finalizado.")

if __name__ == "__main__":
    run_server()
