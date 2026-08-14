import sys
with open('parsers/csrf_reconciler.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'except Exception:' in line and 'df = pd.read_csv' in lines[i+2]:
        lines[i] = '                except Exception as e:\n                    print("EXCEL EXCEPTION AGLU:", e)\n'
with open('parsers/csrf_reconciler.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)
