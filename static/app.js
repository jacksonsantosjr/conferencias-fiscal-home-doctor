// Lógica Interativa da Interface Web de Conferência Fiscal

document.addEventListener('DOMContentLoaded', () => {
  // Elementos da Sidebar Retrátil (CND Style)
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  // Elementos do Tema Light/Dark
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  // Elementos de Upload e Reset
  const dropzoneErp = document.getElementById('dropzoneErp');
  const dropzoneCity = document.getElementById('dropzoneCity');
  const erpFileInput = document.getElementById('erpFileInput');
  const cityFileInput = document.getElementById('cityFileInput');
  const erpFileStatus = document.getElementById('erpFileStatus');
  const cityFileStatus = document.getElementById('cityFileStatus');
  
  const btnStartAudit = document.getElementById('btnStartAudit');
  const btnLoadDemo = document.getElementById('btnLoadDemo');
  const btnResetAll = document.getElementById('btnResetAll');
  const btnBatchModal = document.getElementById('btnBatchModal');

  // Dashboard e Tabela Individual
  const dashboardGrid = document.getElementById('dashboardGrid');
  const resultsSection = document.getElementById('resultsSection');
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const tabGroup = document.getElementById('tabGroup');

  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnExportPdf = document.getElementById('btnExportPdf');

  // Elementos do Modal de Progresso
  const progressModal = document.getElementById('progressModal');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressStepText = document.getElementById('progressStepText');
  const progressPercentText = document.getElementById('progressPercentText');
  const progressCityInfo = document.getElementById('progressCityInfo');

  // Elementos do Modal 1 (Batch Modal)
  const batchModal = document.getElementById('batchModal');
  const btnCloseBatchModal = document.getElementById('btnCloseBatchModal');
  const batchUploadZone = document.getElementById('batchUploadZone');
  const batchSummaryPanel = document.getElementById('batchSummaryPanel');
  const dropzoneZip = document.getElementById('dropzoneZip');
  const zipFileInput = document.getElementById('zipFileInput');
  const zipFileStatus = document.getElementById('zipFileStatus');
  const btnBatchDemo = document.getElementById('btnBatchDemo');
  const btnStartBatchAudit = document.getElementById('btnStartBatchAudit');
  const btnNewBatch = document.getElementById('btnNewBatch');
  const batchTableBody = document.getElementById('batchTableBody');

  // Elementos do Modal 3 (City Detail Modal Sobreposto)
  const cityDetailModal = document.getElementById('cityDetailModal');
  const btnCloseCityDetailModal = document.getElementById('btnCloseCityDetailModal');
  const detailCityTitle = document.getElementById('detailCityTitle');
  const detailCitySub = document.getElementById('detailCitySub');
  const detailCityTableBody = document.getElementById('detailCityTableBody');

  let selectedErpFile = null;
  let selectedCityFile = null;
  let selectedZipFile = null;
  let currentReconciliationData = null;
  let currentBatchData = null;
  let activeTab = 'all';
  let currentMode = 'faturamento'; // 'faturamento' ou 'iss'
  let accuracyChartInstance = null;

    const moduleState = {
    faturamento: { reconciliationData: null, batchData: null },
    iss: { reconciliationData: null, batchData: null },
    'iss-tomados': { reconciliationData: null, batchData: null }
  };

  const fileState = {
    prestados: { erpFile: null, cityFile: null, zipFile: null, erpText: 'Nenhum arquivo selecionado', cityText: 'Nenhum arquivo selecionado', zipText: 'Nenhum arquivo compactado selecionado', erpActive: false, cityActive: false, zipActive: false },
    tomados: { erpFile: null, cityFile: null, zipFile: null, erpText: 'Nenhum arquivo selecionado', cityText: 'Nenhum arquivo selecionado', zipText: 'Nenhum arquivo compactado selecionado', erpActive: false, cityActive: false, zipActive: false }
  };

  function getFileGroup(mode) {
    return mode === 'iss-tomados' ? 'tomados' : 'prestados';
  }

  // ========================================================
  // GERENCIAMENTO DA SIDEBAR RETRÁTIL (CND STYLE)
  // ========================================================
  const isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  if (isSidebarCollapsed) {
    sidebar.classList.add('collapsed');
  }

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const collapsedNow = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_collapsed', collapsedNow);
  });

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.classList.contains('disabled')) {
        e.preventDefault();
        return;
      }
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Salva o estado atual antes de trocar
      moduleState[currentMode].reconciliationData = currentReconciliationData;
      moduleState[currentMode].batchData = currentBatchData;
      
      let fgOld = getFileGroup(currentMode);
      fileState[fgOld].erpFile = selectedErpFile;
      fileState[fgOld].cityFile = selectedCityFile;
      fileState[fgOld].zipFile = selectedZipFile;
      fileState[fgOld].erpText = erpFileStatus.textContent;
      fileState[fgOld].cityText = cityFileStatus.textContent;
      fileState[fgOld].zipText = zipFileStatus.textContent;
      fileState[fgOld].erpActive = erpFileStatus.classList.contains('active');
      fileState[fgOld].cityActive = cityFileStatus.classList.contains('active');
      fileState[fgOld].zipActive = zipFileStatus.classList.contains('active');

      const mod = item.getAttribute('data-module');
      if (mod === 'iss-prestados') {
        currentMode = 'iss';
        document.getElementById('moduleTitle').textContent = 'Conferência ISS - Serviços Prestados';
        document.getElementById('moduleSub').textContent = 'Auditoria do Imposto Devido (ERP) vs ISS Apurado (Prefeitura)';
        document.querySelector('.upload-section h2').textContent = '🏛️ Importação dos Arquivos Fiscais (ISS)';
        document.querySelector('.modal-title-group h3').textContent = 'Conferência de ISS em Lote';
      } else if (mod === 'iss-tomados') {
        currentMode = 'iss-tomados';
        document.getElementById('moduleTitle').textContent = 'Conferência ISS - Serviços Tomados';
        document.getElementById('moduleSub').textContent = 'Auditoria de ISS Retido na Fonte (Tomador)';
        document.querySelector('.upload-section h2').textContent = '🏢 Importação dos Arquivos Fiscais (Tomados)';
        document.querySelector('.modal-title-group h3').textContent = 'Conferência de Tomados em Lote';
      } else {
        currentMode = 'faturamento';
        document.getElementById('moduleTitle').textContent = 'Conferência de Faturamento Fiscal';
        document.getElementById('moduleSub').textContent = 'Automação e Auditoria de Notas Fiscais Emitidas (ERP vs Prefeituras)';
        document.querySelector('.upload-section h2').textContent = '📁 Importação dos Arquivos Fiscais';
        document.querySelector('.modal-title-group h3').textContent = 'Conferência de Faturamento em Lote';
      }
      
      // Restaura o estado salvo do módulo escolhido
      currentReconciliationData = moduleState[currentMode].reconciliationData;
      currentBatchData = moduleState[currentMode].batchData;
      
      let fgNew = getFileGroup(currentMode);
      selectedErpFile = fileState[fgNew].erpFile;
      selectedCityFile = fileState[fgNew].cityFile;
      selectedZipFile = fileState[fgNew].zipFile;
      erpFileStatus.textContent = fileState[fgNew].erpText;
      cityFileStatus.textContent = fileState[fgNew].cityText;
      zipFileStatus.textContent = fileState[fgNew].zipText;
      if (fileState[fgNew].erpActive) erpFileStatus.classList.add('active'); else erpFileStatus.classList.remove('active');
      if (fileState[fgNew].cityActive) cityFileStatus.classList.add('active'); else cityFileStatus.classList.remove('active');
      if (fileState[fgNew].zipActive) zipFileStatus.classList.add('active'); else zipFileStatus.classList.remove('active');


      if (currentReconciliationData) {
        renderResults(currentReconciliationData);
      } else {
        dashboardGrid.style.display = 'none';
        const dashboardIssAudit = document.getElementById('dashboardIssAudit');
        if (dashboardIssAudit) dashboardIssAudit.style.display = 'none';
        resultsSection.style.display = 'none';
        document.getElementById('uploadFormContainer').style.display = 'block';
        document.getElementById('chartContainer').style.display = 'none';
        tableBody.innerHTML = '';
      }
      
      // Nota: Não chamamos mais btnResetAll.click() para preservar os arquivos selecionados
    });
  });

  // ========================================================
  // GERENCIAMENTO DE TEMA (LIGHT / DARK MODE)
  // ========================================================
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Modo Escuro';
    } else {
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Modo Claro';
    }
  }

  // ========================================================
  // CONFIGURAÇÃO DOS DRAG & DROP E FILE INPUTS
  // ========================================================
  [dropzoneErp, dropzoneCity, dropzoneZip].forEach(zone => {
    if (!zone) return;
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });
  });

  dropzoneErp.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneErp.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedErpFile = e.dataTransfer.files[0];
      erpFileStatus.textContent = `📄 ${selectedErpFile.name}`;
      erpFileStatus.classList.add('active');
    }
  });

  dropzoneCity.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneCity.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedCityFile = e.dataTransfer.files[0];
      cityFileStatus.textContent = `📄 ${selectedCityFile.name}`;
      cityFileStatus.classList.add('active');
    }
  });

  dropzoneZip.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneZip.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedZipFile = e.dataTransfer.files[0];
      zipFileStatus.textContent = `📦 ${selectedZipFile.name}`;
      zipFileStatus.classList.add('active');
    }
  });

  erpFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      selectedErpFile = e.target.files[0];
      erpFileStatus.textContent = `📄 ${selectedErpFile.name}`;
      erpFileStatus.classList.add('active');
    }
  });

  cityFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      selectedCityFile = e.target.files[0];
      cityFileStatus.textContent = `📄 ${selectedCityFile.name}`;
      cityFileStatus.classList.add('active');
    }
  });

  zipFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      selectedZipFile = e.target.files[0];
      zipFileStatus.textContent = `📦 ${selectedZipFile.name}`;
      zipFileStatus.classList.add('active');
    }
  });

  // ========================================================
  // CONFERÊNCIA INDIVIDUAL EM LOTE MODAL HANDLERS
  // ========================================================
  btnBatchModal.addEventListener('click', () => {
    batchModal.style.display = 'flex';
  });

  btnCloseBatchModal.addEventListener('click', () => {
    batchModal.style.display = 'none';
  });

  btnCloseCityDetailModal.addEventListener('click', () => {
    cityDetailModal.style.display = 'none';
  });

  btnNewBatch.addEventListener('click', () => {
    batchSummaryPanel.style.display = 'none';
    batchUploadZone.style.display = 'block';
    selectedZipFile = null;
    zipFileStatus.textContent = 'Nenhum arquivo compactado selecionado';
    zipFileStatus.classList.remove('active');
  });

  // Demo Lote (Todas as 18 Prefeituras)
  btnBatchDemo.addEventListener('click', async () => {
    const endpoint = currentMode === 'iss' ? '/api/reconcile-iss-batch-demo' : currentMode === 'iss-tomados' ? '/api/reconcile-iss-tomados-batch-demo' : '/api/reconcile-batch-demo';
    runBatchAnalysis(endpoint, null);
  });

  // Upload Lote ZIP
  btnStartBatchAudit.addEventListener('click', async () => {
    if (!selectedZipFile) {
      alert('Por favor, selecione ou arraste um arquivo compactado (.ZIP) com os relatórios das prefeituras.');
      return;
    }
    const formData = new FormData();
    formData.append('zip_file', selectedZipFile);
    const endpoint = currentMode === 'iss' ? '/api/reconcile-iss-batch' : currentMode === 'iss-tomados' ? '/api/reconcile-iss-tomados-batch' : '/api/reconcile-batch';
    runBatchAnalysis(endpoint, formData);
  });

  // Executa Análise em Lote com Animação Fluída Contínua de Progresso (0% a 100%)
  async function runBatchAnalysis(endpoint, formData) {
    startSmoothProgress(
      'Modo: Conferência Geral em Lote (18 Prefeituras)',
      [
        'Descompactando e lendo relatórios do ERP e Prefeituras...',
        'Auditando bases de cálculo e alíquotas de todas as cidades...',
        'Cruzando notas fiscais e identificando divergências...',
        'Consolidando lote das 18 prefeituras...'
      ]
    );

    try {
      let response;
      if (formData) {
        response = await fetch(endpoint, { method: 'POST', body: formData });
      } else {
        response = await fetch(endpoint, { method: 'POST' });
      }

      const data = await response.json();
      await finishSmoothProgress();

      if (data.success) {
        currentBatchData = data;
        renderBatchSummary(data);
      } else {
        alert(data.error || 'Erro ao realizar conferência em lote.');
      }
    } catch (err) {
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      hideProgressModal();
      alert('Erro de conexão com o servidor de auditoria.');
    }
  }

  // Renderiza Painel Consolidado de Lote
  function renderBatchSummary(batchData) {
    const gSum = batchData.global_summary || {};
    const totalProcessed = gSum.total_cities || 0;
    const matchedCount = gSum.matched_cities || 0;
    const divCount = gSum.divergent_cities || 0;

    document.getElementById('batchTotalAudited').textContent = formatCurrency(gSum.total_erp_valor || 0);
    document.getElementById('batchTotalSub').textContent = `${totalProcessed} de 18 prefeituras auditadas`;
    
    document.getElementById('batchMatchedCount').textContent = matchedCount;
    const matchedSub = document.querySelector('#batchModal .stat-card.conciliados .stat-sub');
    if (matchedSub) {
      matchedSub.textContent = `${matchedCount} de ${totalProcessed} sem divergências`;
    }

    document.getElementById('batchDivergentCount').textContent = divCount;
    const divSub = document.querySelector('#batchModal .stat-card.divergentes .stat-sub');
    if (divSub) {
      divSub.textContent = divCount > 0 ? `${divCount} prefeitura(s) com atenção` : 'Nenhuma divergência';
    }

    document.getElementById('batchAccuracy').textContent = `${gSum.accuracy || 100}%`;

    batchTableBody.innerHTML = '';

    (batchData.cities_results || []).forEach((cResult) => {
      const tr = document.createElement('tr');
      const res = cResult.resumo || {};
      const isDiv = cResult.status === 'DIVERGENTE';

      tr.innerHTML = `
        <td><strong>📍 ${cResult.city}</strong></td>
        <td>${res.total_erp_qtd || 0}</td>
        <td>${formatCurrency(res.total_erp_valor || 0)}</td>
        <td>${res.total_prefeitura_qtd || 0}</td>
        <td>${formatCurrency(res.total_prefeitura_valor || 0)}</td>
        <td style="color: ${isDiv ? 'var(--status-danger-text)' : 'var(--text-muted)'}; font-weight: 600;">
          ${formatCurrency(Math.abs((res.total_erp_valor || 0) - (res.total_prefeitura_valor || 0)))}
        </td>
        <td>
          <span class="badge ${isDiv ? 'badge-divergent' : 'badge-matched'}">
            ${isDiv ? '🔴 Divergente' : '🟢 100% Conciliado'}
          </span>
        </td>
        <td>
          ${isDiv 
            ? `<button type="button" class="btn-export btn-view-city-detail" data-city="${cResult.city}">👁️ Detalhes</button>`
            : `<button type="button" class="btn-export" disabled style="opacity: 0.4; cursor: not-allowed; pointer-events: none;">👁️ Detalhes</button>`
          }
        </td>
      `;

      batchTableBody.appendChild(tr);
    });

    // Handler para os Botões "👁️ Detalhes" ativos (somente cidades com divergência)
    document.querySelectorAll('.btn-view-city-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const cityName = btn.getAttribute('data-city');
        const cData = (batchData.cities_results || []).find(c => c.city === cityName);
        if (cData) {
          openCityDetailModal(cData);
        }
      });
    });

    batchUploadZone.style.display = 'none';
    batchSummaryPanel.style.display = 'block';
  }

  // Abre Modal 3 (Sobreposto) para Detalhes das Divergências da Cidade
  function openCityDetailModal(cData) {
    detailCityTitle.textContent = `📍 Divergências Encontradas — ${cData.city}`;
    const divItems = (cData.items || []).filter(item => item.status !== 'CONCILIADO');
    const displayItems = divItems.length > 0 ? divItems : (cData.items || []);

    detailCitySub.textContent = `Exibindo ${displayItems.length} nota(s) com divergência | ERP: ${formatCurrency(cData.resumo.total_erp_valor)} vs Prefeitura: ${formatCurrency(cData.resumo.total_prefeitura_valor)}`;
    detailCityTableBody.innerHTML = '';

    displayItems.forEach((item) => {
      const tr = document.createElement('tr');
      let statusBadge = '';
      if (item.status === 'CONCILIADO') {
        statusBadge = '<span class="badge badge-matched">🟢 Conciliado</span>';
      } else if (item.status === 'DIVERGENTE') {
        statusBadge = '<span class="badge badge-divergent">🔴 Divergência</span>';
      } else if (item.status === 'SOMENTE_ERP') {
        statusBadge = '<span class="badge badge-erp-only">⚠️ Apenas ERP</span>';
      } else {
        statusBadge = '<span class="badge badge-city-only">⚠️ Apenas Prefeitura</span>';
      }

      tr.innerHTML = `
        <td>${statusBadge}</td>
        <td><strong>${item.numero_erp || item.rps_erp || '-'}</strong></td>
        <td>${item.numero_prefeitura || '-'}</td>
        <td>${item.tomador || '-'}</td>
        <td>${formatCurrency(item.valor_erp || 0)}</td>
        <td>${formatCurrency(item.valor_prefeitura || 0)}</td>
        <td style="color: ${item.diferenca > 0.04 ? 'var(--status-danger-text)' : 'var(--text-muted)'}; font-weight: 600;">
          ${formatCurrency(item.diferenca || 0)}
        </td>
        <td><small style="color: var(--text-muted);">${item.diagnostico || '-'}</small></td>
      `;

      detailCityTableBody.appendChild(tr);
    });

    cityDetailModal.style.display = 'flex';
  }

  // ========================================================
  // CONFERÊNCIA INDIVIDUAL (CIDADE SELECIONADA)
  // ========================================================
  btnLoadDemo.addEventListener('click', async () => {
    const selectedCity = document.getElementById('citySelect').value;
    if (!selectedCity) {
      alert('Por favor, selecione uma prefeitura antes de continuar.');
      return;
    }
    startSmoothProgress(
      `Demonstração: Prefeitura de ${selectedCity}`,
      [
        'Carregando modelo oficial do ERP e Prefeitura...',
        'Executando regras de conciliação e margem de R$ 0,04...',
        'Cruzando notas fiscais e verificando divergências...',
        'Gerando relatório final...'
      ]
    );

    try {
      const endpoint = currentMode === 'iss' ? '/api/reconcile-iss-demo' : currentMode === 'iss-tomados' ? '/api/reconcile-iss-tomados-demo' : '/api/reconcile-demo';
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: selectedCity })
        });
      } catch (firstErr) {
        console.warn('[Demo] 1ª tentativa falhou, retry...', firstErr);
        await new Promise(r => setTimeout(r, 500));
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: selectedCity })
        });
      }

      let responseText;
      try {
        responseText = await response.text();
      } catch (readErr) {
        console.error('[Demo] Erro ao ler resposta:', readErr);
        if (activeProgressTimer) clearInterval(activeProgressTimer);
        hideProgressModal();
        alert('Erro ao ler a resposta do servidor. Tente novamente.');
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('[Demo] Resposta não é JSON válido:', responseText.substring(0, 500), jsonErr);
        if (activeProgressTimer) clearInterval(activeProgressTimer);
        hideProgressModal();
        alert('Resposta inválida do servidor. Tente novamente.');
        return;
      }

      await finishSmoothProgress();

      if (data.success) {
        currentReconciliationData = data.result;
        renderResults(data.result);
      } else {
        alert(data.error || 'Erro ao processar modelo.');
      }
    } catch (err) {
      console.error('[Demo] Erro inesperado:', err);
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      hideProgressModal();
      alert('Erro inesperado: ' + (err.message || err));
    }
  });

  btnStartAudit.addEventListener('click', async () => {
    const selectedCity = document.getElementById('citySelect').value;
    if (!selectedCity) {
      alert('Por favor, selecione uma prefeitura antes de continuar.');
      return;
    }
    if (!selectedErpFile || !selectedCityFile) {
      alert('Por favor, selecione ambos os relatórios (ERP e Prefeitura) antes de iniciar a conferência.');
      return;
    }

    startSmoothProgress(
      `Alvo: Prefeitura de ${selectedCity}`,
      [
        'Extraindo dados dos arquivos do ERP e Prefeitura...',
        'Cruzando notas fiscais e verificando tolerância de R$ 0,04...',
        'Analisando inconsistências e agrupando resultados...',
        'Finalizando auditoria fiscal...'
      ]
    );

    try {
      const formData = new FormData();
      formData.append('erp_file', selectedErpFile);
      formData.append('city_file', selectedCityFile);
      formData.append('city', selectedCity);

      const endpoint = currentMode === 'iss' ? '/api/reconcile-iss' : currentMode === 'iss-tomados' ? '/api/reconcile-iss-tomados' : '/api/reconcile';
      let response;
      try {
        response = await fetch(endpoint, { method: 'POST', body: formData });
      } catch (firstErr) {
        console.warn('[Conferência] 1ª tentativa falhou, aguardando 500ms para retry...', firstErr);
        await new Promise(r => setTimeout(r, 500));
        try {
          response = await fetch(endpoint, { method: 'POST', body: formData });
        } catch (secondErr) {
          console.error('[Conferência] 2ª tentativa também falhou:', secondErr);
          if (activeProgressTimer) clearInterval(activeProgressTimer);
          hideProgressModal();
          alert('Não foi possível conectar ao servidor. Verifique se o servidor está em execução e tente novamente.');
          return;
        }
      }

      let responseText;
      try {
        responseText = await response.text();
      } catch (readErr) {
        console.error('[Conferência] Erro ao ler corpo da resposta:', readErr);
        if (activeProgressTimer) clearInterval(activeProgressTimer);
        hideProgressModal();
        alert('Erro ao ler a resposta do servidor. Tente novamente.');
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('[Conferência] Resposta não é JSON válido:', responseText.substring(0, 500), jsonErr);
        if (activeProgressTimer) clearInterval(activeProgressTimer);
        hideProgressModal();
        alert('Resposta inválida do servidor. Tente novamente.');
        return;
      }

      await finishSmoothProgress();

      if (data.success) {
        currentReconciliationData = data.result;
        renderResults(data.result);
      } else {
        alert(data.error || 'Falha na auditoria.');
      }
    } catch (err) {
      console.error('[Conferência] Erro inesperado:', err);
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      hideProgressModal();
      alert('Erro inesperado: ' + (err.message || err));
    }
  });

  btnResetAll.addEventListener('click', () => {
    selectedErpFile = null;
    selectedCityFile = null;
    currentReconciliationData = null;
    erpFileInput.value = '';
    cityFileInput.value = '';
    erpFileStatus.textContent = 'Nenhum arquivo selecionado';
    cityFileStatus.textContent = 'Nenhum arquivo selecionado';
    erpFileStatus.classList.remove('active');
    cityFileStatus.classList.remove('active');
    dashboardGrid.style.display = 'none';
    const dashboardIssAudit = document.getElementById('dashboardIssAudit');
    if (dashboardIssAudit) dashboardIssAudit.style.display = 'none';
    resultsSection.style.display = 'none';
    document.getElementById('uploadFormContainer').style.display = 'block';
    document.getElementById('chartContainer').style.display = 'none';
    tableBody.innerHTML = '';
    
    // Clear state in cache
    moduleState[currentMode].reconciliationData = null;
    moduleState[currentMode].batchData = null;
    let fg = getFileGroup(currentMode);
    fileState[fg].erpFile = null;
    fileState[fg].cityFile = null;
    fileState[fg].zipFile = null;
    fileState[fg].erpText = 'Nenhum arquivo selecionado';
    fileState[fg].cityText = 'Nenhum arquivo selecionado';
    fileState[fg].zipText = 'Nenhum arquivo compactado selecionado';
    fileState[fg].erpActive = false;
    fileState[fg].cityActive = false;
    fileState[fg].zipActive = false;
  });

  // Funções Auxiliares de Progresso Fluído Contínuo e Formatação
  let activeProgressTimer = null;
  let currentPercentValue = 0;

  function showProgressModal() {
    progressModal.style.display = 'flex';
    progressBarFill.style.width = '0%';
    progressPercentText.textContent = '0%';
  }

  function hideProgressModal() {
    progressModal.style.display = 'none';
  }

  function startSmoothProgress(infoText, stepsList) {
    showProgressModal();
    progressCityInfo.textContent = infoText;
    currentPercentValue = 0;
    progressBarFill.style.width = '0%';
    progressPercentText.textContent = '0%';
    progressStepText.textContent = stepsList[0] || 'Iniciando auditoria...';

    if (activeProgressTimer) clearInterval(activeProgressTimer);

    const startTime = performance.now();
    let stepIdx = 0;

    activeProgressTimer = setInterval(() => {
      const elapsedSec = (performance.now() - startTime) / 1000;
      
      // Progressão suave e perfeitamente sincronizada com o backend de 16 segundos:
      let target = 0;
      if (elapsedSec <= 3) {
        target = (elapsedSec / 3) * 30; // 0% a 30% nos primeiros 3s
      } else if (elapsedSec <= 10) {
        target = 30 + ((elapsedSec - 3) / 7) * 45; // 30% a 75% entre 3s e 10s
      } else if (elapsedSec <= 20) {
        target = 75 + ((elapsedSec - 10) / 10) * 20; // 75% a 95% até 20s
      } else {
        target = 95 + Math.min(3.8, (elapsedSec - 20) * 0.1); // >20s: avanço continuo
      }

      currentPercentValue = Math.min(99.2, Math.max(currentPercentValue + 0.15, target));

      const displayVal = Math.floor(currentPercentValue);
      progressBarFill.style.width = `${currentPercentValue.toFixed(1)}%`;
      progressPercentText.textContent = `${displayVal}%`;

      if (displayVal >= 25 && stepIdx === 0 && stepsList[1]) {
        stepIdx = 1;
        progressStepText.textContent = stepsList[1];
      } else if (displayVal >= 55 && stepIdx === 1 && stepsList[2]) {
        stepIdx = 2;
        progressStepText.textContent = stepsList[2];
      } else if (displayVal >= 80 && stepIdx === 2 && stepsList[3]) {
        stepIdx = 3;
        progressStepText.textContent = stepsList[3];
      }
    }, 60);
  }

  function finishSmoothProgress() {
    return new Promise(resolve => {
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      progressStepText.textContent = 'Consolidando indicadores e relatórios finais...';

      let startVal = Math.floor(currentPercentValue);
      let startTime = performance.now();
      let duration = 300; // 300ms para ir de onde parou até 100%

      function update(currentTime) {
        let elapsed = currentTime - startTime;
        let p = Math.min(elapsed / duration, 1);
        let val = Math.round(startVal + (100 - startVal) * p);

        progressBarFill.style.width = `${val}%`;
        progressPercentText.textContent = `${val}%`;

        if (p < 1) {
          requestAnimationFrame(update);
        } else {
          setTimeout(() => {
            hideProgressModal();
            resolve();
          }, 200);
        }
      }
      requestAnimationFrame(update);
    });
  }

  // Normaliza a resposta do backend para formato com lista plana 'items'
  function normalizeResult(result) {
    if (result.items) return result; // Já está normalizado

    const items = [];

    // Conciliados (incluindo TOLERANCIA)
    (result.conciliados || []).forEach(m => {
      items.push({
        status: m.status === 'TOLERANCIA' ? 'CONCILIADO' : (m.status || 'CONCILIADO'),
        numero_erp: m.erp?.numero || m.erp?.rps || '-',
        rps_erp: m.erp?.rps || '',
        numero_prefeitura: m.prefeitura?.numero || '-',
        tomador: m.erp?.tomador || m.prefeitura?.tomador || '-',
        valor_erp: m.valor_erp || 0,
        valor_prefeitura: m.valor_prefeitura || 0,
        diferenca: m.diferenca || 0,
        iss_erp: m.erp?.valor_iss || 0,
        iss_prefeitura: m.prefeitura?.valor_iss || 0,
        iss_retido: m.prefeitura?.iss_retido || 'N',
        diagnostico: m.detalhe || 'Conciliado'
      });
    });

    // Divergentes
    (result.divergentes || []).forEach(m => {
      items.push({
        status: 'DIVERGENTE',
        numero_erp: m.erp?.numero || m.erp?.rps || m.numero || '-',
        rps_erp: m.erp?.rps || '',
        numero_prefeitura: m.prefeitura?.numero || m.numero || '-',
        tomador: m.erp?.tomador || m.prefeitura?.tomador || m.tomador || '-',
        valor_erp: m.valor_erp || 0,
        valor_prefeitura: m.valor_prefeitura || 0,
        diferenca: m.diferenca || 0,
        iss_erp: m.erp?.valor_iss || 0,
        iss_prefeitura: m.prefeitura?.valor_iss || 0,
        iss_retido: m.prefeitura?.iss_retido || 'N',
        diagnostico: m.detalhe || 'Divergência de valores'
      });
    });

    // Somente ERP
    (result.somente_erp || []).forEach(e => {
      items.push({
        status: 'SOMENTE_ERP',
        numero_erp: e.numero || e.rps || '-',
        rps_erp: e.rps || '',
        numero_prefeitura: '-',
        tomador: e.tomador || '-',
        valor_erp: e.valor || 0,
        valor_prefeitura: 0,
        diferenca: e.valor || 0,
        iss_erp: e.valor_iss || 0,
        iss_prefeitura: 0,
        iss_retido: 'N',
        diagnostico: 'Nota presente no ERP mas não localizada na Prefeitura'
      });
    });

    // Somente Prefeitura
    (result.somente_prefeitura || []).forEach(c => {
      items.push({
        status: 'SOMENTE_PREFEITURA',
        numero_erp: '-',
        rps_erp: '',
        numero_prefeitura: c.numero || '-',
        tomador: c.tomador || '-',
        valor_erp: 0,
        valor_prefeitura: c.valor || 0,
        diferenca: c.valor || 0,
        iss_erp: 0,
        iss_prefeitura: c.valor_iss || 0,
        iss_retido: c.iss_retido || 'N',
        diagnostico: 'Nota presente na Prefeitura mas não localizada no ERP'
      });
    });

    result.items = items;
    return result;
  }

  function renderResults(result) {
    result = normalizeResult(result);
    const resumo = result.resumo;
    document.getElementById('statTotalAudited').textContent = formatCurrency(resumo.total_erp_valor);
    document.getElementById('statTotalCount').textContent = `${resumo.total_erp_qtd} notas no ERP | ${resumo.total_prefeitura_qtd} na Prefeitura`;

    document.getElementById('statMatchedVal').textContent = formatCurrency(resumo.conciliados_valor);
    document.getElementById('statMatchedCount').textContent = `${resumo.conciliados_qtd} notas coincidentes`;

    document.getElementById('statDivergentVal').textContent = formatCurrency(resumo.divergentes_valor);
    document.getElementById('statDivergentCount').textContent = `${resumo.divergentes_qtd} notas com diferença > R$ 0,04`;

    document.getElementById('statAccuracy').textContent = `${resumo.taxa_assertividade}%`;

    document.getElementById('countAll').textContent = result.items.length;
    document.getElementById('countMatched').textContent = result.items.filter(i => i.status === 'CONCILIADO').length;
    document.getElementById('countDivergent').textContent = result.items.filter(i => i.status === 'DIVERGENTE').length;
    document.getElementById('countErpOnly').textContent = result.items.filter(i => i.status === 'SOMENTE_ERP').length;
    document.getElementById('countCityOnly').textContent = result.items.filter(i => i.status === 'SOMENTE_PREFEITURA').length;

    dashboardGrid.style.display = 'grid';
    
    // Processamento da Auditoria Secundária de ISS
    const dashboardIssAudit = document.getElementById('dashboardIssAudit');
    const issHeaders = document.querySelectorAll('.col-iss');
    if (result.auditoria_iss && result.auditoria_iss.ativo) {
      document.getElementById('statIssQtd').textContent = result.auditoria_iss.qtd_analisada;
      document.getElementById('statIssErp').textContent = formatCurrency(result.auditoria_iss.total_iss_erp);
      document.getElementById('statIssPref').textContent = formatCurrency(result.auditoria_iss.total_iss_prefeitura);
      
      const divVal = document.getElementById('statIssDiv');
      const divCount = document.getElementById('statIssDivCount');
      
      const statIssRetidasCount = document.getElementById('statIssRetidasCount');
      if (statIssRetidasCount && result.auditoria_iss.qtd_retidas_erp !== undefined) {
        statIssRetidasCount.textContent = `${result.auditoria_iss.qtd_retidas_erp} notas no ERP | ${result.auditoria_iss.qtd_retidas_pref} na Prefeitura`;
      }
      divVal.textContent = formatCurrency(result.auditoria_iss.valor_divergencias);
      
      if (result.auditoria_iss.valor_divergencias > 0 && result.auditoria_iss.qtd_divergencias === 0) {
        divVal.style.color = '#f59e0b';
        divCount.textContent = 'Diferença de ISS global (apenas um dos relatórios)';
      } else if (result.auditoria_iss.qtd_divergencias > 0) {
        divVal.style.color = 'var(--status-danger-text)';
        divCount.textContent = `${result.auditoria_iss.qtd_divergencias} notas com diferença de ISS`;
      } else {
        divVal.style.color = 'var(--status-success-text)';
        divCount.textContent = 'Nenhuma divergência de ISS';
      }
      
      if(dashboardIssAudit) dashboardIssAudit.style.display = 'grid';
      issHeaders.forEach(th => th.style.display = '');
    } else {
      if(dashboardIssAudit) dashboardIssAudit.style.display = 'none';
      issHeaders.forEach(th => th.style.display = 'none');
    }

    resultsSection.style.display = 'block';
    
    document.getElementById('uploadFormContainer').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'flex';

    renderChart(result.items);

    filterAndRenderTable();
  }

  function renderChart(items) {
    const ctx = document.getElementById('accuracyChart').getContext('2d');
    
    const countMatched = items.filter(i => i.status === 'CONCILIADO').length;
    const countDivergent = items.filter(i => i.status === 'DIVERGENTE').length;
    const countErpOnly = items.filter(i => i.status === 'SOMENTE_ERP').length;
    const countCityOnly = items.filter(i => i.status === 'SOMENTE_PREFEITURA').length;

    if (accuracyChartInstance) {
      accuracyChartInstance.destroy();
    }
    
    // Registra o plugin de datalabels (carregado via CDN)
    if (typeof ChartDataLabels !== 'undefined') {
      Chart.register(ChartDataLabels);
    }

    // Plugin customizado para desenhar a linha de chamada (callout) dos rótulos externos
    const calloutLinesPlugin = {
      id: 'calloutLines',
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        const sum = dataset.data.reduce((a, b) => a + b, 0);

        meta.data.forEach((arc, index) => {
          const value = dataset.data[index];
          if (value === 0) return;
          const percentage = (value * 100 / sum);
          
          if (percentage > 0 && percentage < 5) {
            const angle = (arc.startAngle + arc.endAngle) / 2;
            const xCenter = arc.x;
            const yCenter = arc.y;
            const outerRadius = arc.outerRadius;
            
            const xEdge = xCenter + Math.cos(angle) * outerRadius;
            const yEdge = yCenter + Math.sin(angle) * outerRadius;
            
            const offsetAmount = 20 + (index * 15);
            const lineLength = offsetAmount;
            
            const xTarget = xCenter + Math.cos(angle) * (outerRadius + lineLength);
            const yTarget = yCenter + Math.sin(angle) * (outerRadius + lineLength);
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(xEdge, yEdge);
            ctx.lineTo(xTarget, yTarget);
            
            // Adiciona um pequeno traço horizontal na direção da ponta para melhor estética
            const sign = Math.cos(angle) >= 0 ? 1 : -1;
            const endX = xTarget + (15 * sign);
            ctx.lineTo(endX, yTarget);
            
            ctx.strokeStyle = dataset.backgroundColor[index]; // Linha na cor da fatia
            ctx.lineWidth = 1.2;
            ctx.stroke();
            
            // Desenha o texto do percentual na ponta da linha
            ctx.fillStyle = dataset.backgroundColor[index]; // Cor do texto igual à fatia
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.textAlign = sign > 0 ? 'left' : 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(percentage.toFixed(0) + "%", endX + (5 * sign), yTarget);
            
            ctx.restore();
          }
        });
      }
    };

    accuracyChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Conciliado', 'Divergente', 'Apenas ERP', 'Apenas Prefeitura'],
        datasets: [{
          data: [countMatched, countDivergent, countErpOnly, countCityOnly],
          backgroundColor: [
            '#34d399', // status-success-text
            '#f87171', // status-danger-text
            '#fbbf24', // status-warning-text
            '#f59e0b'  // status-warning-text darker
          ],
          borderWidth: 0,
          hoverOffset: 4,
          radius: '90%',
          cutout: '55%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 60,
            bottom: 0,
            left: 40,
            right: 40
          }
        },
        plugins: {
          legend: {
            display: false
          },
          datalabels: {
            color: '#ffffff',
            anchor: 'center',
            align: 'center',
            font: {
              weight: 'bold',
              family: 'Inter',
              size: 14
            },
            formatter: (value, context) => {
              if (value === 0) return null; 
              let sum = context.dataset.data.reduce((a, b) => a + b, 0);
              if (sum === 0) return null;
              let percentageValue = (value * 100 / sum);
              // Como estamos desenhando os menores que 5% manualmente com as linhas,
              // ocultamos eles aqui no plugin padrão.
              if (percentageValue < 5) return null;
              return percentageValue.toFixed(0) + "%";
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 10,
            cornerRadius: 8
          }
        }
      },
      plugins: [calloutLinesPlugin]
    });

    // Custom Legend Rendering
    const legendContainer = document.getElementById('customLegend');
    const colors = ['#34d399', '#f87171', '#fbbf24', '#f59e0b'];
    const labels = ['Conciliado', 'Divergente', 'Apenas ERP', 'Apenas Prefeitura'];
    
    legendContainer.innerHTML = labels.map((label, index) => `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${colors[index]}"></div>
        <span>${label}</span>
      </div>
    `).join('');
  }

  function filterAndRenderTable() {
    if (!currentReconciliationData) return;

    const searchTerm = searchInput.value.toLowerCase().strip ? searchInput.value.toLowerCase().trim() : '';
    tableBody.innerHTML = '';

    const filtered = currentReconciliationData.items.filter(item => {
      const matchesTab = (activeTab === 'all') ||
        (activeTab === 'matched' && item.status === 'CONCILIADO') ||
        (activeTab === 'divergent' && item.status === 'DIVERGENTE') ||
        (activeTab === 'erp_only' && item.status === 'SOMENTE_ERP') ||
        (activeTab === 'city_only' && item.status === 'SOMENTE_PREFEITURA');

      const itemStr = `${item.numero_erp} ${item.numero_prefeitura} ${item.tomador} ${item.valor_erp} ${item.valor_prefeitura}`.toLowerCase();
      const matchesSearch = !searchTerm || itemStr.includes(searchTerm);

      return matchesTab && matchesSearch;
    });

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      let statusBadge = '';
      if (item.status === 'CONCILIADO') {
        statusBadge = '<span class="badge badge-matched">🟢 Conciliado</span>';
      } else if (item.status === 'DIVERGENTE') {
        statusBadge = '<span class="badge badge-divergent">🔴 Divergência</span>';
      } else if (item.status === 'SOMENTE_ERP') {
        statusBadge = '<span class="badge badge-erp-only">⚠️ Apenas ERP</span>';
      } else {
        statusBadge = '<span class="badge badge-city-only">⚠️ Apenas Prefeitura</span>';
      }
      
      let issCols = '';
      if (currentReconciliationData.auditoria_iss && currentReconciliationData.auditoria_iss.ativo) {
        let isRetido = (item.iss_retido === 'S' || item.iss_retido === 'SIM' || item.iss_retido === 'Y' || item.iss_retido === '1');
        
        let dispIssErp = 0;
        let dispIssPref = 0;
        let diffIss = 0;
        let issColor = '';

        if (isRetido) {
          dispIssErp = item.iss_erp || 0;
          dispIssPref = item.iss_prefeitura || 0;
          diffIss = Math.abs(dispIssErp - dispIssPref);
          if (diffIss > 0.04) {
            issColor = 'color: var(--status-danger-text); font-weight: bold;';
          }
        }
        
        issCols = `
          <td style="${issColor}">${formatCurrency(dispIssErp)}</td>
          <td style="${issColor}">${formatCurrency(dispIssPref)}</td>
          <td style="${issColor}">${formatCurrency(diffIss)}</td>
        `;
      }

      tr.innerHTML = `
        <td>${statusBadge}</td>
        <td><strong>${item.numero_erp || item.rps_erp || '-'}</strong></td>
        <td>${item.numero_prefeitura || '-'}</td>
        <td>${item.tomador || '-'}</td>
        <td>${formatCurrency(item.valor_erp || 0)}</td>
        <td>${formatCurrency(item.valor_prefeitura || 0)}</td>
        <td style="color: ${item.diferenca > 0.04 ? 'var(--status-danger-text)' : 'var(--text-muted)'}">
          ${formatCurrency(item.diferenca || 0)}
        </td>
        ${issCols}
        <td><small style="color: var(--text-muted);">${item.diagnostico || '-'}</small></td>
      `;

      tableBody.appendChild(tr);
    });
  }

  tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab');
      filterAndRenderTable();
    });
  });

  searchInput.addEventListener('input', () => {
    filterAndRenderTable();
  });

  function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  }
});
