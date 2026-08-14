import sys

with open('static/app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

js_code = js_code.replace(
    "irrf: { reconciliationData: null, batchData: null }",
    "irrf: { reconciliationData: null, batchData: null },\n    csrf: { reconciliationData: null, batchData: null }"
)

js_code = js_code.replace(
    "irrf: { sf1File: null, agluFile: null, r4020File: null, sf1Text: 'Nenhum arquivo selecionado', agluText: 'Nenhum arquivo selecionado', r4020Text: 'Nenhum arquivo selecionado' }",
    "irrf: { sf1File: null, agluFile: null, r4020File: null, sf1Text: 'Nenhum arquivo selecionado', agluText: 'Nenhum arquivo selecionado', r4020Text: 'Nenhum arquivo selecionado' },\n    csrf: { se2File: null, agluFile: null, r4020File: null, se2Text: 'Nenhum arquivo selecionado', agluText: 'Nenhum arquivo selecionado', r4020Text: 'Nenhum arquivo selecionado' }"
)

js_code = js_code.replace(
    "if (mode === 'irrf') return 'irrf';",
    "if (mode === 'irrf') return 'irrf';\n    if (mode === 'csrf') return 'csrf';"
)

js_code = js_code.replace(
    "const btnStartIrrfAudit = document.getElementById('reconcile-irrf-btn');",
    "const btnStartIrrfAudit = document.getElementById('reconcile-irrf-btn');\n  const btnStartCsrfAudit = document.getElementById('reconcile-csrf-btn');"
)

js_code = js_code.replace(
    "const btnStartIrrf = document.getElementById('reconcile-irrf-btn');",
    "const btnStartIrrf = document.getElementById('reconcile-irrf-btn');\n      const btnStartCsrf = document.getElementById('reconcile-csrf-btn');"
)

js_code = js_code.replace(
    "const irrfResultsSection = document.getElementById('irrf-results');",
    "const irrfResultsSection = document.getElementById('irrf-results');\n      const csrfResultsSection = document.getElementById('csrf-results');"
)

js_code = js_code.replace(
    "if (irrfResultsSection) irrfResultsSection.style.display = 'none';",
    "if (irrfResultsSection) irrfResultsSection.style.display = 'none';\n        if (csrfResultsSection) csrfResultsSection.style.display = 'none';"
)

js_code = js_code.replace(
    "const irrfResults = document.getElementById('irrf-results');\\n          if (irrfResults) irrfResults.style.display = 'none';",
    "const irrfResults = document.getElementById('irrf-results');\n          if (irrfResults) irrfResults.style.display = 'none';\n          const csrfResults = document.getElementById('csrf-results');\n          if (csrfResults) csrfResults.style.display = 'none';"
)

switch_mod = """      } else if (mod === 'irrf') {
        currentMode = 'irrf';
        btnStartAudit.style.display = 'none';
        btnStartIrrf.style.display = 'inline-flex';
        uploadGridIrrf.style.display = 'grid';
        
        btnBatchModal.style.display = 'none';

        if (irrfResultsSection && moduleState['irrf'].reconciliationData) {
            irrfResultsSection.style.display = 'block';
        } else if (irrfResultsSection) {
            irrfResultsSection.style.display = 'none';
        }"""
replacement_mod = switch_mod + """
      } else if (mod === 'csrf') {
        currentMode = 'csrf';
        btnStartAudit.style.display = 'none';
        btnStartIrrf.style.display = 'none';
        if (btnStartCsrf) btnStartCsrf.style.display = 'inline-flex';
        
        uploadGridIrrf.style.display = 'none';
        const uploadGridCsrf = document.getElementById('uploadGridCsrf');
        if (uploadGridCsrf) uploadGridCsrf.style.display = 'grid';
        
        btnBatchModal.style.display = 'none';

        if (csrfResultsSection && moduleState['csrf'].reconciliationData) {
            csrfResultsSection.style.display = 'block';
        } else if (csrfResultsSection) {
            csrfResultsSection.style.display = 'none';
        }"""
js_code = js_code.replace(switch_mod, replacement_mod)

# Adicionar os events listeners pros arquivos do CSRF
setup_files = """  const sf1FileInput = document.getElementById('sf1-file');
  const agluFileInput = document.getElementById('aglu-file');
  const r4020FileInput = document.getElementById('r4020-file');"""
replacement_setup_files = setup_files + """
  const se2CsrfFileInput = document.getElementById('se2-file');
  const agluCsrfFileInput = document.getElementById('aglu-csrf-file');
  const r4020CsrfFileInput = document.getElementById('r4020-csrf-file');"""
js_code = js_code.replace(setup_files, replacement_setup_files)

with open('static/app.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print("done")
