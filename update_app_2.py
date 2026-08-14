import sys
import re

with open('static/app.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

# 1. Add file handlers for CSRF inputs
# First find where the r4020 handlers are added and append CSRF handlers
r4020_handler = """    if (dropzoneR4020) {
      dropzoneR4020.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneR4020.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          r4020FileInput.files = e.dataTransfer.files;
          selectedR4020File = e.dataTransfer.files[0];
          r4020FileName.textContent = `📝 ${selectedR4020File.name}`;
          r4020FileName.classList.add('active');
        }
      });
      dropzoneR4020.addEventListener('click', () => r4020FileInput.click());
      r4020FileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          selectedR4020File = e.target.files[0];
          r4020FileName.textContent = `📝 ${selectedR4020File.name}`;
          r4020FileName.classList.add('active');
        }
      });
    }"""

csrf_handlers = """
    let selectedSe2CsrfFile = null;
    let selectedAgluCsrfFile = null;
    let selectedR4020CsrfFile = null;
    const se2CsrfFileName = document.getElementById('se2FileStatus');
    const agluCsrfFileName = document.getElementById('agluCsrfFileStatus');
    const r4020CsrfFileName = document.getElementById('r4020CsrfFileStatus');
    const dropzoneSe2 = document.getElementById('dropzoneSe2');
    const dropzoneAgluCsrf = document.getElementById('dropzoneAgluCsrf');
    const dropzoneR4020Csrf = document.getElementById('dropzoneR4020Csrf');

    if (dropzoneSe2) {
      dropzoneSe2.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneSe2.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          se2CsrfFileInput.files = e.dataTransfer.files;
          selectedSe2CsrfFile = e.dataTransfer.files[0];
          se2CsrfFileName.textContent = `📊 ${selectedSe2CsrfFile.name}`;
          se2CsrfFileName.classList.add('active');
        }
      });
      dropzoneSe2.addEventListener('click', () => se2CsrfFileInput.click());
      se2CsrfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          selectedSe2CsrfFile = e.target.files[0];
          se2CsrfFileName.textContent = `📊 ${selectedSe2CsrfFile.name}`;
          se2CsrfFileName.classList.add('active');
        }
      });
    }

    if (dropzoneAgluCsrf) {
      dropzoneAgluCsrf.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneAgluCsrf.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          agluCsrfFileInput.files = e.dataTransfer.files;
          selectedAgluCsrfFile = e.dataTransfer.files[0];
          agluCsrfFileName.textContent = `📄 ${selectedAgluCsrfFile.name}`;
          agluCsrfFileName.classList.add('active');
        }
      });
      dropzoneAgluCsrf.addEventListener('click', () => agluCsrfFileInput.click());
      agluCsrfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          selectedAgluCsrfFile = e.target.files[0];
          agluCsrfFileName.textContent = `📄 ${selectedAgluCsrfFile.name}`;
          agluCsrfFileName.classList.add('active');
        }
      });
    }

    if (dropzoneR4020Csrf) {
      dropzoneR4020Csrf.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneR4020Csrf.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
          r4020CsrfFileInput.files = e.dataTransfer.files;
          selectedR4020CsrfFile = e.dataTransfer.files[0];
          r4020CsrfFileName.textContent = `📝 ${selectedR4020CsrfFile.name}`;
          r4020CsrfFileName.classList.add('active');
        }
      });
      dropzoneR4020Csrf.addEventListener('click', () => r4020CsrfFileInput.click());
      r4020CsrfFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          selectedR4020CsrfFile = e.target.files[0];
          r4020CsrfFileName.textContent = `📝 ${selectedR4020CsrfFile.name}`;
          r4020CsrfFileName.classList.add('active');
        }
      });
    }"""

js_code = js_code.replace(r4020_handler, r4020_handler + csrf_handlers)


# 2. Add Reset files logic for CSRF
reset_files = """      if (sf1FileName) { sf1FileName.textContent = 'Nenhum arquivo selecionado'; sf1FileName.classList.remove('active'); }
      if (agluFileName) { agluFileName.textContent = 'Nenhum arquivo selecionado'; agluFileName.classList.remove('active'); }
      if (r4020FileName) { r4020FileName.textContent = 'Nenhum arquivo selecionado'; r4020FileName.classList.remove('active'); }"""
reset_csrf_files = reset_files + """
      if (se2CsrfFileInput) se2CsrfFileInput.value = '';
      if (agluCsrfFileInput) agluCsrfFileInput.value = '';
      if (r4020CsrfFileInput) r4020CsrfFileInput.value = '';
      if (se2CsrfFileName) { se2CsrfFileName.textContent = 'Nenhum arquivo selecionado'; se2CsrfFileName.classList.remove('active'); }
      if (agluCsrfFileName) { agluCsrfFileName.textContent = 'Nenhum arquivo selecionado'; agluCsrfFileName.classList.remove('active'); }
      if (r4020CsrfFileName) { r4020CsrfFileName.textContent = 'Nenhum arquivo selecionado'; r4020CsrfFileName.classList.remove('active'); }"""
js_code = js_code.replace(reset_files, reset_csrf_files)

# 3. Add btnStartCsrfAudit submit event listener
btn_start_irrf = """  if (btnStartIrrfAudit) {
    btnStartIrrfAudit.addEventListener('click', async () => {
      if (!selectedSf1File || !selectedAgluFile || !selectedR4020File) {
        showCustomAlert('Por favor, selecione os 3 arquivos (SF1, Aglutinação e R-4020) para a conciliação de IRRF.', 'error');
        return;
      }"""

btn_start_csrf = """  if (btnStartCsrfAudit) {
    btnStartCsrfAudit.addEventListener('click', async () => {
      if (!selectedSe2CsrfFile || !selectedAgluCsrfFile || !selectedR4020CsrfFile) {
        showCustomAlert('Por favor, selecione os 3 arquivos (SE2, Aglutinação e R-4020) para a conciliação de CSRF.', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('se2_file', selectedSe2CsrfFile);
      formData.append('aglu_file', selectedAgluCsrfFile);
      formData.append('r4020_file', selectedR4020CsrfFile);
      
      btnStartCsrfAudit.disabled = true;
      btnStartCsrfAudit.innerHTML = '<span class="spinner"></span> Conciliando CSRF...';
      
      const spinnerOverlay = document.getElementById('globalSpinnerOverlay');
      const spinnerText = document.getElementById('globalSpinnerText');
      if (spinnerOverlay) {
        if (spinnerText) spinnerText.textContent = 'Conciliando CSRF (PCC)...';
        spinnerOverlay.classList.remove('hidden');
      }
      
      try {
          const response = await fetch('/api/reconcile-csrf', { method: 'POST', body: formData });
          const data = await response.json();
          if (data.status === 'success') {
              moduleState['csrf'].reconciliationData = data.result;
              moduleState['csrf'].batchData = null; // Clear batch if any
              
              document.getElementById('uploadFormContainer').style.display = 'none';
              document.getElementById('csrf-results').style.display = 'block';
              
              renderCsrfResults(data.result);
              
              showCustomAlert(data.message, 'success');
          } else {
              showCustomAlert('Erro: ' + data.message, 'error');
          }
      } catch (err) {
          showCustomAlert('Erro ao processar CSRF: ' + err.message, 'error');
      } finally {
          btnStartCsrfAudit.disabled = false;
          btnStartCsrfAudit.innerHTML = '<span>Iniciar Conciliação de CSRF (PCC)</span>';
          if (spinnerOverlay) spinnerOverlay.classList.add('hidden');
      }
    });
  }
  
"""

js_code = js_code.replace(btn_start_irrf, btn_start_csrf + btn_start_irrf)


# 4. Add renderCsrfResults function
render_irrf = """  function renderIrrfResults(result) {"""
render_csrf = """
  function renderCsrfResults(result) {
    console.log("Renderizando resultados CSRF:", result);
    const tbody = document.getElementById('tableBodyCsrf');
    if (!tbody) {
      console.warn("Tabela CSRF não encontrada!");
      return;
    }
    
    tbody.innerHTML = '';
    
    // Obter os detalhes
    const detalhes = result.detalhes || [];
    
    if (detalhes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Nenhum registro encontrado.</td></tr>';
      return;
    }
    
    detalhes.forEach(item => {
      const diff = Math.abs(item.diferenca);
      const isConciliado = item.status === 'Conciliado';
      const statusClass = isConciliado ? 'status-conciliado' : 'status-divergente';
      
      let diagClass = '';
      if (item.diagnostico.includes('ausente na REINF') || item.diagnostico.includes('Aglutinação Múltipla') || item.diagnostico.includes('Diferença de')) diagClass = 'text-danger';
      else if (item.diagnostico === 'OK') diagClass = 'text-success';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.filial}</td>
        <td>${item.numero || '-'}</td>
        <td>${item.cnpj}</td>
        <td>${formatCurrency(item.csrf_se2)}</td>
        <td>${formatCurrency(item.csrf_aglu)}</td>
        <td>${formatCurrency(item.csrf_r4020)}</td>
        <td class="${diff > 0.04 ? 'divergente-text' : ''}">${formatCurrency(item.diferenca)}</td>
        <td><span class="status-badge ${statusClass}">${item.status}</span></td>
        <td class="${diagClass}">${item.diagnostico}</td>
      `;
      tbody.appendChild(tr);
    });
  }
"""

js_code = js_code.replace(render_irrf, render_csrf + render_irrf)

with open('static/app.js', 'w', encoding='utf-8') as f:
    f.write(js_code)
print("done")
