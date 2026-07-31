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
    runBatchAnalysis('/api/reconcile-batch-demo', null);
  });

  // Upload Lote ZIP
  btnStartBatchAudit.addEventListener('click', async () => {
    if (!selectedZipFile) {
      alert('Por favor, selecione ou arraste um arquivo compactado (.ZIP) com os relatórios das prefeituras.');
      return;
    }
    const formData = new FormData();
    formData.append('zip_file', selectedZipFile);
    runBatchAnalysis('/api/reconcile-batch', formData);
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
      const response = await fetch('/api/reconcile-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: selectedCity })
      });

      const data = await response.json();
      await finishSmoothProgress();

      if (data.success) {
        currentReconciliationData = data.result;
        renderResults(data.result);
      } else {
        alert(data.error || 'Erro ao processar modelo.');
      }
    } catch (err) {
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      hideProgressModal();
      alert('Erro ao conectar ao servidor local.');
    }
  });

  btnStartAudit.addEventListener('click', async () => {
    const selectedCity = document.getElementById('citySelect').value;
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

      const response = await fetch('/api/reconcile', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      await finishSmoothProgress();

      if (data.success) {
        currentReconciliationData = data.result;
        renderResults(data.result);
      } else {
        alert(data.error || 'Falha na auditoria.');
      }
    } catch (err) {
      if (activeProgressTimer) clearInterval(activeProgressTimer);
      hideProgressModal();
      alert('Erro na comunicação com o servidor.');
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
    resultsSection.style.display = 'none';
    tableBody.innerHTML = '';
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
      
      // Progressão suave e perfeitamente cadenciada proporcional ao tempo real de execução:
      // Evolui constantemente a cada segundo sem dar saltos abruptos ou parar em 99%
      let target = 0;
      if (elapsedSec <= 15) {
        target = (elapsedSec / 15) * 20; // 0% a 20% nos primeiros 15s
      } else if (elapsedSec <= 45) {
        target = 20 + ((elapsedSec - 15) / 30) * 35; // 20% a 55% entre 15s e 45s
      } else if (elapsedSec <= 85) {
        target = 55 + ((elapsedSec - 45) / 40) * 33; // 55% a 88% entre 45s e 85s
      } else if (elapsedSec <= 120) {
        target = 88 + ((elapsedSec - 85) / 35) * 9; // 88% a 97% até 2 minutos
      } else {
        target = 97 + Math.min(2.5, (elapsedSec - 120) * 0.02); // >2min: 97.1%, 97.2%... avanço constante
      }

      currentPercentValue = Math.min(99.2, Math.max(currentPercentValue + 0.05, target));

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
    }, 100);
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

  function renderResults(result) {
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
    resultsSection.style.display = 'block';

    filterAndRenderTable();
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
