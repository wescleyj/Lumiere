import { useState, useMemo, useEffect } from 'react';
import { Code2, BarChart3, Star, AlertTriangle } from 'lucide-react';
import { fetchReportsApi } from '../data/api.js';
import { TableSkeleton } from './LoadingStates.jsx';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export default function ReportsView({ db }) {
  const [activeId, setActiveId] = useState('inner_join');
  const [showSql, setShowSql] = useState(true);
  const [situacaoFilter, setSituacaoFilter] = useState('Todas');
  const [minViews, setMinViews] = useState(2);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchReportsApi({ situacaoFilter, minViews }).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error || 'Erro ao executar consultas SQL no servidor.');
        setLoading(false);
        return;
      }
      setReports(res.reports || []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [db, situacaoFilter, minViews]);

  const activeReport = useMemo(
    () => reports.find((r) => r.id === activeId) || reports[0] || null,
    [reports, activeId]
  );

  const maxViews = useMemo(() => {
    if (!activeReport) return 1;
    let max = 1;
    for (const row of activeReport.rows) {
      const v = Number(row.total_visualizacoes) || 0;
      if (v > max) max = v;
    }
    return max;
  }, [activeReport]);

  const renderCell = (row, col) => {
    const val = row[col.key];
    if (col.format === 'currency') return formatCurrency(val);
    if (col.format === 'date') return formatDate(val);
    if (col.format === 'rating') {
      if (val === null || val === undefined) return <span className="cell-secondary">Sem notas</span>;
      const pct = Math.min(100, (Number(val) / 5) * 100);
      return (
        <div className="metric-bar-wrap">
          <span className="star-inline">
            <Star size={13} fill="currentColor" aria-hidden="true" />
            {Number(val).toFixed(2)}
          </span>
          <div className="metric-bar-track" aria-hidden="true">
            <div
              className="metric-bar-fill"
              style={{ width: `${pct}%`, backgroundColor: 'var(--status-warning)' }}
            />
          </div>
        </div>
      );
    }
    if (col.key === 'diferenca_media') {
      return `+${Number(val).toFixed(2)}`;
    }
    if (col.key === 'situacao') {
      const cls =
        val === 'Ativa' ? 'status-success' : val === 'Suspensa' ? 'status-warning' : 'status-danger';
      return <span className={`status-pill ${cls}`}>{val}</span>;
    }
    if (col.key === 'total_visualizacoes') {
      const count = Number(val) || 0;
      if (count === 0) {
        return <span className="status-pill status-neutral">0 (sem exibição)</span>;
      }
      const pct = Math.round((count / maxViews) * 100);
      return (
        <div className="metric-bar-wrap">
          <strong style={{ minWidth: 18 }}>{count}</strong>
          <div className="metric-bar-track" aria-hidden="true">
            <div className="metric-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    return val;
  };

  return (
    <div className="page-container view-enter">
      <div className="section-header">
        <div>
          <h1 className="section-title">Relatórios Analíticos (SQL)</h1>
          <p className="section-subtitle">
            Consultas executadas em tempo real no PostgreSQL: INNER JOIN, LEFT JOIN, GROUP BY,
            HAVING e Subconsulta.
          </p>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="reports-tabs" role="tablist" aria-label="Consultas SQL obrigatórias">
          {reports.map((rep) => (
            <button
              key={rep.id}
              type="button"
              role="tab"
              aria-selected={rep.id === activeReport?.id}
              className={`genre-pill ${rep.id === activeReport?.id ? 'is-active' : ''}`}
              onClick={() => setActiveId(rep.id)}
            >
              {rep.badge}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <section className="report-card">
          <div className="empty-state">
            <AlertTriangle size={30} aria-hidden="true" />
            <h2 className="empty-state-title">Erro ao carregar relatórios</h2>
            <p className="empty-state-desc">{error}</p>
          </div>
        </section>
      ) : loading && !activeReport ? (
        <section className="report-card">
          <TableSkeleton rows={6} />
        </section>
      ) : (
        activeReport && (
          <section className="report-card" aria-label={activeReport.title}>
            <div className="report-card-header">
              <div>
                <span className="report-badge">{activeReport.badge}</span>
                <h2 className="report-title">{activeReport.title}</h2>
                <p className="report-desc">{activeReport.description}</p>
              </div>

              <div className="report-controls">
                {activeReport.id === 'inner_join' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="rep-sit" className="field-label">Situação:</label>
                    <select
                      id="rep-sit"
                      className="input-control"
                      style={{ width: 'auto' }}
                      value={situacaoFilter}
                      onChange={(e) => setSituacaoFilter(e.target.value)}
                    >
                      <option value="Todas">Todas</option>
                      <option value="Ativa">Ativa</option>
                      <option value="Suspensa">Suspensa</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                )}

                {activeReport.id === 'having' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label htmlFor="rep-having" className="field-label">Mínimo de visualizações:</label>
                    <input
                      id="rep-having"
                      type="number"
                      min={0}
                      max={20}
                      className="input-control"
                      style={{ width: 78 }}
                      value={minViews}
                      onChange={(e) => setMinViews(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSql((s) => !s)}
                >
                  <Code2 size={15} aria-hidden="true" />
                  <span>{showSql ? 'Ocultar SQL' : 'Ver SQL'}</span>
                </button>
              </div>
            </div>

            {showSql && (
              <pre className="sql-block">
                <code>{activeReport.sql}</code>
              </pre>
            )}

            <div className="report-meta-bar">
              <span>
                Linhas retornadas: <strong>{activeReport.rows.length}</strong>
              </span>
              {activeReport.id === 'left_join' && (
                <span>
                  Filmes preservados com 0 visualizações:{' '}
                  <strong>{activeReport.meta.zeroViewsCount}</strong>
                </span>
              )}
              {activeReport.id === 'subconsulta' && (
                <span>
                  Média global de Avalia: <strong>{activeReport.meta.globalAvg.toFixed(2)}</strong> (sobre{' '}
                  {activeReport.meta.totalReviews} avaliações)
                </span>
              )}
            </div>

            {loading ? (
              <TableSkeleton rows={5} />
            ) : activeReport.rows.length === 0 ? (
              <div className="empty-state">
                <BarChart3 size={30} aria-hidden="true" />
                <h3 className="empty-state-title">Nenhum resultado para o filtro atual</h3>
                <p className="empty-state-desc">
                  Ajuste os parâmetros da consulta ou adicione novos dados na aba Gerenciar.
                </p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      {activeReport.columns.map((col) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeReport.rows.map((row, idx) => (
                      <tr key={idx}>
                        {activeReport.columns.map((col) => (
                          <td
                            key={col.key}
                            className={col.key === activeReport.columns[0].key ? 'cell-primary' : ''}
                          >
                            {renderCell(row, col)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      )}
    </div>
  );
}
