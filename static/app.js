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
  const balanceteFileInput = document.getElementById('balanceteFileInput');
  const erpFileStatus = document.getElementById('erpFileStatus');
  const cityFileStatus = document.getElementById('cityFileStatus');
  const balanceteFileStatus = document.getElementById('balanceteFileStatus');
  
  const btnStartAudit = document.getElementById('btnStartAudit');

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
    'iss-tomados': { reconciliationData: null, batchData: null },
    irrf: { reconciliationData: null, batchData: null },
    csrf: { reconciliationData: null, batchData: null }
  };

  const fileState = {
    prestados: { erpFile: null, cityFile: null, zipFile: null, erpText: 'Nenhum arquivo selecionado', cityText: 'Nenhum arquivo selecionado', zipText: 'Nenhum arquivo compactado selecionado', erpActive: false, cityActive: false, zipActive: false },
    tomados: { erpFile: null, cityFile: null, zipFile: null, erpText: 'Nenhum arquivo selecionado', cityText: 'Nenhum arquivo selecionado', zipText: 'Nenhum arquivo compactado selecionado', erpActive: false, cityActive: false, zipActive: false },
    irrf: { sf1File: null, agluFile: null, r4020File: null, sf1Text: 'Nenhum arquivo selecionado', agluText: 'Nenhum arquivo selecionado', r4020Text: 'Nenhum arquivo selecionado' },
    csrf: { se2File: null, agluFile: null, r4020File: null, se2Text: 'Nenhum arquivo selecionado', agluText: 'Nenhum arquivo selecionado', r4020Text: 'Nenhum arquivo selecionado' }
  };

  function getFileGroup(mode) {
    if (mode === 'irrf') return 'irrf';
    if (mode === 'csrf') return 'csrf';
    return mode === 'iss-tomados' ? 'tomados' : 'prestados';
  }

  // IRRF Elements
  const sf1FileInput = document.getElementById('sf1-file');
  const agluFileInput = document.getElementById('aglu-file');
  const r4020FileInput = document.getElementById('r4020-file');
  const se2CsrfFileInput = document.getElementById('se2-file');
  const agluCsrfFileInput = document.getElementById('aglu-csrf-file');
  const r4020CsrfFileInput = document.getElementById('r4020-csrf-file');
  const sf1FileName = document.getElementById('sf1FileStatus');
  const agluFileName = document.getElementById('agluFileStatus');
  const r4020FileName = document.getElementById('r4020FileStatus');
  const btnStartIrrfAudit = document.getElementById('reconcile-irrf-btn');
  const btnStartCsrfAudit = document.getElementById('reconcile-csrf-btn');

  let selectedSf1File = null;
  let selectedAgluFile = null;
  let selectedR4020File = null;

  let selectedSe2CsrfFile = null;
  let selectedAgluCsrfFile = null;
  let selectedR4020CsrfFile = null;
  const se2CsrfFileName = document.getElementById('se2FileStatus');
  const agluCsrfFileName = document.getElementById('agluCsrfFileStatus');
  const r4020CsrfFileName = document.getElementById('r4020CsrfFileStatus');

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
      if (currentMode === 'irrf') {
        fileState[fgOld].sf1File = selectedSf1File;
        fileState[fgOld].agluFile = selectedAgluFile;
        fileState[fgOld].r4020File = selectedR4020File;
        fileState[fgOld].sf1Text = sf1FileName ? sf1FileName.textContent : 'Nenhum arquivo selecionado';
        fileState[fgOld].agluText = agluFileName ? agluFileName.textContent : 'Nenhum arquivo selecionado';
        fileState[fgOld].r4020Text = r4020FileName ? r4020FileName.textContent : 'Nenhum arquivo selecionado';
      } else if (currentMode === 'csrf') {
        fileState[fgOld].se2File = selectedSe2CsrfFile;
        fileState[fgOld].agluCsrfFile = selectedAgluCsrfFile;
        fileState[fgOld].r4020CsrfFile = selectedR4020CsrfFile;
        fileState[fgOld].se2Text = se2CsrfFileName ? se2CsrfFileName.textContent : 'Nenhum arquivo selecionado';
        fileState[fgOld].agluCsrfText = agluCsrfFileName ? agluCsrfFileName.textContent : 'Nenhum arquivo selecionado';
        fileState[fgOld].r4020CsrfText = r4020CsrfFileName ? r4020CsrfFileName.textContent : 'Nenhum arquivo selecionado';
      } else {
        fileState[fgOld].erpFile = selectedErpFile;
        fileState[fgOld].cityFile = selectedCityFile;
        fileState[fgOld].zipFile = selectedZipFile;
        fileState[fgOld].erpText = erpFileStatus.textContent;
        fileState[fgOld].cityText = cityFileStatus.textContent;
        fileState[fgOld].zipText = zipFileStatus.textContent;
        fileState[fgOld].erpActive = erpFileStatus.classList.contains('active');
        fileState[fgOld].cityActive = cityFileStatus.classList.contains('active');
        fileState[fgOld].zipActive = zipFileStatus.classList.contains('active');
      }

      const mod = item.getAttribute('data-module');
      const uploadGridContainer = document.getElementById('uploadGridContainer');
      const uploadGridIrrf = document.getElementById('uploadGridIrrf');
      const dropzoneBalancete = document.getElementById('dropzoneBalancete');
      const cityBadgeSelect = document.querySelector('.city-badge-select');
      
      const btnBatchModal = document.getElementById('btnBatchModal');
      const btnStartAudit = document.getElementById('btnStartAudit');
      const btnStartIrrf = document.getElementById('reconcile-irrf-btn');
      const btnStartCsrf = document.getElementById('reconcile-csrf-btn');
      
      const resultsSection = document.getElementById('resultsSection');
      const irrfResultsSection = document.getElementById('irrf-results');
      const csrfResultsSection = document.getElementById('csrf-results');

      if (mod === 'irrf') {
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
      } else {
        if (uploadGridContainer) uploadGridContainer.style.display = 'grid';
        if (uploadGridIrrf) uploadGridIrrf.style.display = 'none';
        const uploadGridCsrf = document.getElementById('uploadGridCsrf');
        if (uploadGridCsrf) uploadGridCsrf.style.display = 'none';
        
        if (cityBadgeSelect) cityBadgeSelect.style.display = 'flex';
        
        if (btnBatchModal) btnBatchModal.parentElement.style.display = 'flex';
        if (btnStartAudit) btnStartAudit.style.display = 'inline-flex';
        if (btnStartIrrf) btnStartIrrf.style.display = 'none';
        if (btnStartCsrf) btnStartCsrf.style.display = 'none';
        
        if (irrfResultsSection) irrfResultsSection.style.display = 'none';
        if (csrfResultsSection) csrfResultsSection.style.display = 'none';
        if (resultsSection && moduleState[currentMode].reconciliationData) {
            resultsSection.style.display = 'block';
        } else if (resultsSection) {
            resultsSection.style.display = 'none';
        }

        // Restaurar cabeçalhos padrão e tabs ao sair do modo IRRF
        const theadRestore = document.querySelector('#resultsSection thead tr');
        if (theadRestore) {
          theadRestore.innerHTML = `
            <th>Status</th>
            <th>Ref. ERP (RPS/Nota)</th>
            <th>Nota Prefeitura</th>
            <th>Tomador (ERP)</th>
            <th>Valor ERP (R$)</th>
            <th>Base Calc. Prefeitura (R$)</th>
            <th>Diferença (R$)</th>
            <th class="col-iss" style="display: none;">ISS Retido ERP (R$)</th>
            <th class="col-iss" style="display: none;">ISS Retido Prefeitura (R$)</th>
            <th class="col-iss" style="display: none;">Diferença ISS (R$)</th>
            <th>Diagnóstico</th>
          `;
        }
        const tabErpOnlyRestore = document.querySelector('.tab-btn[data-tab="erp_only"]');
        const tabCityOnlyRestore = document.querySelector('.tab-btn[data-tab="city_only"]');
        if (tabErpOnlyRestore) tabErpOnlyRestore.innerHTML = `⚠️ Apenas ERP (<span id="countErpOnly">0</span>)`;
        if (tabCityOnlyRestore) tabCityOnlyRestore.style.display = '';


        if (mod === 'iss-prestados') {
          currentMode = 'iss';
          document.getElementById('moduleTitle').textContent = 'Conferência ISS - Serviços Prestados';
          document.getElementById('moduleSub').textContent = 'Auditoria do Imposto Devido (ERP) vs ISS Apurado (Prefeitura)';
          const h2Iss = document.querySelector('.upload-section h2');
          if (h2Iss) h2Iss.textContent = '🏛️ Importação dos Arquivos Fiscais (ISS)';
          const h3Iss = document.querySelector('.modal-title-group h3');
          if (h3Iss) h3Iss.textContent = 'Conferência de ISS em Lote';
          if (dropzoneBalancete) dropzoneBalancete.style.display = 'none';
          if (uploadGridContainer) uploadGridContainer.classList.remove('upload-grid-3');
        } else if (mod === 'iss-tomados') {
          currentMode = 'iss-tomados';
          document.getElementById('moduleTitle').textContent = 'Conferência ISS - Serviços Tomados';
          document.getElementById('moduleSub').textContent = 'Auditoria de ISS Retido na Fonte (Tomador)';
          const h2Tomados = document.querySelector('.upload-section h2');
          if (h2Tomados) h2Tomados.textContent = '🏢 Importação dos Arquivos Fiscais (Tomados)';
          const h3Tomados = document.querySelector('.modal-title-group h3');
          if (h3Tomados) h3Tomados.textContent = 'Conferência de Tomados em Lote';
          if (dropzoneBalancete) dropzoneBalancete.style.display = 'none';
          if (uploadGridContainer) uploadGridContainer.classList.remove('upload-grid-3');
        } else {
          currentMode = 'faturamento';
          document.getElementById('moduleTitle').textContent = 'Conferência de Faturamento Fiscal';
          document.getElementById('moduleSub').textContent = 'Automação e Auditoria de Notas Fiscais Emitidas (ERP vs Prefeituras)';
          const h2Fat = document.querySelector('.upload-section h2');
          if (h2Fat) h2Fat.textContent = '📁 Importação dos Arquivos Fiscais';
          const h3Fat = document.querySelector('.modal-title-group h3');
          if (h3Fat) h3Fat.textContent = 'Conferência de Faturamento em Lote';
          if (dropzoneBalancete) dropzoneBalancete.style.display = '';
          if (uploadGridContainer) uploadGridContainer.classList.add('upload-grid-3');
        }
      }
      
      // Restaura o estado salvo do módulo escolhido
      currentReconciliationData = moduleState[currentMode].reconciliationData;
      currentBatchData = moduleState[currentMode].batchData;
      
      let fgNew = getFileGroup(currentMode);
      if (currentMode === 'irrf') {
        selectedSf1File = fileState[fgNew].sf1File;
        selectedAgluFile = fileState[fgNew].agluFile;
        selectedR4020File = fileState[fgNew].r4020File;
        if(sf1FileName) sf1FileName.textContent = fileState[fgNew].sf1Text || 'Nenhum arquivo selecionado';
        if(agluFileName) agluFileName.textContent = fileState[fgNew].agluText || 'Nenhum arquivo selecionado';
        if(r4020FileName) r4020FileName.textContent = fileState[fgNew].r4020Text || 'Nenhum arquivo selecionado';

        if (currentReconciliationData) {
          renderIrrfResults(currentReconciliationData);
        } else {
          dashboardGrid.style.display = 'none';
          const dashboardIssAudit = document.getElementById('dashboardIssAudit');
          if (dashboardIssAudit) dashboardIssAudit.style.display = 'none';
          const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
          if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display = 'none';
          resultsSection.style.display = 'none';
          document.getElementById('uploadFormContainer').style.display = 'block';
          document.getElementById('chartContainer').style.display = 'none';
          tableBody.innerHTML = '';
          const irrfResults = document.getElementById('irrf-results');
          if (irrfResults) irrfResults.style.display = 'none';
        }
      } else if (currentMode === 'csrf') {
        selectedSe2CsrfFile = fileState[fgNew].se2File;
        selectedAgluCsrfFile = fileState[fgNew].agluCsrfFile;
        selectedR4020CsrfFile = fileState[fgNew].r4020CsrfFile;
        if(se2CsrfFileName) se2CsrfFileName.textContent = fileState[fgNew].se2Text || 'Nenhum arquivo selecionado';
        if(agluCsrfFileName) agluCsrfFileName.textContent = fileState[fgNew].agluCsrfText || 'Nenhum arquivo selecionado';
        if(r4020CsrfFileName) r4020CsrfFileName.textContent = fileState[fgNew].r4020CsrfText || 'Nenhum arquivo selecionado';

        if (currentReconciliationData) {
          renderCsrfResults(currentReconciliationData);
        } else {
          dashboardGrid.style.display = 'none';
          const dashboardIssAudit = document.getElementById('dashboardIssAudit');
          if (dashboardIssAudit) dashboardIssAudit.style.display = 'none';
          const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
          if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display = 'none';
          resultsSection.style.display = 'none';
          document.getElementById('uploadFormContainer').style.display = 'block';
          document.getElementById('chartContainer').style.display = 'none';
          tableBody.innerHTML = '';
          const csrfResultsSection = document.getElementById('csrf-results');
          if (csrfResultsSection) csrfResultsSection.style.display = 'none';
        }
      } else {
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
          const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
          if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display = 'none';
          resultsSection.style.display = 'none';
          document.getElementById('uploadFormContainer').style.display = 'block';
          document.getElementById('chartContainer').style.display = 'none';
          tableBody.innerHTML = '';
        }
      }
      
      // Nota: Não chamamos mais btnResetAll.click() para preservar os arquivos selecionados
    });
  });

  // ========================================================
  // GERENCIAMENTO DE TEMA (LIGHT / DARK MODE)
  // ========================================================
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
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
  const dropzoneBalancete = document.getElementById('dropzoneBalancete');
  const dropzoneSf1 = document.getElementById('dropzoneSf1');
  const dropzoneAglu = document.getElementById('dropzoneAglu');
  const dropzoneR4020 = document.getElementById('dropzoneR4020');

  [dropzoneErp, dropzoneCity, dropzoneZip, dropzoneBalancete, dropzoneSf1, dropzoneAglu, dropzoneR4020].forEach(zone => {
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

  if (dropzoneBalancete) {
    dropzoneBalancete.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneBalancete.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        balanceteFileInput.files = e.dataTransfer.files;
        balanceteFileStatus.textContent = `📑 ${e.dataTransfer.files[0].name}`;
        balanceteFileStatus.classList.add('active');
      }
    });
  }

  dropzoneZip.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneZip.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedZipFile = e.dataTransfer.files[0];
      zipFileStatus.textContent = `📦 ${selectedZipFile.name}`;
      zipFileStatus.classList.add('active');
    }
  });

  if (dropzoneSf1) {
    dropzoneSf1.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneSf1.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        sf1FileInput.files = e.dataTransfer.files;
        selectedSf1File = e.dataTransfer.files[0];
        sf1FileName.textContent = `📊 ${selectedSf1File.name}`;
        sf1FileName.classList.add('active');
      }
    });
    dropzoneSf1.addEventListener('click', () => sf1FileInput.click());
    sf1FileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        selectedSf1File = e.target.files[0];
        sf1FileName.textContent = `📊 ${selectedSf1File.name}`;
        sf1FileName.classList.add('active');
      }
    });
  }

  if (dropzoneAglu) {
    dropzoneAglu.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneAglu.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        agluFileInput.files = e.dataTransfer.files;
        selectedAgluFile = e.dataTransfer.files[0];
        agluFileName.textContent = `📄 ${selectedAgluFile.name}`;
        agluFileName.classList.add('active');
      }
    });
    dropzoneAglu.addEventListener('click', () => agluFileInput.click());
    agluFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        selectedAgluFile = e.target.files[0];
        agluFileName.textContent = `📄 ${selectedAgluFile.name}`;
        agluFileName.classList.add('active');
      }
    });
  }

  if (dropzoneR4020) {
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
  }

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
  }

  dropzoneErp.addEventListener('click', () => erpFileInput.click());
  dropzoneCity.addEventListener('click', () => cityFileInput.click());
  dropzoneZip.addEventListener('click', () => zipFileInput.click());
  if (dropzoneBalancete) {
    dropzoneBalancete.addEventListener('click', () => balanceteFileInput.click());
  }

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

  if (balanceteFileInput) {
    balanceteFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        balanceteFileStatus.textContent = `📑 ${e.target.files[0].name}`;
        balanceteFileStatus.classList.add('active');
      }
    });
  }

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
      formData.append('erp_file', erpFileInput.files[0]);
      formData.append('city_file', cityFileInput.files[0]);
      if (currentMode === 'faturamento' && balanceteFileInput && balanceteFileInput.files.length > 0) {
        formData.append('balancete_file', balanceteFileInput.files[0]);
      }
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
    selectedSf1File = null;
    selectedAgluFile = null;
    selectedR4020File = null;
    selectedSe2CsrfFile = null;
    selectedAgluCsrfFile = null;
    selectedR4020CsrfFile = null;
    currentReconciliationData = null;
    erpFileInput.value = '';
    cityFileInput.value = '';
    if (balanceteFileInput) {
      balanceteFileInput.value = '';
      balanceteFileStatus.textContent = 'Nenhum arquivo selecionado';
      balanceteFileStatus.classList.remove('active');
    }
    if (sf1FileInput) sf1FileInput.value = '';
    if (agluFileInput) agluFileInput.value = '';
    if (r4020FileInput) r4020FileInput.value = '';
    if (se2CsrfFileInput) se2CsrfFileInput.value = '';
    if (agluCsrfFileInput) agluCsrfFileInput.value = '';
    if (r4020CsrfFileInput) r4020CsrfFileInput.value = '';

    erpFileStatus.textContent = 'Nenhum arquivo selecionado';
    cityFileStatus.textContent = 'Nenhum arquivo selecionado';
    erpFileStatus.classList.remove('active');
    cityFileStatus.classList.remove('active');
    
    if (sf1FileName) { sf1FileName.textContent = 'Nenhum arquivo selecionado'; sf1FileName.classList.remove('active'); }
    if (agluFileName) { agluFileName.textContent = 'Nenhum arquivo selecionado'; agluFileName.classList.remove('active'); }
    if (r4020FileName) { r4020FileName.textContent = 'Nenhum arquivo selecionado'; r4020FileName.classList.remove('active'); }
    if (se2CsrfFileName) { se2CsrfFileName.textContent = 'Nenhum arquivo selecionado'; se2CsrfFileName.classList.remove('active'); }
    if (agluCsrfFileName) { agluCsrfFileName.textContent = 'Nenhum arquivo selecionado'; agluCsrfFileName.classList.remove('active'); }
    if (r4020CsrfFileName) { r4020CsrfFileName.textContent = 'Nenhum arquivo selecionado'; r4020CsrfFileName.classList.remove('active'); }
    dashboardGrid.style.display = 'none';
    const dashboardIssAudit = document.getElementById('dashboardIssAudit');
    if (dashboardIssAudit) dashboardIssAudit.style.display = 'none';
    const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
    if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display = 'none';
    resultsSection.style.display = 'none';
    const irrfResults = document.getElementById('irrf-results');
    if (irrfResults) irrfResults.style.display = 'none';
    const csrfResultsSection = document.getElementById('csrf-results');
    if (csrfResultsSection) csrfResultsSection.style.display = 'none';
    document.getElementById('uploadFormContainer').style.display = 'block';
    document.getElementById('chartContainer').style.display = 'none';
    tableBody.innerHTML = '';
    
    // Clear state in cache
    moduleState[currentMode].reconciliationData = null;
    moduleState[currentMode].batchData = null;
    let fg = getFileGroup(currentMode);
    if (fg === 'irrf') {
      fileState[fg].sf1File = null;
      fileState[fg].agluFile = null;
      fileState[fg].r4020File = null;
      fileState[fg].sf1Text = 'Nenhum arquivo selecionado';
      fileState[fg].agluText = 'Nenhum arquivo selecionado';
      fileState[fg].r4020Text = 'Nenhum arquivo selecionado';
      fileState[fg].sf1Active = false;
      fileState[fg].agluActive = false;
      fileState[fg].r4020Active = false;
    } else if (fg === 'csrf') {
      fileState[fg].se2File = null;
      fileState[fg].agluCsrfFile = null;
      fileState[fg].r4020CsrfFile = null;
      fileState[fg].se2Text = 'Nenhum arquivo selecionado';
      fileState[fg].agluCsrfText = 'Nenhum arquivo selecionado';
      fileState[fg].r4020CsrfText = 'Nenhum arquivo selecionado';
      fileState[fg].se2Active = false;
      fileState[fg].agluCsrfActive = false;
      fileState[fg].r4020CsrfActive = false;
    } else {
      fileState[fg].erpFile = null;
      fileState[fg].cityFile = null;
      fileState[fg].zipFile = null;
      fileState[fg].erpText = 'Nenhum arquivo selecionado';
      fileState[fg].cityText = 'Nenhum arquivo selecionado';
      fileState[fg].zipText = 'Nenhum arquivo compactado selecionado';
      fileState[fg].erpActive = false;
      fileState[fg].cityActive = false;
      fileState[fg].zipActive = false;
    }
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
    
    // Lógica do dashboard do Balancete
    if (result.auditoria_balancete && result.auditoria_balancete.ativo) {
      document.getElementById('dashboardBalanceteAudit').style.display = 'grid';
      
      document.getElementById('statBalanceteTotal').textContent = formatCurrency(result.auditoria_balancete.total_balancete);
      
      const cardErp = document.getElementById('cardBalanceteDivErp');
      const cardPref = document.getElementById('cardBalanceteDivPref');
      const statErp = document.getElementById('statBalanceteDivErp');
      const statPref = document.getElementById('statBalanceteDivPref');
      const diffErpText = document.getElementById('statBalanceteDiffErpText');
      const diffPrefText = document.getElementById('statBalanceteDiffPrefText');
      
      statErp.textContent = formatCurrency(result.auditoria_balancete.diferenca_erp);
      statPref.textContent = formatCurrency(result.auditoria_balancete.diferenca_prefeitura);
      
      if (result.auditoria_balancete.diferenca_erp > 0.04) {
        cardErp.classList.add('divergentes');
        statErp.style.color = 'var(--status-danger-text)';
        diffErpText.textContent = `Faturamento ERP: ${formatCurrency(result.auditoria_balancete.total_erp)}`;
      } else {
        cardErp.classList.remove('divergentes');
        statErp.style.color = 'var(--status-success-text)';
        diffErpText.textContent = 'Sem divergência com ERP';
      }

      if (result.auditoria_balancete.diferenca_prefeitura > 0.04) {
        cardPref.classList.add('divergentes');
        statPref.style.color = 'var(--status-danger-text)';
        diffPrefText.textContent = `Apurado Pref: ${formatCurrency(result.auditoria_balancete.total_prefeitura)}`;
      } else {
        cardPref.classList.remove('divergentes');
        statPref.style.color = 'var(--status-success-text)';
        diffPrefText.textContent = 'Sem divergência com Prefeitura';
      }
    } else {
      const balBoard = document.getElementById('dashboardBalanceteAudit');
      if (balBoard) balBoard.style.display = 'none';
    }

    // Preenche os cards de resumo geral
    const statAuditCountEl = document.getElementById('statAuditCount');
    if (statAuditCountEl) statAuditCountEl.textContent = `${result.qtd_total_unicas} notas analisadas`;
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
        const erp = result.auditoria_iss.qtd_retidas_erp;
        const pref = result.auditoria_iss.qtd_retidas_pref;
        const conc = result.auditoria_iss.qtd_conciliadas;
        const pendentes = result.auditoria_iss.qtd_analisada - conc;
        const pendentesText = pendentes === 0 ? "todas conciliadas" : `${pendentes} pendente${pendentes > 1 ? 's' : ''}`;
        
        statIssRetidasCount.textContent = `${erp} no ERP | ${pref} na Pref. (${conc} conciliadas, ${pendentesText})`;
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
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1500,
          easing: 'easeOutQuart'
        },
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

  if (btnStartCsrfAudit) {
    btnStartCsrfAudit.addEventListener('click', async () => {
      if (!selectedSe2CsrfFile || !selectedAgluCsrfFile || !selectedR4020CsrfFile) {
        alert('Por favor, selecione os 3 arquivos (SE2, Aglutinação e R-4020) para a conciliação de CSRF (PCC).');
        return;
      }
      
      const formData = new FormData();
      formData.append('se2_file', selectedSe2CsrfFile);
      formData.append('aglu_file', selectedAgluCsrfFile);
      formData.append('r4020_file', selectedR4020CsrfFile);
      
      startSmoothProgress(
        `Auditoria de CSRF (PCC)`,
        [
          'Lendo relatório base do ERP (SE2)...',
          'Lendo espelho de Aglutinação e R-4020...',
          'Cruzando informações (Nº do Documento, CNPJ)...',
          'Apurando divergências de PIS, COFINS e CSLL...'
        ]
      );
      
      try {
          const response = await fetch('/api/reconcile-csrf', { method: 'POST', body: formData });
          const data = await response.json();
          
          await finishSmoothProgress();
          
          if (data.success) {
              moduleState['csrf'] = moduleState['csrf'] || {};
              moduleState['csrf'].reconciliationData = data.result;
              moduleState['csrf'].batchData = null;
              
              document.getElementById('uploadFormContainer').style.display = 'none';
              const csrfResultsSection = document.getElementById('csrf-results');
              if (csrfResultsSection) csrfResultsSection.style.display = 'block';
              
              renderCsrfResults(data.result);
          } else {
              alert(data.error || 'Falha na auditoria de CSRF.');
          }
      } catch (err) {
          if (activeProgressTimer) clearInterval(activeProgressTimer);
          hideProgressModal();
          alert('Erro ao processar CSRF: ' + (err.message || err));
      }
    });
  }

  if (btnStartIrrfAudit) {
    btnStartIrrfAudit.addEventListener('click', async () => {
      if (!selectedSf1File || !selectedAgluFile || !selectedR4020File) {
        alert('Por favor, selecione os três relatórios (SF1, Aglutinação e R-4020) antes de iniciar a conferência de IRRF.');
        return;
      }

      startSmoothProgress(
        `Auditoria de IRRF`,
        [
          'Lendo relatório base do ERP (SF1)...',
          'Lendo espelho de Aglutinação e R-4020...',
          'Cruzando informações (Nº do Documento, CNPJ)...',
          'Apurando divergências de Retenção de IRRF...'
        ]
      );

      try {
        const formData = new FormData();
        formData.append('sf1_file', selectedSf1File);
        formData.append('aglu_file', selectedAgluFile);
        formData.append('r4020_file', selectedR4020File);

        let response;
        try {
          response = await fetch('/api/reconcile-irrf', { method: 'POST', body: formData });
        } catch (err) {
          hideProgressModal();
          alert('Erro de comunicação com o servidor ao enviar os relatórios de IRRF: ' + (err.message || 'Falha na conexão HTTP'));
          return;
        }


        const data = await response.json();
        await finishSmoothProgress();

        if (data.success) {
          currentReconciliationData = data.result;
          moduleState['irrf'].reconciliationData = data.result;
          renderIrrfResults(data.result);
        } else {
          alert(data.error || 'Falha na auditoria de IRRF.');
        }
      } catch (err) {
        hideProgressModal();
        alert('Erro inesperado: ' + (err.message || err));
      }
    });
  }



  function renderCsrfResults(result) {
    if (!result) return;
    
    if (result._csrf_mode) {
      currentReconciliationData = result;
    } else {
      const detalhes = result.detalhes || [];

      // Mapear dados CSRF para o formato items padrão
      const csrfItems = detalhes.map(item => {
        const se2  = item.valor_erp  || 0;
        const aglu = item.valor_aglu || 0;
        const r40  = item.valor_reinf || 0;
        const diff = Math.abs(item.diferenca) || 0;

        let mappedStatus;
        if (item.status === 'Conciliado')      mappedStatus = 'CONCILIADO';
        else if (item.status === 'Ausente')    mappedStatus = 'SOMENTE_ERP';
        else                                   mappedStatus = 'DIVERGENTE';

        return {
          status: mappedStatus,
          numero_erp: item.numero || '-',
          rps_erp: '',
          numero_prefeitura: '-',
          tomador: item.razao || '-',
          cnpj: item.cnpj || '-',
          valor_erp: se2,
          valor_prefeitura: aglu,
          diferenca: diff,
          csrf_se2: se2,
          csrf_aglu: aglu,
          csrf_r4020: r40,
          diagnostico: item.diagnostico || ''
        };
      });

      const conciliados = csrfItems.filter(d => d.status === 'CONCILIADO').length;
      const divergentes = csrfItems.filter(d => d.status === 'DIVERGENTE').length;
      const ausentes    = csrfItems.filter(d => d.status === 'SOMENTE_ERP').length;
      const total       = csrfItems.length;
      const totalSe2    = csrfItems.reduce((s, d) => s + (d.csrf_se2 || 0), 0);
      const taxa        = total > 0 ? ((conciliados / total) * 100).toFixed(1) : '0.0';

      currentReconciliationData = {
        items: csrfItems,
        _csrf_mode: true,
        resumo: {
          total_erp_qtd: total,
          total_prefeitura_qtd: total,
          total_erp_valor: totalSe2,
          conciliados_qtd: conciliados,
          conciliados_valor: csrfItems.filter(d => d.status === 'CONCILIADO').reduce((s, d) => s + (d.csrf_se2 || 0), 0),
          divergentes_qtd: divergentes + ausentes,
          divergentes_valor: csrfItems.filter(d => d.status !== 'CONCILIADO').reduce((s, d) => s + Math.max(d.csrf_se2||0, d.csrf_aglu||0, d.csrf_r4020||0), 0),
          taxa_assertividade: taxa,
          ausentes_qtd: ausentes,
          divergentes_reais_qtd: divergentes
        }
      };
    }
    
    const resumo = currentReconciliationData.resumo;
    const csrfItems = currentReconciliationData.items;

    // Armazenar no formato padrão com flag de modo CSRF
    // Adaptar tabs: renomear 'Apenas ERP' -> 'Ausentes' e ocultar 'Apenas Prefeitura'
    const tabErpOnly  = document.querySelector('.tab-btn[data-tab="erp_only"]');
    const tabCityOnly = document.querySelector('.tab-btn[data-tab="city_only"]');
    if (tabErpOnly)  tabErpOnly.innerHTML   = `⚠️ Ausentes (<span id="countErpOnly">${resumo.ausentes_qtd}</span>)`;
    if (tabCityOnly) tabCityOnly.style.display = 'none';

    // Adaptar cabeçalhos da tabela para o contexto CSRF
    const thead = document.querySelector('#resultsSection thead tr');
    if (thead) {
      thead.innerHTML = `
        <th>Status</th>
        <th>Documento</th>
        <th>CNPJ</th>
        <th>Razão Social</th>
        <th>PCC ERP (R$)</th>
        <th>PCC Aglu. (R$)</th>
        <th>R-4020 (R$)</th>
        <th>Diferença (R$)</th>
        <th>Diagnóstico</th>
      `;
    }

    // Preencher cards de resumo do dashboardGrid
    const elTotal         = document.getElementById('statTotalAudited');
    const elTotalCount    = document.getElementById('statTotalCount');
    const elMatchedVal    = document.getElementById('statMatchedVal');
    const elMatchedCount  = document.getElementById('statMatchedCount');
    const elDivVal        = document.getElementById('statDivergentVal');
    const elDivCount      = document.getElementById('statDivergentCount');
    const elAccuracy      = document.getElementById('statAccuracy');
    const elCountAll      = document.getElementById('countAll');
    const elCountMatched  = document.getElementById('countMatched');
    const elCountDivergent = document.getElementById('countDivergent');
    const elCountErpOnly  = document.getElementById('countErpOnly');

    if (elTotal)          elTotal.textContent        = formatCurrency(resumo.total_erp_valor);
    if (elTotalCount)     elTotalCount.textContent    = `${resumo.total_erp_qtd} documentos analisados (3 relatórios cruzados)`;
    if (elMatchedVal)     elMatchedVal.textContent    = `${resumo.conciliados_qtd}`;
    if (elMatchedCount)   elMatchedCount.textContent  = 'Sem divergências (SE2 = Aglu. = R-4020)';
    if (elDivVal)         elDivVal.textContent        = `${resumo.divergentes_qtd}`;
    if (elDivCount)       elDivCount.textContent      = `${resumo.ausentes_qtd} ausentes + ${resumo.divergentes_reais_qtd} com divergência`;
    if (elAccuracy)       elAccuracy.textContent      = `${resumo.taxa_assertividade}%`;
    if (elCountAll)       elCountAll.textContent      = resumo.total_erp_qtd;
    if (elCountMatched)   elCountMatched.textContent  = resumo.conciliados_qtd;
    if (elCountDivergent) elCountDivergent.textContent = resumo.divergentes_reais_qtd;
    if (elCountErpOnly)   elCountErpOnly.textContent  = resumo.ausentes_qtd;

    // Ocultar painéis exclusivos de outros módulos
    const dashboardIssAudit      = document.getElementById('dashboardIssAudit');
    const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
    if (dashboardIssAudit)       dashboardIssAudit.style.display       = 'none';
    if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display  = 'none';

    // Exibir a UI padrão (igual aos outros módulos)
    dashboardGrid.style.display = 'grid';
    document.getElementById('uploadFormContainer').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'flex';
    resultsSection.style.display = 'block';

    // Gerar gráfico de rosca
    renderChart(csrfItems);

    // Renderizar tabela CSRF
    filterAndRenderCsrfTable();
  }

  // Tabela no modo CSRF
  function filterAndRenderCsrfTable() {
    if (!currentReconciliationData || !currentReconciliationData._csrf_mode) return;

    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    tableBody.innerHTML = '';

    const filtered = currentReconciliationData.items.filter(item => {
      const matchesTab =
        (activeTab === 'all') ||
        (activeTab === 'matched'   && item.status === 'CONCILIADO') ||
        (activeTab === 'divergent' && item.status === 'DIVERGENTE') ||
        (activeTab === 'erp_only'  && item.status === 'SOMENTE_ERP');

      const itemStr = `${item.numero_erp} ${item.cnpj} ${item.tomador}`.toLowerCase();
      return matchesTab && (!searchTerm || itemStr.includes(searchTerm));
    });

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      let statusBadge = '';
      if (item.status === 'CONCILIADO') {
        statusBadge = '<span class="status-badge status-conciliado"><i class="fas fa-check-circle"></i> Conciliado</span>';
      } else if (item.status === 'DIVERGENTE') {
        statusBadge = '<span class="status-badge status-divergente"><i class="fas fa-exclamation-triangle"></i> Divergente</span>';
      } else if (item.status === 'SOMENTE_ERP') {
        statusBadge = '<span class="status-badge status-somente-erp"><i class="fas fa-file-invoice"></i> Ausente</span>';
      } else {
        statusBadge = `<span class="status-badge" style="background-color: var(--border-color);">${item.status}</span>`;
      }

      tr.innerHTML = `
        <td>${statusBadge}</td>
        <td><strong>${item.numero_erp || item.rps_erp || '-'}</strong></td>
        <td>${item.cnpj || '-'}</td>
        <td>${item.tomador || '-'}</td>
        <td>${formatCurrency(item.csrf_se2 || 0)}</td>
        <td>${formatCurrency(item.csrf_aglu || 0)}</td>
        <td>${formatCurrency(item.csrf_r4020 || 0)}</td>
        <td style="color: ${item.diferenca > 0.04 ? 'var(--status-danger-text)' : 'var(--text-muted)'}">
          ${formatCurrency(item.diferenca || 0)}
        </td>
        <td><small style="color: var(--text-muted);">${item.diagnostico || '-'}</small></td>
      `;

      tableBody.appendChild(tr);
    });
  }

  function renderIrrfResults(result) {
    if (!result) return;
    
    if (result._irrf_mode) {
      currentReconciliationData = result;
    } else {
      const detalhes = result.detalhes || [];

      // Mapear dados IRRF para o formato items padrão
      const irrfItems = detalhes.map(item => {
        const sf1  = item.irrf_sf1  || 0;
        const aglu = item.irrf_aglu || 0;
        const r40  = item.irrf_r4020 || 0;
        const maxV = Math.max(sf1, aglu, r40);
        const minV = Math.min(sf1, aglu, r40);
        const diff = maxV - minV;

        let mappedStatus;
        if (item.status === 'Conciliado')      mappedStatus = 'CONCILIADO';
        else if (item.status === 'Ausente')    mappedStatus = 'SOMENTE_ERP';
        else                                   mappedStatus = 'DIVERGENTE';

        return {
          status: mappedStatus,
          numero_erp: item.numero || '-',
          rps_erp: '',
          numero_prefeitura: '-',
          tomador: item.razao || '-',
          cnpj: item.cnpj || '-',
          valor_erp: sf1,
          valor_prefeitura: aglu,
          diferenca: diff,
          irrf_sf1: sf1,
          irrf_aglu: aglu,
          irrf_r4020: r40,
          diagnostico: item.status === 'Conciliado' ? 'Três bases conciliadas' :
                       item.status === 'Ausente'    ? 'Ausente em um dos relatórios' :
                                                     'Divergência entre os três relatórios'
        };
      });

      const conciliados = irrfItems.filter(d => d.status === 'CONCILIADO').length;
      const divergentes = irrfItems.filter(d => d.status === 'DIVERGENTE').length;
      const ausentes    = irrfItems.filter(d => d.status === 'SOMENTE_ERP').length;
      const total       = irrfItems.length;
      const totalSf1    = irrfItems.reduce((s, d) => s + (d.irrf_sf1 || 0), 0);
      const taxa        = total > 0 ? ((conciliados / total) * 100).toFixed(1) : '0.0';

      currentReconciliationData = {
        items: irrfItems,
        _irrf_mode: true,
        resumo: {
          total_erp_qtd: total,
          total_prefeitura_qtd: total,
          total_erp_valor: totalSf1,
          conciliados_qtd: conciliados,
          conciliados_valor: irrfItems.filter(d => d.status === 'CONCILIADO').reduce((s, d) => s + (d.irrf_sf1 || 0), 0),
          divergentes_qtd: divergentes + ausentes,
          divergentes_valor: irrfItems.filter(d => d.status !== 'CONCILIADO').reduce((s, d) => s + Math.max(d.irrf_sf1||0, d.irrf_aglu||0, d.irrf_r4020||0), 0),
          taxa_assertividade: taxa,
          ausentes_qtd: ausentes,
          divergentes_reais_qtd: divergentes
        }
      };
    }
    
    const resumo = currentReconciliationData.resumo;
    const irrfItems = currentReconciliationData.items;

    // Adaptar tabs: renomear 'Apenas ERP' -> 'Ausentes' e ocultar 'Apenas Prefeitura'
    const tabErpOnly  = document.querySelector('.tab-btn[data-tab="erp_only"]');
    const tabCityOnly = document.querySelector('.tab-btn[data-tab="city_only"]');
    if (tabErpOnly)  tabErpOnly.innerHTML   = `⚠️ Ausentes (<span id="countErpOnly">${resumo.ausentes_qtd}</span>)`;
    if (tabCityOnly) tabCityOnly.style.display = 'none';

    // Adaptar cabeçalhos da tabela para o contexto IRRF
    const thead = document.querySelector('#resultsSection thead tr');
    if (thead) {
      thead.innerHTML = `
        <th>Status</th>
        <th>Documento</th>
        <th>CNPJ</th>
        <th>Razão Social</th>
        <th>IRRF SF1 (R$)</th>
        <th>IRRF Aglu. (R$)</th>
        <th>IRRF R-4020 (R$)</th>
        <th>Diferença (R$)</th>
        <th>Diagnóstico</th>
      `;
    }

    // Preencher cards de resumo do dashboardGrid
    const elTotal         = document.getElementById('statTotalAudited');
    const elTotalCount    = document.getElementById('statTotalCount');
    const elMatchedVal    = document.getElementById('statMatchedVal');
    const elMatchedCount  = document.getElementById('statMatchedCount');
    const elDivVal        = document.getElementById('statDivergentVal');
    const elDivCount      = document.getElementById('statDivergentCount');
    const elAccuracy      = document.getElementById('statAccuracy');
    const elCountAll      = document.getElementById('countAll');
    const elCountMatched  = document.getElementById('countMatched');
    const elCountDivergent = document.getElementById('countDivergent');
    const elCountErpOnly  = document.getElementById('countErpOnly');

    if (elTotal)          elTotal.textContent        = formatCurrency(resumo.total_erp_valor);
    if (elTotalCount)     elTotalCount.textContent    = `${resumo.total_erp_qtd} documentos analisados (3 relatórios cruzados)`;
    if (elMatchedVal)     elMatchedVal.textContent    = `${resumo.conciliados_qtd}`;
    if (elMatchedCount)   elMatchedCount.textContent  = 'Sem divergências (SF1 = Aglu. = R-4020)';
    if (elDivVal)         elDivVal.textContent        = `${resumo.divergentes_qtd}`;
    if (elDivCount)       elDivCount.textContent      = `${resumo.ausentes_qtd} ausentes + ${resumo.divergentes_reais_qtd} com divergência`;
    if (elAccuracy)       elAccuracy.textContent      = `${resumo.taxa_assertividade}%`;
    if (elCountAll)       elCountAll.textContent      = resumo.total_erp_qtd;
    if (elCountMatched)   elCountMatched.textContent  = resumo.conciliados_qtd;
    if (elCountDivergent) elCountDivergent.textContent = resumo.divergentes_reais_qtd;
    if (elCountErpOnly)   elCountErpOnly.textContent  = resumo.ausentes_qtd;

    // Ocultar painéis exclusivos de outros módulos
    const dashboardIssAudit      = document.getElementById('dashboardIssAudit');
    const dashboardBalanceteAudit = document.getElementById('dashboardBalanceteAudit');
    if (dashboardIssAudit)       dashboardIssAudit.style.display       = 'none';
    if (dashboardBalanceteAudit) dashboardBalanceteAudit.style.display  = 'none';

    // Exibir a UI padrão (igual aos outros módulos)
    dashboardGrid.style.display = 'grid';
    document.getElementById('uploadFormContainer').style.display = 'none';
    document.getElementById('chartContainer').style.display = 'flex';
    resultsSection.style.display = 'block';

    // Gerar gráfico de rosca
    renderChart(irrfItems);

    // Renderizar tabela IRRF
    filterAndRenderIrrfTable();
  }

  // Tabela no modo IRRF com colunas SF1 / Aglu. / R-4020
  function filterAndRenderIrrfTable() {
    if (!currentReconciliationData || !currentReconciliationData._irrf_mode) return;

    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    tableBody.innerHTML = '';

    const filtered = currentReconciliationData.items.filter(item => {
      const matchesTab =
        (activeTab === 'all') ||
        (activeTab === 'matched'   && item.status === 'CONCILIADO') ||
        (activeTab === 'divergent' && item.status === 'DIVERGENTE') ||
        (activeTab === 'erp_only'  && item.status === 'SOMENTE_ERP');

      const itemStr = `${item.numero_erp} ${item.cnpj} ${item.tomador}`.toLowerCase();
      return matchesTab && (!searchTerm || itemStr.includes(searchTerm));
    });

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      let statusBadge = '';
      if      (item.status === 'CONCILIADO') statusBadge = '<span class="badge badge-matched">🟢 Conciliado</span>';
      else if (item.status === 'DIVERGENTE') statusBadge = '<span class="badge badge-divergent">🔴 Divergência</span>';
      else                                   statusBadge = '<span class="badge badge-erp-only">⚠️ Ausente</span>';

      const diff = item.diferenca || 0;
      tr.innerHTML = `
        <td>${statusBadge}</td>
        <td><strong>${item.numero_erp}</strong></td>
        <td>${item.cnpj}</td>
        <td>${item.tomador}</td>
        <td>${formatCurrency(item.irrf_sf1)}</td>
        <td>${formatCurrency(item.irrf_aglu)}</td>
        <td>${formatCurrency(item.irrf_r4020)}</td>
        <td style="color: ${diff > 0.04 ? 'var(--status-danger-text)' : 'var(--text-muted)'}; font-weight: 600;">${formatCurrency(diff)}</td>
        <td><small style="color: var(--text-muted);">${item.diagnostico}</small></td>
      `;
      tableBody.appendChild(tr);
    });
  }


  tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab');
      if (currentReconciliationData && currentReconciliationData._csrf_mode) {
        filterAndRenderCsrfTable();
      } else if (currentReconciliationData && currentReconciliationData._irrf_mode) {
        filterAndRenderIrrfTable();
      } else {
        filterAndRenderTable();
      }
    });
  });

  searchInput.addEventListener('input', () => {
    if (currentReconciliationData && currentReconciliationData._csrf_mode) {
      filterAndRenderCsrfTable();
    } else if (currentReconciliationData && currentReconciliationData._irrf_mode) {
      filterAndRenderIrrfTable();
    } else {
      filterAndRenderTable();
    }
  });

  // ==========================================
  // EXPORTAÇÃO EXCEL & IMPRESSÃO / PDF (SDD)
  // ==========================================

  function exportReconciliationToExcel() {
    if (!currentReconciliationData || !currentReconciliationData.items || currentReconciliationData.items.length === 0) {
      alert('Nenhum dado processado para exportação. Realize uma conciliação primeiro.');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('Biblioteca SheetJS (XLSX) não carregada. Verifique sua conexão com a internet.');
      return;
    }

    const data = currentReconciliationData;
    const resumo = data.resumo || {};
    const items = data.items || [];
    
    let moduloNome = 'Geral';
    if (data._csrf_mode || currentMode === 'csrf') {
      moduloNome = 'CSRF_PCC';
    } else if (data._irrf_mode || currentMode === 'irrf') {
      moduloNome = 'IRRF';
    } else if (currentMode === 'iss-prestados') {
      moduloNome = 'ISS_Prestados';
    } else if (currentMode === 'iss-tomados') {
      moduloNome = 'ISS_Tomados';
    } else if (currentMode === 'faturamento') {
      moduloNome = 'Faturamento';
    }

    // 1. Aba Resumo
    const resumoAoa = [
      ['RELATÓRIO CONSOLIDADO DE CONCILIAÇÃO FISCAL - HOME DOCTOR'],
      ['Módulo:', moduloNome.replace('_', ' ')],
      ['Data de Extração:', new Date().toLocaleString('pt-BR')],
      [],
      ['INDICADORES DO DASHBOARD', 'VALORES'],
      ['Total Auditado (Qtd Documentos)', resumo.total_erp_qtd || items.length],
      ['Total Auditado (R$)', resumo.total_erp_valor || 0],
      ['Total Conciliado (Qtd)', resumo.conciliados_qtd || 0],
      ['Total Conciliado (R$)', resumo.conciliados_valor || 0],
      ['Total Divergências (Qtd)', resumo.divergentes_qtd || 0],
      ['Total Divergências (R$)', resumo.divergentes_valor || 0],
      ['Total Ausentes (Qtd)', resumo.ausentes_qtd || 0],
      ['Taxa de Assertividade', `${resumo.taxa_assertividade || '0.0'}%`]
    ];

    // 2. Aba Dados
    let dadosHeaders = [];
    let dadosRows = [];

    if (data._csrf_mode || currentMode === 'csrf') {
      dadosHeaders = [
        'Status',
        'Documento',
        'CNPJ',
        'Razão Social',
        'PCC ERP (R$)',
        'PCC Aglu. (R$)',
        'R-4020 (R$)',
        'Diferença (R$)',
        'Diagnóstico'
      ];
      dadosRows = items.map(item => [
        item.status === 'CONCILIADO' ? 'Conciliado' : (item.status === 'SOMENTE_ERP' ? 'Ausente' : 'Divergente'),
        item.numero_erp || '',
        item.cnpj || '',
        item.tomador || '',
        item.csrf_se2 !== undefined ? item.csrf_se2 : (item.valor_erp || 0),
        item.csrf_aglu !== undefined ? item.csrf_aglu : (item.valor_prefeitura || 0),
        item.csrf_r4020 !== undefined ? item.csrf_r4020 : 0,
        item.diferenca || 0,
        item.diagnostico || ''
      ]);
    } else if (data._irrf_mode || currentMode === 'irrf') {
      dadosHeaders = [
        'Status',
        'Documento',
        'CNPJ',
        'Razão Social',
        'SF1 ERP (R$)',
        'Aglutinação (R$)',
        'R-4020 (R$)',
        'Diferença (R$)',
        'Diagnóstico'
      ];
      dadosRows = items.map(item => [
        item.status === 'CONCILIADO' ? 'Conciliado' : (item.status === 'SOMENTE_ERP' ? 'Ausente' : 'Divergente'),
        item.numero_erp || '',
        item.cnpj || '',
        item.tomador || '',
        item.irrf_sf1 !== undefined ? item.irrf_sf1 : (item.valor_erp || 0),
        item.irrf_aglu !== undefined ? item.irrf_aglu : (item.valor_prefeitura || 0),
        item.irrf_r4020 !== undefined ? item.irrf_r4020 : 0,
        item.diferenca || 0,
        item.diagnostico || ''
      ]);
    } else {
      dadosHeaders = [
        'Status',
        'Ref. ERP (RPS/Nota)',
        'Nota Prefeitura',
        'Tomador',
        'Valor ERP (R$)',
        'Base Calc. Prefeitura (R$)',
        'Diferença (R$)',
        'Diagnóstico'
      ];
      dadosRows = items.map(item => [
        item.status === 'CONCILIADO' ? 'Conciliado' : (item.status === 'SOMENTE_ERP' ? 'Ausente' : 'Divergente'),
        item.numero_erp || item.rps_erp || '',
        item.numero_prefeitura || '',
        item.tomador || '',
        item.valor_erp || 0,
        item.valor_prefeitura || 0,
        item.diferenca || 0,
        item.diagnostico || ''
      ]);
    }

    const dadosAoa = [dadosHeaders, ...dadosRows];

    // Criar o workbook
    const wb = XLSX.utils.book_new();
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoAoa);
    const wsDados = XLSX.utils.aoa_to_sheet(dadosAoa);

    // Ajustar larguras das colunas
    wsResumo['!cols'] = [{ wch: 35 }, { wch: 25 }];
    wsDados['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 22 },
      { wch: 35 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 40 }
    ];

    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    XLSX.utils.book_append_sheet(wb, wsDados, 'Dados');

    const dataHoje = new Date().toISOString().slice(0, 10);
    const fileName = `Conciliacao_${moduloNome}_${dataHoje}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  function printReconciliationReport() {
    if (!currentReconciliationData || !currentReconciliationData.items || currentReconciliationData.items.length === 0) {
      alert('Nenhum dado processado para impressão. Realize uma conciliação primeiro.');
      return;
    }
    if (accuracyChartInstance) {
      accuracyChartInstance.resize();
    }
    setTimeout(() => {
      window.print();
    }, 100);
  }

  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', exportReconciliationToExcel);
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', printReconciliationReport);
  }

  function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  }
});

