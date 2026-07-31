// Lógica Interativa da Interface Web de Conferência Fiscal

document.addEventListener('DOMContentLoaded', () => {
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

  // Dashboard e Tabela
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

  let selectedErpFile = null;
  let selectedCityFile = null;
  let currentReconciliationData = null;
  let activeTab = 'all';

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
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Modo Claro';
    } else {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Modo Escuro';
    }
  }

  // ========================================================
  // CONFIGURAÇÃO DOS DRAG & DROP E FILE INPUTS
  // ========================================================
  [dropzoneErp, dropzoneCity].forEach(zone => {
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
      erpFileStatus.style.color = 'var(--primary-cyan)';
    }
  });

  dropzoneCity.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneCity.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      selectedCityFile = e.dataTransfer.files[0];
      cityFileStatus.textContent = `📄 ${selectedCityFile.name}`;
      cityFileStatus.style.color = 'var(--primary-cyan)';
    }
  });

  erpFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      selectedErpFile = e.target.files[0];
      erpFileStatus.textContent = `📄 ${selectedErpFile.name}`;
      erpFileStatus.style.color = 'var(--primary-cyan)';
    }
  });

  cityFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      selectedCityFile = e.target.files[0];
      cityFileStatus.textContent = `📄 ${selectedCityFile.name}`;
      cityFileStatus.style.color = 'var(--primary-cyan)';
    }
  });

  // ========================================================
  // BOTÃO NOVA ANÁLISE / RESETAR TUDO
  // ========================================================
  btnResetAll.addEventListener('click', () => {
    selectedErpFile = null;
    selectedCityFile = null;
    currentReconciliationData = null;
    
    erpFileInput.value = '';
    cityFileInput.value = '';

    erpFileStatus.textContent = 'Nenhum arquivo selecionado';
    erpFileStatus.style.color = 'var(--text-muted)';
    
    cityFileStatus.textContent = 'Nenhum arquivo selecionado';
    cityFileStatus.style.color = 'var(--text-muted)';

    dashboardGrid.style.display = 'none';
    resultsSection.style.display = 'none';
    tableBody.innerHTML = '';
    
    searchInput.value = '';
    activeTab = 'all';

    tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    tabGroup.querySelector('[data-tab="all"]').classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ========================================================
  // CONTROLADOR DO MODAL DE PROGRESSO FLUÍDO
  // ========================================================
  async function runFluidProgress(apiCallPromise) {
    progressModal.style.display = 'flex';
    progressBarFill.style.width = '0%';
    progressPercentText.textContent = '0%';

    const cityName = document.getElementById('citySelect').value;
    progressCityInfo.textContent = `Alvo: Prefeitura de ${cityName}`;

    const steps = [
      { pct: 20, msg: "Etapa 1/4: Lendo e validando a estrutura dos relatórios..." },
      { pct: 45, msg: `Etapa 2/4: Extraindo registros do ERP (Apenas notas Tributadas 'T')...` },
      { pct: 70, msg: `Etapa 3/4: Processando notas da Prefeitura de ${cityName}...` },
      { pct: 90, msg: "Etapa 4/4: Executando algoritmo de reconciliação fiscal com tolerância..." }
    ];

    let currentStepIdx = 0;
    
    const interval = setInterval(() => {
      const target = steps[currentStepIdx];
      if (target) {
        progressStepText.textContent = target.msg;
        progressBarFill.style.width = `${target.pct}%`;
        progressPercentText.textContent = `${target.pct}%`;
        if (currentStepIdx < steps.length - 1) {
          currentStepIdx++;
        }
      }
    }, 450);

    try {
      const data = await apiCallPromise;
      clearInterval(interval);

      if (data.success) {
        progressStepText.textContent = "✓ Auditoria concluída com sucesso!";
        progressBarFill.style.width = '100%';
        progressPercentText.textContent = '100%';

        setTimeout(() => {
          progressModal.style.display = 'none';
          renderResults(data.result);
        }, 500);
      } else {
        progressModal.style.display = 'none';
        alert('Aviso no processamento: ' + data.error);
      }
    } catch (err) {
      clearInterval(interval);
      progressModal.style.display = 'none';
      alert('Erro na comunicação com o servidor: ' + err.message);
    }
  }

  // Botão Usar Modelo Demonstração
  btnLoadDemo.addEventListener('click', () => {
    const cityName = document.getElementById('citySelect').value;
    erpFileStatus.textContent = `⚡ Modelo ERP (${cityName})`;
    erpFileStatus.style.color = 'var(--primary-cyan)';
    cityFileStatus.textContent = `⚡ Relatório Prefeitura (${cityName})`;
    cityFileStatus.style.color = 'var(--primary-cyan)';

    const apiPromise = fetch('/api/reconcile-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: cityName })
    }).then(res => res.json());

    runFluidProgress(apiPromise);
  });

  // Botão Iniciar Conferência Fiscal
  btnStartAudit.addEventListener('click', () => {
    if (!selectedErpFile && !selectedCityFile) {
      btnLoadDemo.click();
      return;
    }

    if (!selectedErpFile || !selectedCityFile) {
      alert('Por favor, selecione ambos os arquivos (ERP e Prefeitura) para continuar.');
      return;
    }

    const formData = new FormData();
    formData.append('erp_file', selectedErpFile);
    formData.append('city_file', selectedCityFile);
    formData.append('city', document.getElementById('citySelect').value);

    const apiPromise = fetch('/api/reconcile', {
      method: 'POST',
      body: formData
    }).then(res => res.json());

    runFluidProgress(apiPromise);
  });

  // Renderização dos Resultados e Métricas no Dashboard
  function renderResults(result) {
    currentReconciliationData = result;
    const r = result.resumo;

    document.getElementById('statTotalAudited').textContent = formatCurrency(r.total_erp_valor);
    document.getElementById('statTotalCount').textContent = `${r.total_erp_qtd} notas ERP | ${r.total_prefeitura_qtd} na Prefeitura`;

    document.getElementById('statMatchedVal').textContent = formatCurrency(r.conciliados_valor);
    document.getElementById('statMatchedCount').textContent = `${r.conciliados_qtd} notas coincidentes (${r.taxa_assertividade}%)`;

    document.getElementById('statDivergentVal').textContent = formatCurrency(r.divergentes_valor);
    document.getElementById('statDivergentCount').textContent = `${r.divergentes_qtd} divergências > R$ 0,04`;

    document.getElementById('statAccuracy').textContent = `${r.taxa_assertividade}%`;
    document.getElementById('statToleranceInfo').textContent = `Tolerância: R$ ${r.tolerancia_aplicada.toFixed(2)}`;

    dashboardGrid.style.display = 'grid';
    resultsSection.style.display = 'block';

    document.getElementById('countAll').textContent = r.conciliados_qtd + r.divergentes_qtd + r.somente_erp_qtd + r.somente_prefeitura_qtd;
    document.getElementById('countMatched').textContent = r.conciliados_qtd;
    document.getElementById('countDivergent').textContent = r.divergentes_qtd;
    document.getElementById('countErpOnly').textContent = r.somente_erp_qtd;
    document.getElementById('countCityOnly').textContent = r.somente_prefeitura_qtd;

    renderTable();
  }

  // Filtro por Tab
  tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.dataset.tab;
      renderTable();
    });
  });

  // Filtro por Busca de Texto
  searchInput.addEventListener('input', () => {
    renderTable();
  });

  function renderTable() {
    if (!currentReconciliationData) return;
    tableBody.innerHTML = '';

    const query = searchInput.value.toLowerCase().trim();
    let rowsToDisplay = [];

    const { conciliados, divergentes, somente_erp, somente_prefeitura } = currentReconciliationData;

    if (activeTab === 'all' || activeTab === 'matched') {
      conciliados.forEach(item => {
        rowsToDisplay.push({
          type: item.status === 'CONCILIADO' ? 'conciliado' : 'tolerancia',
          statusText: item.status === 'CONCILIADO' ? 'Conciliado' : 'Tolerância',
          refErp: item.erp.rps || item.erp.nfs_nac || item.erp.nf_num || item.erp.id,
          refCity: item.prefeitura.numero,
          tomador: item.erp.tomador || 'Não informado',
          valorErp: item.valor_erp,
          valorCity: item.valor_prefeitura,
          diff: item.diferenca,
          detalhe: item.detalhe
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'divergent') {
      divergentes.forEach(item => {
        rowsToDisplay.push({
          type: 'divergente',
          statusText: 'Divergente',
          refErp: item.erp.rps || item.erp.id,
          refCity: item.prefeitura.numero,
          tomador: item.erp.tomador || 'Não informado',
          valorErp: item.valor_erp,
          valorCity: item.valor_prefeitura,
          diff: item.diferenca,
          detalhe: item.detalhe
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'erp_only') {
      somente_erp.forEach(item => {
        rowsToDisplay.push({
          type: 'sobra',
          statusText: 'Apenas ERP',
          refErp: item.rps || item.nf_num || item.id,
          refCity: '-',
          tomador: item.tomador || 'Não informado',
          valorErp: item.valor,
          valorCity: null,
          diff: item.valor,
          detalhe: 'Nota tributada (T) no ERP sem correspondente no relatório da Prefeitura'
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'city_only') {
      somente_prefeitura.forEach(item => {
        rowsToDisplay.push({
          type: 'sobra',
          statusText: 'Apenas Prefeitura',
          refErp: '-',
          refCity: item.numero,
          tomador: `Prefeitura de ${item.cidade || 'São Paulo'}`,
          valorErp: null,
          valorCity: item.valor,
          diff: item.valor,
          detalhe: 'Nota no relatório da Prefeitura sem correspondente no ERP'
        });
      });
    }

    if (query) {
      rowsToDisplay = rowsToDisplay.filter(r => 
        r.refErp.toLowerCase().includes(query) ||
        r.refCity.toLowerCase().includes(query) ||
        r.tomador.toLowerCase().includes(query) ||
        formatCurrency(r.valorErp || 0).includes(query) ||
        formatCurrency(r.valorCity || 0).includes(query)
      );
    }

    if (rowsToDisplay.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum registro encontrado para este filtro.</td></tr>`;
      return;
    }

    rowsToDisplay.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge ${row.type}">${row.statusText}</span></td>
        <td><strong>${row.refErp}</strong></td>
        <td><strong>${row.refCity}</strong></td>
        <td>${escapeHtml(row.tomador)}</td>
        <td>${row.valorErp !== null ? formatCurrency(row.valorErp) : '-'}</td>
        <td>${row.valorCity !== null ? formatCurrency(row.valorCity) : '-'}</td>
        <td><span style="color: ${row.diff > 0.04 ? 'var(--status-danger-text)' : 'inherit'}">R$ ${row.diff.toFixed(2)}</span></td>
        <td style="font-size: 12px; color: var(--text-muted);">${escapeHtml(row.detalhe)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  btnExportExcel.addEventListener('click', () => {
    if (!currentReconciliationData) return;

    const cityName = document.getElementById('citySelect').value;
    let csvContent = "\uFEFFStatus;Ref ERP;Ref Prefeitura;Tomador;Valor ERP;Base Calc Prefeitura;Diferenca;Diagnostico\n";
    
    const allItems = [
      ...currentReconciliationData.conciliados.map(i => [i.status, i.erp.rps || i.erp.nf_num || i.erp.id, i.prefeitura.numero, i.erp.tomador, i.valor_erp, i.valor_prefeitura, i.diferenca, i.detalhe]),
      ...currentReconciliationData.divergentes.map(i => ['DIVERGENTE', i.erp.rps || i.erp.nf_num || i.erp.id, i.prefeitura.numero, i.erp.tomador, i.valor_erp, i.valor_prefeitura, i.diferenca, i.detalhe]),
      ...currentReconciliationData.somente_erp.map(i => ['APENAS ERP', i.rps || i.nf_num || i.id, '-', i.tomador, i.valor, 0, i.valor, 'Ausente na Prefeitura']),
      ...currentReconciliationData.somente_prefeitura.map(i => ['APENAS PREFEITURA', '-', i.numero, `Prefeitura ${cityName}`, 0, i.valor, i.valor, 'Ausente no ERP'])
    ];

    allItems.forEach(row => {
      csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Conferencia_Fiscal_${cityName}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  });

  btnExportPdf.addEventListener('click', () => {
    window.print();
  });

  function formatCurrency(val) {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
