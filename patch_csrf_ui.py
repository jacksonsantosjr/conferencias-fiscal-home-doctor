import re

with open("static/app.js", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add filterAndRenderCsrfTable logic and replace renderCsrfResults
render_csrf_logic = """
  function renderCsrfResults(result) {
    const detalhes = result.detalhes || [];

    // Mapear dados CSRF para o formato items padrão
    const csrfItems = detalhes.map(item => {
      const se2  = item.csrf_se2  || 0;
      const aglu = item.csrf_aglu || 0;
      const r40  = item.csrf_r4020 || 0;
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

    const conciliados = detalhes.filter(d => d.status === 'Conciliado').length;
    const divergentes = detalhes.filter(d => d.status === 'Divergente').length;
    const ausentes    = detalhes.filter(d => d.status === 'Ausente').length;
    const total       = detalhes.length;
    const totalSe2    = detalhes.reduce((s, d) => s + (d.csrf_se2 || 0), 0);
    const taxa        = total > 0 ? ((conciliados / total) * 100).toFixed(1) : '0.0';

    // Armazenar no formato padrão com flag de modo CSRF
    currentReconciliationData = {
      items: csrfItems,
      _csrf_mode: true,
      resumo: {
        total_erp_qtd: total,
        total_prefeitura_qtd: total,
        total_erp_valor: totalSe2,
        conciliados_qtd: conciliados,
        conciliados_valor: detalhes.filter(d => d.status === 'Conciliado').reduce((s, d) => s + (d.csrf_se2 || 0), 0),
        divergentes_qtd: divergentes + ausentes,
        divergentes_valor: detalhes.filter(d => d.status !== 'Conciliado').reduce((s, d) => s + Math.max(d.csrf_se2||0, d.csrf_aglu||0, d.csrf_r4020||0), 0),
        taxa_assertividade: taxa
      }
    };
    moduleState['csrf'].reconciliationData = result;

    // Adaptar tabs: renomear 'Apenas ERP' -> 'Ausentes' e ocultar 'Apenas Prefeitura'
    const tabErpOnly  = document.querySelector('.tab-btn[data-tab="erp_only"]');
    const tabCityOnly = document.querySelector('.tab-btn[data-tab="city_only"]');
    if (tabErpOnly)  tabErpOnly.innerHTML   = `⚠️ Ausentes (<span id="countErpOnly">${ausentes}</span>)`;
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

    if (elTotal)          elTotal.textContent        = formatCurrency(totalSe2);
    if (elTotalCount)     elTotalCount.textContent    = `${total} documentos analisados (3 relatórios cruzados)`;
    if (elMatchedVal)     elMatchedVal.textContent    = `${conciliados}`;
    if (elMatchedCount)   elMatchedCount.textContent  = 'Sem divergências (SE2 = Aglu. = R-4020)';
    if (elDivVal)         elDivVal.textContent        = `${divergentes + ausentes}`;
    if (elDivCount)       elDivCount.textContent      = `${ausentes} ausentes + ${divergentes} com divergência`;
    if (elAccuracy)       elAccuracy.textContent      = `${taxa}%`;
    if (elCountAll)       elCountAll.textContent      = total;
    if (elCountMatched)   elCountMatched.textContent  = conciliados;
    if (elCountDivergent) elCountDivergent.textContent = divergentes;
    if (elCountErpOnly)   elCountErpOnly.textContent  = ausentes;

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
"""

old_render_csrf = re.search(r'  function renderCsrfResults\(result\) \{.*?      tbody\.appendChild\(tr\);\n    \}\);\n  \}', content, flags=re.DOTALL)
if old_render_csrf:
    content = content[:old_render_csrf.start()] + render_csrf_logic + content[old_render_csrf.end():]
else:
    print("Could not find old renderCsrfResults!")

# 2. Fix tab listeners
tab_listeners_pattern = r'''        if \(currentReconciliationData && currentReconciliationData\._irrf_mode\) \{
          filterAndRenderIrrfTable\(\);
        \} else \{
          filterAndRenderTable\(\);
        \}'''

tab_listeners_replacement = '''        if (currentReconciliationData && currentReconciliationData._irrf_mode) {
          filterAndRenderIrrfTable();
        } else if (currentReconciliationData && currentReconciliationData._csrf_mode) {
          filterAndRenderCsrfTable();
        } else {
          filterAndRenderTable();
        }'''
content = content.replace(tab_listeners_pattern, tab_listeners_replacement)

# 3. Fix search listener
search_listener_pattern = r'''      if \(currentReconciliationData && currentReconciliationData\._irrf_mode\) \{
        filterAndRenderIrrfTable\(\);
      \} else \{
        filterAndRenderTable\(\);
      \}'''

search_listener_replacement = '''      if (currentReconciliationData && currentReconciliationData._irrf_mode) {
        filterAndRenderIrrfTable();
      } else if (currentReconciliationData && currentReconciliationData._csrf_mode) {
        filterAndRenderCsrfTable();
      } else {
        filterAndRenderTable();
      }'''
content = content.replace(search_listener_pattern, search_listener_replacement)


# 4. Fix button listener for Csrf
btn_csrf_pattern = r'''              document\.getElementById\('uploadFormContainer'\)\.style\.display = 'none';
              const csrfResultsSection = document\.getElementById\('csrf-results'\);
              if \(csrfResultsSection\) csrfResultsSection\.style\.display = 'block';
              
              renderCsrfResults\(data\.result\);'''

btn_csrf_replacement = '''              renderCsrfResults(data.result);'''
content = content.replace(btn_csrf_pattern, btn_csrf_replacement)

with open("static/app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Patched app.js successfully.")
