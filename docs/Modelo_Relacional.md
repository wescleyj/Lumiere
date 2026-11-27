# Modelo de Dados Relacional (MDR) — Lumiere (Sistema de Filmes On-line)

## 1. Descrição Textual do Banco de Dados (Universo de Discurso)

O banco de dados **BD Lumiere — Sistema de Filmes On-line** gerencia as operações centrais de uma plataforma de streaming de filmes, abrangendo clientes titulares, planos comerciais, contratos de assinatura, perfis de exibição, catálogo audiovisual, gêneros, profissionais de cinema, histórico de reproduções e avaliações.

Um cliente interessado no serviço realiza seu cadastro como usuário titular informando nome completo, e-mail único, CPF único, senha de acesso, data de nascimento e data de cadastro, a partir da qual sua idade é derivada dinamicamente. Cada usuário titular precisa possuir obrigatoriamente ao menos um perfil de exibição associado à sua conta, podendo criar perfis adicionais para familiares. Os perfis possuem nome de exibição, indicador de modo infantil e classificação indicativa máxima permitida, assegurando controle parental sobre os conteúdos acessados.

Para usufruir do catálogo, o usuário contrata assinaturas vinculadas a um plano comercial ofertado pela plataforma. Cada plano possui nome único, preço mensal, quantidade máxima de telas simultâneas e qualidade máxima de vídeo suportada (HD, Full HD ou 4K). A assinatura registra a data de início, a data opcional de encerramento ou renovação e a situação contratual vigente (Ativa, Cancelada ou Suspensa), preservando o histórico de contratações de cada titular ao longo do tempo.

O catálogo reúne filmes caracterizados por título localizado, título original, ano de lançamento, sinopse, duração em minutos, classificação indicativa etária e data de inclusão. Todo filme é classificado em pelo menos um gênero temático, o qual armazena nome único e breve descrição, podendo uma obra pertencer a múltiplos gêneros simultaneamente. Todo filme também possui obrigatoriamente um diretor responsável cadastrado na tabela de profissionais do audiovisual, que registra nome, data de nascimento e nacionalidade. Opcionalmente, profissionais atuam em filmes compondo o elenco com registro do personagem interpretado e da função desempenhada.

Durante o uso da plataforma, os perfis realizam sessões de visualização de filmes, registrando data e hora de início, minutos assistidos e indicador de conclusão. Além disso, cada perfil pode avaliar filmes do catálogo atribuindo uma nota inteira de 1 a 5, data da avaliação e comentário textual, permitindo acompanhar a recepção das obras sem duplicidade de avaliação por perfil e filme.

### Regras de Negócio

1. **Participação total de Usuário em Perfil (`1,N`):** Nenhum usuário titular pode existir sem ao menos um perfil vinculado à sua conta, e todo perfil pertence a exatamente um usuário.
2. **Maioridade do Titular:** O titular da conta deve possuir idade mínima de 18 anos completos na data de cadastro, além de e-mail e CPF únicos no sistema.
3. **Unicidade de Assinatura Ativa:** Cada usuário pode manter no máximo uma assinatura com situação `Ativa` por vez, preservando assinaturas `Cancelada` ou `Suspensa` no histórico.
4. **Vigência Contratual:** Em uma assinatura, a data de encerramento (`data_fim`), quando informada, não pode ser anterior à data de início (`data_inicio`).
5. **Controle Parental de Perfil Infantil:** Perfis marcados com o indicador `infantil = TRUE` só podem possuir classificação máxima de até 12 anos (`L`, `10` ou `12`).
6. **Classificação Obrigatória de Gênero (`1,M`):** Todo filme presente no catálogo deve estar vinculado a pelo menos um gênero na relação `Pertence_a`.
7. **Obrigatoriedade de Direção (`1,1`):** Todo filme possui obrigatoriamente um diretor responsável referenciado na tabela `Pessoa`.
8. **Elenco Opcional (`0,M`):** A participação de atores e atrizes (`Atua`) é opcional para um filme, permitindo obras sem elenco cadastrado (como animações), e impede duplicidade da mesma pessoa interpretando o mesmo personagem no mesmo filme.
9. **Coerência de Inclusão no Catálogo:** A data de inclusão do filme (`data_inclusao`) não pode ter ano anterior ao ano de lançamento (`ano_lancamento`).
10. **Controle Parental na Reprodução e Avaliação:** Um perfil não pode registrar visualização nem avaliação de um filme cuja classificação indicativa supere o limite configurado no perfil (ou 12 anos em perfis infantis).
11. **Limite e Conclusão Automática da Visualização:** Os minutos assistidos em uma sessão devem ser maiores que zero e não podem exceder a duração total do filme; ao atingir a duração integral, a sessão é marcada como concluída (`conclusao = TRUE`).
12. **Avaliação Única por Perfil e Filme:** Cada perfil pode registrar no máximo uma avaliação para cada filme (chave primária composta `(id_perfil, id_filme)`), com nota inteira entre 1 e 5.

---

## 2. Mapeamento DER → Modelo de Dados Relacional (MDR)

