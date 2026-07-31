"""
Motor de Reconciliação Fiscal (Matching Engine).
Cruza registros do ERP com o relatório da Prefeitura considerando margem de tolerância
e suporte a agrupamentos parciais de lançamentos municipais.
"""

from typing import List, Dict, Any, Tuple

class ReconciliationEngine:
    def __init__(self, tolerance: float = 0.04):
        self.tolerance = tolerance

    def reconcile(
        self, erp_items: List[Dict[str, Any]], city_items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        matched = []
        used_city_indices = set()
        unmatched_city = list(city_items)

        # Passo 1: Busca por correspondência 1 a 1 por valor (com tolerância)
        for erp in erp_items:
            best_idx = None
            min_diff = float("inf")

            for idx, city in enumerate(unmatched_city):
                if idx in used_city_indices:
                    continue

                diff = abs(erp["valor"] - city["valor"])
                if diff < min_diff:
                    min_diff = diff
                    best_idx = idx

            if best_idx is not None and min_diff <= self.tolerance:
                used_city_indices.add(best_idx)
                city_match = unmatched_city[best_idx]
                
                status = "CONCILIADO" if min_diff == 0 else "TOLERANCIA"
                matched.append({
                    "id": f"MATCH-{len(matched)+1}",
                    "erp": erp,
                    "prefeitura": city_match,
                    "valor_erp": erp["valor"],
                    "valor_prefeitura": city_match["valor"],
                    "diferenca": round(min_diff, 2),
                    "status": status,
                    "detalhe": "Valores coincidentes perfeitamente" if status == "CONCILIADO" else f"Diferença de R$ {min_diff:.2f} dentro da tolerância (R$ {self.tolerance:.2f})"
                })

        # Identifica sobrantes temporários
        matched_erp_ids = {m["erp"]["id"] for m in matched}
        rem_erp = [e for e in erp_items if e["id"] not in matched_erp_ids]
        rem_city_indices = [idx for idx in range(len(unmatched_city)) if idx not in used_city_indices]

        # Passo 2: Agrupamento Inteligente de Lançamentos Parciais (Multi-Line Matching)
        # Exemplo: 2 lançamentos na Prefeitura (R$ 3.700 + R$ 1.194,76) que somados dão 1 nota do ERP (R$ 4.894,76)
        matched_split_erp_ids = set()
        matched_split_city_indices = set()

        for erp_sob in rem_erp:
            found_combo = None
            active_city_indices = [i for i in rem_city_indices if i not in matched_split_city_indices]
            
            for i_idx, i in enumerate(active_city_indices):
                for j in active_city_indices[i_idx + 1:]:
                    combo_val = unmatched_city[i]["valor"] + unmatched_city[j]["valor"]
                    diff_combo = abs(erp_sob["valor"] - combo_val)
                    if diff_combo <= self.tolerance:
                        found_combo = (i, j, diff_combo)
                        break
                if found_combo:
                    break

            if found_combo:
                c1_idx, c2_idx, diff_combo = found_combo
                matched_split_erp_ids.add(erp_sob["id"])
                matched_split_city_indices.add(c1_idx)
                matched_split_city_indices.add(c2_idx)
                used_city_indices.add(c1_idx)
                used_city_indices.add(c2_idx)

                c1 = unmatched_city[c1_idx]
                c2 = unmatched_city[c2_idx]

                matched.append({
                    "id": f"MATCH-SPLIT-{len(matched)+1}",
                    "erp": erp_sob,
                    "prefeitura": {
                        "numero": f"{c1.get('numero', '')} + {c2.get('numero', '')}",
                        "valor": c1["valor"] + c2["valor"]
                    },
                    "valor_erp": erp_sob["valor"],
                    "valor_prefeitura": c1["valor"] + c2["valor"],
                    "diferenca": round(diff_combo, 2),
                    "status": "CONCILIADO",
                    "detalhe": f"Agrupamento Municipal: R$ {c1['valor']:,.2f} (NF {c1.get('numero','')}) + R$ {c2['valor']:,.2f} (NF {c2.get('numero','')})"
                })

        # Sobras finais pós-agrupamento
        final_somente_erp = [e for e in rem_erp if e["id"] not in matched_split_erp_ids]
        final_somente_prefeitura = [
            unmatched_city[idx] for idx in range(len(unmatched_city)) if idx not in used_city_indices
        ]

        # Estatísticas Globais
        total_erp_val = sum(e["valor"] for e in erp_items)
        total_city_val = sum(c["valor"] for c in city_items)
        total_conciliado_val = sum(m["valor_erp"] for m in matched)
        
        # Divergência Total = Total Auditado no ERP - Total Conciliado + Sobras
        sobras_erp_val = sum(e["valor"] for e in final_somente_erp)
        sobras_pref_val = sum(c["valor"] for c in final_somente_prefeitura)
        divergencia_total = round(abs(total_erp_val - total_conciliado_val) + sobras_erp_val, 2)

        perc_conciliado = (len(matched) / len(erp_items) * 100) if erp_items else 0

        return {
            "resumo": {
                "total_erp_qtd": len(erp_items),
                "total_erp_valor": round(total_erp_val, 2),
                "total_prefeitura_qtd": len(city_items),
                "total_prefeitura_valor": round(total_city_val, 2),
                "conciliados_qtd": len(matched),
                "conciliados_valor": round(total_conciliado_val, 2),
                "divergentes_qtd": len(final_somente_erp) + len(final_somente_prefeitura),
                "divergentes_valor": round(divergencia_total, 2),
                "somente_erp_qtd": len(final_somente_erp),
                "somente_erp_valor": round(sobras_erp_val, 2),
                "somente_prefeitura_qtd": len(final_somente_prefeitura),
                "somente_prefeitura_valor": round(sobras_pref_val, 2),
                "taxa_assertividade": round(perc_conciliado, 1),
                "tolerancia_aplicada": self.tolerance
            },
            "conciliados": matched,
            "divergentes": [],
            "somente_erp": final_somente_erp,
            "somente_prefeitura": final_somente_prefeitura
        }
