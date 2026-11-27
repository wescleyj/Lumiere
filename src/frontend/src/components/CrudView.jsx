import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit3, Trash2, RotateCcw, Search, Database, Star, X } from 'lucide-react';
import MoviePoster from './MoviePoster.jsx';
import RatingBadge from './RatingBadge.jsx';
import EntityFormModal from './EntityFormModal.jsx';
import { TableSkeleton } from './LoadingStates.jsx';
import {
  calculateAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDuration,
} from '../utils/formatters.js';

const ENTITY_GROUPS = [
  {
    group: 'Catálogo Audiovisual',
    items: [
      { key: 'filmes', label: 'Filmes', note: 'Entidade Filme com direção obrigatória e gêneros (Pertence_a).' },
      { key: 'generos', label: 'Gêneros', note: 'Categorias temáticas associadas aos filmes.' },
      { key: 'pessoas', label: 'Pessoas', note: 'Diretores, atores e atrizes do catálogo.' },
      { key: 'atua', label: 'Elenco (Atua)', note: 'Relacionamento N:M com função e personagem.' },
    ],
  },
  {
    group: 'Contas e Consumo',
    items: [
      { key: 'usuarios', label: 'Usuários', note: 'Titulares da conta (idade derivada de data_nascimento).' },
      { key: 'perfis', label: 'Perfis', note: 'Perfis vinculados (1,N) com controle parental.' },
      { key: 'planos', label: 'Planos', note: 'Modalidades comerciais, telas e qualidade máxima.' },
      { key: 'assinaturas', label: 'Assinaturas', note: 'Histórico contratual entre Usuário e Plano.' },
      { key: 'visualizacoes', label: 'Visualizações', note: 'Sessões de exibição registradas por perfil.' },
      { key: 'avaliacoes', label: 'Avaliações', note: 'Relacionamento N:M Avalia (chave Perfil + Filme).' },
    ],
  },
];