O Diagrama Entidade-Relacionamento (`docs/diagramaDER_final.pdf`) foi mapeado para **11 tabelas relacionais** em PostgreSQL (`sql/01_ddl.sql`) e **1 visão (`VIEW`)**:

| Tabela / Visão | Origem no DER | Chave Primária (PK) | Chaves Estrangeiras (FK) | Observações |
| :--- | :--- | :--- | :--- | :--- |
| `plano` | Entidade `Plano` | `id_plano` | — | `nome` único; `CHECK` em preço, telas e qualidade |
| `usuario` | Entidade `Usuario` | `id_usuario` | — | `email` e `cpf` únicos; `vw_usuario_detalhes` calcula `idade` |
| `assinatura` | Entidade `Assinatura` + `Contrata` + `Refere-se_a` | `id_assinatura` | `id_usuario` → `usuario`, `id_plano` → `plano` | `ON DELETE RESTRICT` preserva histórico contratual |
| `perfil` | Entidade `Perfil` + `Possui` | `id_perfil` | `id_usuario` → `usuario` | `ON DELETE CASCADE` + trigger `DEFERRABLE` para regra `1,N` |
| `genero` | Entidade `Genero` | `id_genero` | — | `nome` único |
| `pessoa` | Entidade `Pessoa` | `id_pessoa` | — | Profissionais (diretores e elenco) |
| `filme` | Entidade `Filme` + `Direcao` (`1:N`) | `id_filme` | `id_diretor` → `pessoa` | Direção obrigatória (`NOT NULL`) |
| `pertence_a` | Relacionamento `N:M` `Pertence_a` | `(id_filme, id_genero)` | `id_filme` → `filme`, `id_genero` → `genero` | Participação total `1,M` garantida por trigger `DEFERRABLE` |
| `atua` | Relacionamento `N:M` `Atua` | `id_atua` | `id_pessoa` → `pessoa`, `id_filme` → `filme` | `UNIQUE (id_pessoa, id_filme, personagem)` + `funcao` |
| `visualizacao` | Entidade `Visualizacao` + `Realiza` + `Exibido_em` | `id_visualizacao` | `id_perfil` → `perfil`, `id_filme` → `filme` | Registra sessões de exibição |
| `avalia` | Relacionamento `N:M` `Avalia` | `(id_perfil, id_filme)` | `id_perfil` → `perfil`, `id_filme` → `filme` | `nota` entre 1 e 5, `data_avaliacao`, `comentario` |
| `vw_usuario_detalhes` | Atributo derivado `idade` de `Usuario` | — | — | `EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento))` |

> **Nota sobre atributos auxiliares da interface Web:** As colunas `perfil.avatar_color`, `filme.capa_url` e `filme.capa_tema` foram mantidas no esquema relacional para persistir diretamente no PostgreSQL as preferências visuais de avatar e capa exibidas pelo front-end React.

---

## 3. Gatilhos (Triggers) Implementados (`sql/02_triggers.sql`)

Foram implementados **8 gatilhos** em PL/pgSQL com suporte da função auxiliar `fn_ordem_classificacao`:

1. **`trg_usuario_idade_minima`** (`BEFORE INSERT OR UPDATE ON usuario`): normaliza `email` em minúsculas e valida idade mínima de 18 anos na data de cadastro.
2. **`trg_assinatura_unica_ativa`** (`BEFORE INSERT OR UPDATE ON assinatura`): impede mais de uma assinatura `Ativa` simultânea para o mesmo usuário e preenche `data_fim` automaticamente ao cancelar.
3. **`trg_perfil_controle_infantil`** (`BEFORE INSERT OR UPDATE ON perfil`): impede que perfis infantis possuam classificação indicativa acima de `12`.
4. **`trg_perfil_participacao_total`** (`CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED ON perfil`): impede que um usuário existente fique com zero perfis após exclusão ou transferência.
5. **`trg_filme_validar_inclusao`** (`BEFORE INSERT OR UPDATE ON filme`): preenche `titulo_original` com `titulo` quando omitido e impede inclusão no catálogo com ano anterior ao `ano_lancamento`.
6. **`trg_filme_participacao_genero`** (`CONSTRAINT TRIGGER ... DEFERRABLE INITIALLY DEFERRED ON pertence_a`): impede que um filme existente fique sem nenhum gênero associado.
7. **`trg_visualizacao_validar`** (`BEFORE INSERT OR UPDATE ON visualizacao`): aplica controle parental, impede `minutos_assistidos > duracao_min` e marca `conclusao = TRUE` ao completar a duração total.
8. **`trg_avalia_controle_parental`** (`BEFORE INSERT OR UPDATE ON avalia`): impede que um perfil avalie filmes fora de seu limite etário.

---

## 4. Povoamento Inicial (`sql/03_seed.sql`)

Todas as **11 tabelas** recebem pelo menos 5 registros válidos no script inicial, com ressincronização automática de todas as sequences `IDENTITY`:

