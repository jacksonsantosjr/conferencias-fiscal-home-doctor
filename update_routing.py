import sys

with open('static/app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

# Replace routing logic
old_block = """      if (mod === 'irrf') {
        currentMode = 'irrf';
        document.getElementById('moduleTitle').textContent = 'Conciliação de IRRF';
        document.getElementById('moduleSub').textContent = 'Cruze os relatórios de retenção de IRRF para a geração da guia via DCTFWeb.';
        document.querySelector('.upload-section h2').textContent = '📊 Importação dos Arquivos (IRRF)';
        
        if (uploadGridContainer) uploadGridContainer.style.display = 'none';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'grid';
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'none';
        
        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'none';
        if (btnStartAudit) btnStartAudit.style.display = 'none';
        if (btnStartIrrf) btnStartIrrf.style.display = 'inline-flex';
        
        if (resultsSection) resultsSection.style.display = 'none';
        if (irrfResultsSection && moduleState['irrf'].reconciliationData) {
            irrfResultsSection.style.display = 'block';
        } else if (irrfResultsSection) {
            irrfResultsSection.style.display = 'none';
        }
      } else {"""

new_block = """      if (mod === 'irrf') {
        currentMode = 'irrf';
        document.getElementById('moduleTitle').textContent = 'Conciliação de IRRF';
        document.getElementById('moduleSub').textContent = 'Cruze os relatórios de retenção de IRRF para a geração da guia via DCTFWeb.';
        document.querySelector('.upload-section h2').textContent = '📊 Importação dos Arquivos (IRRF)';
        
        if (uploadGridContainer) uploadGridContainer.style.display = 'none';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'grid';
        const uploadGridCsrf = document.getElementById('uploadGridCsrf');
        if (uploadGridCsrf) uploadGridCsrf.style.display = 'none';
        
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'none';
        
        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'none';
        if (btnStartAudit) btnStartAudit.style.display = 'none';
        if (btnStartIrrf) btnStartIrrf.style.display = 'inline-flex';
        if (btnStartCsrf) btnStartCsrf.style.display = 'none';
        
        if (resultsSection) resultsSection.style.display = 'none';
        if (csrfResultsSection) csrfResultsSection.style.display = 'none';
        if (irrfResultsSection && moduleState['irrf'].reconciliationData) {
            irrfResultsSection.style.display = 'block';
        } else if (irrfResultsSection) {
            irrfResultsSection.style.display = 'none';
        }
      } else if (mod === 'csrf') {
        currentMode = 'csrf';
        document.getElementById('moduleTitle').textContent = 'Conciliação de CSRF (PCC)';
        document.getElementById('moduleSub').textContent = 'Cruze os relatórios de retenção de PIS/COFINS/CSLL para a geração da guia via DCTFWeb.';
        document.querySelector('.upload-section h2').textContent = '⚖️ Importação dos Arquivos (CSRF)';
        
        if (uploadGridContainer) uploadGridContainer.style.display = 'none';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'none';
        const uploadGridCsrf = document.getElementById('uploadGridCsrf');
        if (uploadGridCsrf) uploadGridCsrf.style.display = 'grid';
        
        // HIDE CITY SELECTOR
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'none';
        
        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'none';
        if (btnStartAudit) btnStartAudit.style.display = 'none';
        if (btnStartIrrf) btnStartIrrf.style.display = 'none';
        if (btnStartCsrf) btnStartCsrf.style.display = 'inline-flex';
        
        if (resultsSection) resultsSection.style.display = 'none';
        if (irrfResultsSection) irrfResultsSection.style.display = 'none';
        if (csrfResultsSection && moduleState['csrf'].reconciliationData) {
            csrfResultsSection.style.display = 'block';
        } else if (csrfResultsSection) {
            csrfResultsSection.style.display = 'none';
        }
      } else {"""

if old_block in js_code:
    js_code = js_code.replace(old_block, new_block)
    print("Replace successful!")
else:
    print("Old block not found!")

# Also make sure the generic block hides CSRF grid and button
generic_old = """      } else {
        if (uploadGridContainer) uploadGridContainer.style.display = 'grid';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'none';
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'flex';"""
generic_new = """      } else {
        if (uploadGridContainer) uploadGridContainer.style.display = 'grid';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'none';
        const uploadGridCsrf = document.getElementById('uploadGridCsrf');
        if (uploadGridCsrf) uploadGridCsrf.style.display = 'none';
        
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'flex';"""

if generic_old in js_code:
    js_code = js_code.replace(generic_old, generic_new)
    print("Generic replace 1 successful!")

generic_old_2 = """        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'flex';
        if (btnStartAudit) btnStartAudit.style.display = 'inline-flex';
        if (btnStartIrrf) btnStartIrrf.style.display = 'none';"""
generic_new_2 = """        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'flex';
        if (btnStartAudit) btnStartAudit.style.display = 'inline-flex';
        if (btnStartIrrf) btnStartIrrf.style.display = 'none';
        if (btnStartCsrf) btnStartCsrf.style.display = 'none';"""

if generic_old_2 in js_code:
    js_code = js_code.replace(generic_old_2, generic_new_2)
    print("Generic replace 2 successful!")

with open('static/app.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
