# Lumiere — Sistema de Filmes On-line

Sistema Web e Banco de Dados Relacional para gerenciamento de uma plataforma de streaming de filmes, desenvolvido como Trabalho Prático das disciplinas de **Banco de Dados I (BD I)** e **Laboratório de Banco de Dados I (LBD I)** do curso de Engenharia de Computação do **CEFET-MG**.

## 📋 Sobre o Projeto

O **Lumiere** modela e implementa o núcleo de dados e a interface web de um serviço de filmes on-line, contemplando o ciclo completo de assinaturas, perfis de acesso com controle parental, catálogo de filmes, gêneros, profissionais do audiovisual (diretores e elenco), avaliações e histórico de visualizações.

* **Instituição:** Centro Federal de Educação Tecnológica de Minas Gerais (CEFET-MG)
* **Disciplinas:** Banco de Dados I e Laboratório de Banco de Dados I (5º Período — 2º Semestre de 2026)
* **Professor:** Evandrino G. Barros

## ✨ Funcionalidades

* **Gestão de Usuários e Planos:** Cadastro de titulares, planos comerciais (telas simultâneas, qualidade máxima e preço) e histórico de assinaturas.
* **Perfis e Controle Parental:** Múltiplos perfis por conta com suporte a modo infantil e limite de classificação indicativa.
* **Catálogo Audiovisual:** Cadastro de filmes com gêneros, direção obrigatória e elenco opcional (com registro de personagens).
* **Interação e Consumo:** Registro de sessões de visualização (minutos assistidos e conclusão) e avaliações por perfil (nota e comentário).
* **Operações CRUD:** Inclusão, alteração, consulta e remoção de registros em todas as tabelas do banco com validação em banco de dados e gatilhos (*triggers*).
* **Relatórios Analíticos (SQL):** Consultas estruturadas executadas em tempo real no PostgreSQL envolvendo junções internas (`INNER JOIN`), junções externas (`LEFT JOIN`), agrupamentos (`GROUP BY`), filtros de grupo (`HAVING`) e subconsultas.

## 🗂️ Estrutura do Repositório

```text
Lumiere/
├── docs/
│   ├── Modelo_Conceitual.md       # Documentação detalhada do DER (entidades, atributos e relacionamentos)
│   ├── Modelo_Relacional.md       # Universo de discurso, regras de negócio, MDR, triggers e consultas
│   ├── diagramaDER_antigo.pdf     # Primeira versão do diagrama DER
│   └── diagramaDER_final.pdf      # Diagrama Entidade-Relacionamento final gerado no DIA
├── sql/
│   ├── 01_ddl.sql                 # Criação das 11 tabelas, restrições, view e índices (MDR)
│   ├── 02_triggers.sql            # 8 gatilhos de regras de negócio em PL/pgSQL
│   ├── 03_seed.sql                # Povoamento inicial do banco de dados (>= 5 registros por tabela)
│   └── 04_queries.sql             # 5 consultas SQL utilizadas nos relatórios do sistema
├── src/
│   ├── backend/                   # API REST em Node.js + Express + pg (PostgreSQL)
│   └── frontend/                  # Aplicação Web em React 19 + Vite 6
└── README.md
```

## 📐 Documentação e Etapas do Trabalho

1. **Universo de Discurso e Regras de Negócio:** Definição textual do domínio e de 12 regras de negócio em [`docs/Modelo_Relacional.md`](docs/Modelo_Relacional.md).
2. **Modelagem Conceitual (DER):** Diagramação na notação MER (ferramenta DIA). Consulte [`docs/Modelo_Conceitual.md`](docs/Modelo_Conceitual.md) e [`docs/diagramaDER_final.pdf`](docs/diagramaDER_final.pdf).
3. **Modelagem Relacional (MDR) e DDL:** Mapeamento do DER para 11 tabelas relacionais (`sql/01_ddl.sql`), visão `vw_usuario_detalhes` e 8 gatilhos em PL/pgSQL (`sql/02_triggers.sql`).
4. **Povoamento (DML):** Carga inicial com registros válidos em todas as tabelas (`sql/03_seed.sql`).
5. **Sistema Web:** Interface React + Vite integrada à API REST Node.js/Express conectada ao PostgreSQL.

## 🛠️ Tecnologias Utilizadas

* **Modelagem Conceitual:** DIA Diagram Editor (Notação MER)
* **Banco de Dados:** PostgreSQL 16+ (com PL/pgSQL para triggers)
* **Back-end:** Node.js 22 + Express + `node-postgres` (`pg`)
* **Front-end:** React 19 + Vite 6 + CSS Custom Properties (`lucide-react`)

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos e Banco de Dados (PostgreSQL)

Crie o usuário e o banco `lumiere` no PostgreSQL e execute os scripts da pasta `sql/` na ordem:

```bash
# Exemplo de criação de role e banco no PostgreSQL local
sudo -u postgres psql -c "CREATE ROLE lumiere WITH LOGIN PASSWORD 'lumiere';"
sudo -u postgres createdb -O lumiere lumiere

# Criação do esquema, triggers e povoamento inicial
PGPASSWORD=lumiere psql -v ON_ERROR_STOP=1 -h localhost -U lumiere -d lumiere \
  -f sql/01_ddl.sql \
  -f sql/02_triggers.sql \
  -f sql/03_seed.sql
```

*(Opcionalmente, as 5 consultas dos relatórios podem ser executadas diretamente com `-f sql/04_queries.sql`.)*

> **Nota para Fedora Linux:** após instalar `postgresql-server`, inicialize o banco com `sudo postgresql-setup --initdb`, altere `ident` para `scram-sha-256` em `/var/lib/pgsql/data/pg_hba.conf` para permitir conexões TCP por senha em `localhost`, e inicie o serviço com `sudo systemctl enable --now postgresql`.

### 2. Executar o Back-end (API REST)

```bash
cd src/backend
cp .env.example .env   # Ajuste PORT e DATABASE_URL se necessário
npm install
npm run db:init        # Alternativa via Node para aplicar DDL, triggers e seed
npm start              # Sobe a API em http://localhost:3001
```

Principais endpoints expostos em `/api`:

* `GET /api/health` e `GET /api/state`
* `POST /api/reset`
* `GET /api/reports` (suporta `?situacao=` e `?minViews=`)
* CRUD completo (`GET`, `POST`, `PUT /:key`, `DELETE /:key`) em `/api/planos`, `/api/usuarios`, `/api/assinaturas`, `/api/perfis`, `/api/generos`, `/api/pessoas`, `/api/filmes`, `/api/atua`, `/api/visualizacoes`, `/api/avaliacoes` e `/api/pertence-a`.

### 3. Executar o Front-end (React + Vite)

Em outro terminal:

```bash
cd src/frontend
npm install
npm run dev            # Sobe a interface em http://localhost:5173 (proxy /api -> :3001)
```

Para servir a aplicação em produção diretamente pelo back-end:

```bash
cd src/frontend && npm run build
cd ../backend && npm start
```

## 🎥 Vídeo de Apresentação

* **Link da demonstração do sistema:** *Link do video*

## 👥 Integrantes

* **GIOVANNI ESTEVAM DOS SANTOS** — *[GitHub](https://github.com/mavettse)*
* **JOÃO VITOR LOPES FAGUNDES** — *[GitHub](https://github.com/joaovitorf4)*
* **RAFAEL EUSTÁQUIO PINTO** — *[GitHub](https://github.com/rafaelrat)*
* **WESCLEY JÚNIOR GONÇALVES NAVARRO** — *[GitHub](https://github.com/wescleyyj)*