export default function CrudView({
  db,
  onCreate,
  onUpdate,
  onDelete,
  onResetDatabase,
}) {
  const [activeTable, setActiveTable] = useState('filmes');
  const [isSwitchingTable, setIsSwitchingTable] = useState(false);
  const [search, setSearch] = useState('');
  const [formState, setFormState] = useState({ open: false, record: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isSwitchingTable) return;
    const t = window.setTimeout(() => setIsSwitchingTable(false), 180);
    return () => window.clearTimeout(t);
  }, [isSwitchingTable]);

  const activeMeta = useMemo(() => {
    for (const grp of ENTITY_GROUPS) {
      const found = grp.items.find((i) => i.key === activeTable);
      if (found) return found;
    }
    return ENTITY_GROUPS[0].items[0];
  }, [activeTable]);

  const activeSubscriptionsCount = useMemo(
    () => db.assinaturas.filter((a) => a.situacao === 'Ativa').length,
    [db.assinaturas]
  );

  const userName = (id) => db.usuarios.find((u) => u.id_usuario === id)?.nome || '-';
  const planName = (id) => db.planos.find((p) => p.id_plano === id)?.nome || '-';
  const personName = (id) => db.pessoas.find((p) => p.id_pessoa === id)?.nome || '-';
  const profileName = (id) => db.perfis.find((p) => p.id_perfil === id)?.nome || '-';
  const movieTitle = (id) => db.filmes.find((f) => f.id_filme === id)?.titulo || '-';
  const genreNames = (ids) =>
    (ids || [])
      .map((gid) => db.generos.find((g) => g.id_genero === gid)?.nome)
      .filter(Boolean)
      .join(', ');

  const rows = useMemo(() => {
    const list = db[activeTable] || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((item) => {
      const searchable = JSON.stringify(item).toLowerCase();
      if (searchable.includes(q)) return true;
      if (item.id_usuario && userName(item.id_usuario).toLowerCase().includes(q)) return true;
      if (item.id_plano && planName(item.id_plano).toLowerCase().includes(q)) return true;
      if (item.id_diretor && personName(item.id_diretor).toLowerCase().includes(q)) return true;
      if (item.id_pessoa && personName(item.id_pessoa).toLowerCase().includes(q)) return true;
      if (item.id_perfil && profileName(item.id_perfil).toLowerCase().includes(q)) return true;
      if (item.id_filme && movieTitle(item.id_filme).toLowerCase().includes(q)) return true;
      return false;
    });
  }, [db, activeTable, search]);

  const getRecordKey = (table, row) => {
    if (table === 'avaliacoes') return `${row.id_perfil}-${row.id_filme}`;
    const keyMap = {
      filmes: 'id_filme',
      generos: 'id_genero',
      pessoas: 'id_pessoa',
      atua: 'id_atua',
      usuarios: 'id_usuario',
      perfis: 'id_perfil',
      planos: 'id_plano',
      assinaturas: 'id_assinatura',
      visualizacoes: 'id_visualizacao',
    };
    return row[keyMap[table]];
  };

  const handleFormSubmit = (table, payload, existing) => {
    if (existing) {
      return onUpdate(table, getRecordKey(table, existing), payload);
    }
    return onCreate(table, payload);
  };

  const renderSituacaoPill = (sit) => {
    const cls =
      sit === 'Ativa'
        ? 'status-success'
        : sit === 'Suspensa'
        ? 'status-warning'
        : 'status-danger';
    return <span className={`status-pill ${cls}`}>{sit}</span>;
  };

  const renderTable = () => {
    if (isSwitchingTable) {
      return <TableSkeleton rows={5} />;
    }

    if (rows.length === 0) {
      return (
        <div className="empty-state">
          <Database size={30} aria-hidden="true" />
          <h3 className="empty-state-title">Nenhum registro encontrado</h3>
          <p className="empty-state-desc">
            {search
              ? 'Nenhum item corresponde ao termo digitado.'
              : 'Esta tabela está vazia no momento.'}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setFormState({ open: true, record: null })}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Adicionar primeiro registro</span>
          </button>
        </div>
      );
    }

    return (
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            {activeTable === 'filmes' && (
              <tr>
                <th>ID</th>
                <th>Filme</th>
                <th>Direção</th>
                <th>Gêneros</th>
                <th>Duração</th>
                <th>Class.</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'generos' && (
              <tr>
                <th>ID</th>
                <th>Gênero</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'pessoas' && (
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Nascimento</th>
                <th>Nacionalidade</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'atua' && (
              <tr>
                <th>ID</th>
                <th>Profissional</th>
                <th>Filme</th>
                <th>Personagem</th>
                <th>Função</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'usuarios' && (
              <tr>
                <th>ID</th>
                <th>Titular</th>
                <th>CPF</th>
                <th>Idade</th>
                <th>Cadastro</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'perfis' && (
              <tr>
                <th>ID</th>
                <th>Perfil</th>
                <th>Titular</th>
                <th>Modo</th>
                <th>Limite</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'planos' && (
              <tr>
                <th>ID</th>
                <th>Plano</th>
                <th>Mensalidade</th>
                <th>Telas</th>
                <th>Qualidade</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'assinaturas' && (
              <tr>
                <th>ID</th>
                <th>Titular</th>
                <th>Plano</th>
                <th>Vigência</th>
                <th>Situação</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'visualizacoes' && (
              <tr>
                <th>ID</th>
                <th>Perfil</th>
                <th>Filme</th>
                <th>Início</th>
                <th>Assistido</th>
                <th>Conclusão</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
            {activeTable === 'avaliacoes' && (
              <tr>
                <th>Perfil</th>
                <th>Filme</th>
                <th>Nota</th>
                <th>Data</th>
                <th>Comentário</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            )}
          </thead>

          <tbody>
            {rows.map((row) => {
              const rowKey = getRecordKey(activeTable, row);
              const actionsCell = (
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Editar registro"
                      title="Editar"
                      onClick={() => setFormState({ open: true, record: row })}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label="Excluir registro"
                      title="Excluir"
                      onClick={() => setConfirmDelete({ table: activeTable, key: rowKey })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              );

              if (activeTable === 'filmes') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_filme}</td>
                    <td>
                      <div className="table-cell-flex">
                        <div className="table-poster-thumb">
                          <MoviePoster filme={row} compact />
                        </div>
                        <div>
                          <div className="cell-primary">{row.titulo}</div>
                          <div className="cell-secondary">{row.ano_lancamento}</div>
                        </div>
                      </div>
                    </td>
                    <td>{personName(row.id_diretor)}</td>
                    <td>{genreNames(row.generos)}</td>
                    <td>{formatDuration(row.duracao_min)}</td>
                    <td><RatingBadge rating={row.classificacao} /></td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'generos') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_genero}</td>
                    <td className="cell-primary">{row.nome}</td>
                    <td>{row.descricao}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'pessoas') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_pessoa}</td>
                    <td className="cell-primary">{row.nome}</td>
                    <td>{formatDate(row.data_nascimento)}</td>
                    <td>{row.nacionalidade}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'atua') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_atua}</td>
                    <td className="cell-primary">{personName(row.id_pessoa)}</td>
                    <td>{movieTitle(row.id_filme)}</td>
                    <td>{row.personagem}</td>
                    <td>{row.funcao}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'usuarios') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_usuario}</td>
                    <td>
                      <div className="cell-primary">{row.nome}</div>
                      <div className="cell-secondary">{row.email}</div>
                    </td>
                    <td>{row.cpf}</td>
                    <td>{row.idade ?? calculateAge(row.data_nascimento)} anos</td>
                    <td>{formatDate(row.data_cadastro)}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'perfis') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_perfil}</td>
                    <td>
                      <div className="table-cell-flex">
                        <span className={`profile-avatar avatar-${row.avatar_color || 'red'}`}>
                          {row.nome.charAt(0).toUpperCase()}
                        </span>
                        <span className="cell-primary">{row.nome}</span>
                      </div>
                    </td>
                    <td>{userName(row.id_usuario)}</td>
                    <td>
                      <span className={`status-pill ${row.infantil ? 'status-success' : 'status-neutral'}`}>
                        {row.infantil ? 'Infantil' : 'Padrão'}
                      </span>
                    </td>
                    <td><RatingBadge rating={row.classificacao_max} /></td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'planos') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_plano}</td>
                    <td className="cell-primary">{row.nome}</td>
                    <td>{formatCurrency(row.preco_mensal)}</td>
                    <td>{row.max_telas} tela(s)</td>
                    <td>{row.qualidade_max}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'assinaturas') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_assinatura}</td>
                    <td className="cell-primary">{userName(row.id_usuario)}</td>
                    <td>{planName(row.id_plano)}</td>
                    <td>
                      {formatDate(row.data_inicio)}
                      {row.data_fim ? ` até ${formatDate(row.data_fim)}` : ' (vigente)'}
                    </td>
                    <td>{renderSituacaoPill(row.situacao)}</td>
                    {actionsCell}
                  </tr>
                );
              }

              if (activeTable === 'visualizacoes') {
                return (
                  <tr key={rowKey}>
                    <td>#{row.id_visualizacao}</td>
                    <td className="cell-primary">{profileName(row.id_perfil)}</td>
                    <td>{movieTitle(row.id_filme)}</td>
                    <td>{formatDateTime(row.data_hora_inicio)}</td>
                    <td>{row.minutos_assistidos} min</td>
                    <td>
                      <span className={`status-pill ${row.conclusao ? 'status-success' : 'status-neutral'}`}>
                        {row.conclusao ? 'Concluído' : 'Em andamento'}
                      </span>
                    </td>
                    {actionsCell}
                  </tr>
                );
              }

              return (
                <tr key={rowKey}>
                  <td className="cell-primary">{profileName(row.id_perfil)}</td>
                  <td>{movieTitle(row.id_filme)}</td>
                  <td>
                    <span className="star-inline">
                      <Star size={13} fill="currentColor" aria-hidden="true" />
                      {row.nota}/5
                    </span>
                  </td>
                  <td>{formatDate(row.data_avaliacao)}</td>
                  <td>{row.comentario || '-'}</td>
                  {actionsCell}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-container view-enter">
      <div className="section-header">
        <div>
          <h1 className="section-title">Gerenciamento de Dados (CRUD)</h1>
          <p className="section-subtitle">
            Inclusão, alteração, consulta e remoção nas 10 tabelas e relacionamentos do modelo conceitual.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirmReset(true)}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Restaurar dados iniciais</span>
        </button>
      </div>

      <div className="kpi-strip" aria-label="Resumo da base de dados">
        <div className="kpi-card">
          <div className="kpi-label">Filmes no catálogo</div>
          <div className="kpi-value">{db.filmes.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Usuários titulares</div>
          <div className="kpi-value">{db.usuarios.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Assinaturas ativas</div>
          <div className="kpi-value">{activeSubscriptionsCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Visualizações registradas</div>
          <div className="kpi-value">{db.visualizacoes.length}</div>
        </div>
      </div>

      <div className="crud-layout">
        <aside className="crud-sidebar" aria-label="Tabelas do banco">
          {ENTITY_GROUPS.map((grp, idx) => (
            <div key={grp.group} className={idx > 0 ? 'crud-group-spacer' : ''}>
              <div className="crud-group-label">{grp.group}</div>
              {grp.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`entity-tab ${activeTable === item.key ? 'is-active' : ''}`}
                  onClick={() => {
                    if (item.key !== activeTable) {
                      setActiveTable(item.key);
                      setSearch('');
                      setIsSwitchingTable(true);
                    }
                  }}
                >
                  <span>{item.label}</span>
                  <span className="entity-count">{(db[item.key] || []).length}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="crud-panel" aria-label={`Tabela ${activeMeta.label}`}>
          <div className="crud-toolbar">
            <div>
              <h2 className="crud-toolbar-title">{activeMeta.label}</h2>
              <p className="crud-toolbar-note">{activeMeta.note}</p>
            </div>
            <div className="crud-toolbar-actions">
              <div className="search-box">
                <Search size={15} className="search-box-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Filtrar registros"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Filtrar tabela atual"
                />
                {search && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearch('')}
                    aria-label="Limpar filtro"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setFormState({ open: true, record: null })}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Novo registro</span>
              </button>
            </div>
          </div>

          {renderTable()}
        </section>
      </div>

      <EntityFormModal
        open={formState.open}
        table={activeTable}
        record={formState.record}
        db={db}
        onSubmit={handleFormSubmit}
        onClose={() => setFormState({ open: false, record: null })}
      />

      {confirmDelete && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-del-title">
          <div className="modal-dialog modal-dialog-sm">
            <div className="modal-header">
              <h2 id="confirm-del-title" className="modal-title">Confirmar exclusão</h2>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Deseja remover este registro da tabela <strong>{activeMeta.label}</strong>? Restrições de
                integridade referencial serão verificadas antes da exclusão.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  await onDelete(target.table, target.key);
                }}
              >
                Excluir registro
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-reset-title">
          <div className="modal-dialog modal-dialog-sm">
            <div className="modal-header">
              <h2 id="confirm-reset-title" className="modal-title">Restaurar povoamento inicial</h2>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Todas as alterações no banco de dados PostgreSQL serão substituídas pelos registros iniciais do Lumiere.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  setConfirmReset(false);
                  await onResetDatabase();
                }}
              >
                Restaurar dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