* `plano`: 5 registros
* `usuario`: 6 registros
* `assinatura`: 7 registros
* `perfil`: 8 registros
* `genero`: 7 registros
* `pessoa`: 12 registros
* `filme`: 10 registros (com destaque para o Filme 10 *O Menino e a Garça* sem registros em `atua`, demonstrando participação parcial `0,M`)
* `pertence_a`: 19 associações filme–gênero
* `atua`: 12 registros de elenco
* `visualizacao`: 12 sessões de reprodução (com destaque para o Filme 9 *Retratos Fantasmas* sem exibições, evidenciando o `LEFT JOIN`)
* `avalia`: 9 avaliações

---

## 5. Consultas Analíticas (`sql/04_queries.sql`)

1. **Junção Interna (`INNER JOIN`):** `assinatura` + `usuario` + `plano`, listando contratos, mensalidades, qualidade máxima e situação.
2. **Junção Externa (`LEFT JOIN`):** `filme` + `pessoa` (diretor) + `LEFT JOIN visualizacao`, preservando obras sem visualizações (`Retratos Fantasmas`).
3. **Agrupamento (`GROUP BY`):** desempenho do catálogo por gênero (`genero` + `pertence_a` + `filme` + subconsultas agregadas de `visualizacao` e `avalia` para evitar produto cartesiano).
4. **Filtro de Grupo (`HAVING`):** deriva da consulta anterior filtrando gêneros com volume mínimo de visualizações (`HAVING COALESCE(SUM(vs.qtd_visualizacoes), 0) >= 2`).
5. **Subconsulta (`SUBQUERY`):** filmes cuja nota média em `avalia` supera estritamente a média global calculada pela subconsulta `(SELECT AVG(nota) FROM avalia)`.

---

## 6. Arquitetura do Sistema Web e Endpoints da API REST

O back-end foi desenvolvido em **Node.js 22 + Express + `node-postgres` (`pg`)** em `src/backend/`, conectando-se diretamente ao PostgreSQL e expondo a interface REST consumida pelo front-end **React 19 + Vite 6** (`src/frontend/src/data/api.js`) via proxy `/api`:

* `GET /api/health` — Verifica a conectividade com o banco `lumiere` e retorna o horário atual do servidor PostgreSQL.
* `GET /api/state` — Carrega o estado relacional completo (todas as tabelas + `vw_usuario_detalhes` + gêneros agregados por filme).
* `POST /api/reset` — Restaura o banco para o povoamento inicial executando `TRUNCATE ... RESTART IDENTITY CASCADE` e `sql/03_seed.sql` em transação.
* `GET /api/reports` e `GET /api/reports/:id` — Executa no PostgreSQL as 5 consultas SQL obrigatórias com suporte aos filtros `situacao` e `minViews`.
* **Rotas CRUD (`GET`, `POST`, `PUT /:key`, `DELETE /:key`):** `/api/planos`, `/api/usuarios` (criando automaticamente o perfil inicial na mesma transação), `/api/assinaturas`, `/api/perfis`, `/api/generos`, `/api/pessoas`, `/api/filmes` (sincronizando `pertence_a` atomicamente), `/api/atua`, `/api/visualizacoes` e `/api/avaliacoes` (chave composta `id_perfil-id_filme`), além de `/api/pertence-a` (`GET`, `POST`, `DELETE /:id_filme/:id_genero`).

---

## 7. Execução e Saídas Verificadas (PostgreSQL 18.6)

Comando executado para criar esquema, triggers, povoamento e rodar os relatórios diretamente no `psql`:

```bash
PGPASSWORD=lumiere psql -v ON_ERROR_STOP=1 -h localhost -U lumiere -d lumiere \
  -f sql/01_ddl.sql \
  -f sql/02_triggers.sql \
  -f sql/03_seed.sql \
  -f sql/04_queries.sql
```

Resumo das saídas obtidas:

* **Contagem inicial por tabela:** `plano` (5), `usuario` (6), `assinatura` (7), `perfil` (8), `genero` (7), `pessoa` (12), `filme` (10), `pertence_a` (19), `atua` (12), `visualizacao` (12), `avalia` (9).
* **Consulta 1 (`INNER JOIN`):** retornou 7 contratos de assinatura com titular, e-mail, plano, mensalidade, qualidade e situação.
* **Consulta 2 (`LEFT JOIN`):** retornou todos os 10 filmes do catálogo, preservando *Retratos Fantasmas* com `0` visualizações.
* **Consulta 3 (`GROUP BY`):** retornou os 7 gêneros consolidados (ex.: *Drama*: 7 filmes, 8 visualizações, 1094 min, nota média `4.50`; *Ficção Científica*: 3 filmes, 5 visualizações, 786 min, nota média `4.25`; *Documentário*: 1 filme, 0 visualizações).
* **Consulta 4 (`HAVING >= 2`):** filtrou os 5 gêneros com pelo menos 2 visualizações (*Drama*, *Ficção Científica*, *Ação*, *Animação* e *Suspense*).
* **Consulta 5 (`SUBCONSULTA`):** retornou os 4 filmes com média acima da média global (`5.00`, `+0.56` acima da média): *Duna: Parte Dois*, *Bacurau*, *A Viagem de Chihiro* e *Cidade de Deus*.
