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
* **Operações CRUD:** Inclusão, alteração, consulta e remoção de registros em todas as tabelas do banco.
* **Relatórios Analíticos (SQL):** Consultas estruturadas envolvendo junções internas (`INNER JOIN`), junções externas (`LEFT/RIGHT JOIN`), agrupamentos (`GROUP BY`), filtros de grupo (`HAVING`) e subconsultas.

## 🗂️ Estrutura do Repositório

```text
lumiere-db/
├── docs/
│   ├── modelo_conceitual_der.md   # Documentação detalhada do DER (entidades, atributos e relacionamentos)
│   └── diagrama_der.pdf           # Diagrama Entidade-Relacionamento gerado no DIA
├── sql/
│   ├── 01_ddl.sql                 # Criação de tabelas, restrições e chaves (MDR)
│   ├── 02_triggers.sql            # Gatilhos de regras de negócio (mínimo de 5 triggers)
│   ├── 03_seed.sql                # Povoamento inicial do banco de dados
│   └── 04_queries.sql             # Consultas SQL utilizadas nos relatórios do sistema
├── src/                           # Código-fonte da aplicação Web (frontend e backend)
└── README.md
```

## 📐 Documentação e Etapas do Trabalho

1. **Universo de Discurso e Regras de Negócio:** Definição textual do domínio e das regras de negócio estruturais e procedurais.
2. **Modelagem Conceitual (DER):** Diagramação na notação MER (ferramenta DIA). Consulte a especificação completa em [`docs/modelo_conceitual_der.md`](docs/modelo_conceitual_der.md).
3. **Modelagem Relacional (MDR) e DDL:** Mapeamento do DER para tabelas relacionais, integridade referencial e implementação de gatilhos (*triggers*).
4. **Povoamento (DML):** Carga inicial com registros válidos em todas as tabelas.
5. **Sistema Web:** Interface para manipulação de dados (CRUD) e geração dos relatórios SQL.

## 🛠️ Tecnologias Utilizadas

* **Modelagem Conceitual:** DIA Diagram Editor (Notação MER)
* **Banco de Dados:** *(ex.: Oracle Database / PostgreSQL / MySQL)*
* **Aplicação Web:** *(ex.: PHP, HTML5, CSS3, JavaScript ou stack definida pelo grupo)*

## 🚀 Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/wescleyj/Lumiere.git
   cd Lumiere
   ```

2. **Configure o Banco de Dados:**
   Execute os scripts da pasta `sql/` no SGBD na seguinte ordem:
   1. `01_ddl.sql`
   2. `02_triggers.sql`
   3. `03_seed.sql`

3. **Execute a Aplicação Web:**
   * Configure as credenciais de conexão com o banco de dados no arquivo de configuração em `src/`.
   * Inicie o servidor web local e acesse a aplicação pelo navegador.

## 🎥 Vídeo de Apresentação

* **Link da demonstração do sistema:** *Link do video*

## 👥 Integrantes

* **GIOVANNI ESTEVAM DOS SANTOS** — *[GitHub](https://github.com/mavettse)*
* **JOÃO VITOR LOPES FAGUNDES** — *[GitHub](https://github.com/joaovitorf4)*
* **RAFAEL EUSTÁQUIO PINTO** — *[GitHub](https://github.com/rafaelrat)*
* **WESCLEY JÚNIOR GONÇALVES NAVARRO** — *[GitHub](https://github.com/wescleyyj)*
