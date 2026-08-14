def test_row(filial_raw, numero_raw):
    filial_str = str(filial_raw)
    numero_str = str(numero_raw)
    if not filial_str or not numero_str: return False
    
    if not any(c.isdigit() for c in filial_str): return False
    if not any(c.isdigit() for c in numero_str): return False
    if 'tota' in filial_str.lower(): return False
    
    return True

print("Total row:", test_row("TotaI de TítuIos a Baixar", ">>"))
print("Valid row:", test_row("303100001", "12345"))
print("Valid with letters:", test_row("0001", "123A"))
