# Modelo Conceitual (DER) — Lumiere (Sistema de Filmes On-line)

## 1. Visão Geral

O **Lumiere** é uma plataforma de streaming projetada para gerenciar contas de usuários, planos comerciais, contratos de assinatura, perfis de exibição, catálogo de filmes, gêneros, profissionais do audiovisual (elenco e direção), avaliações e histórico de visualizações.

Este documento apresenta a especificação formal do **Diagrama Entidade-Relacionamento (DER)** na notação do Modelo Entidade-Relacionamento (MER), detalhando todas as entidades, atributos, relacionamentos, cardinalidades, restrições de participação e regras de negócio estruturais do banco de dados.

## 2. Entidades e Atributos

O modelo conceitual é composto por **8 entidades fortes**, cada uma identificada por sua respectiva chave primária.

### 2.1. `Usuario`

Representa a conta principal do cliente titular cadastrada na plataforma.

* **`id_usuario`** *(Chave Primária)*: Identificador único do usuário.
* **`nome`**: Nome completo do titular da conta.
* **`email`**: Endereço de e-mail utilizado para contato e autenticação.
* **`cpf`**: Cadastro de Pessoa Física do titular.
* **`senha`**: Credencial de acesso à conta.
* **`data_nascimento`**: Data de nascimento do usuário.
* **`data_cadastro`**: Data em que a conta foi registrada no sistema.
* **`idade`** *(Atributo Derivado)*: Idade atual do usuário, obtida dinamicamente a partir de `data_nascimento`.

### 2.2. `Plano`

Define as modalidades de planos de assinatura comercializados pela plataforma.

* **`id_plano`** *(Chave Primária)*: Identificador único do plano.
* **`nome`**: Nome comercial do plano (ex.: Básico, Padrão, Premium).
* **`preco_mensal`**: Valor mensal cobrado pela assinatura.
* **`max_telas`**: Quantidade máxima de dispositivos simultâneos permitidos.
* **`qualidade_max`**: Resolução máxima de vídeo suportada (ex.: HD, Full HD, 4K).

### 2.3. `Assinatura`

Registra o vínculo contratual de serviço entre um `Usuario` e um `Plano`.

* **`id_assinatura`** *(Chave Primária)*: Identificador único da assinatura.
* **`data_inicio`**: Data de início da vigência do contrato.
* **`data_fim`**: Data de encerramento ou renovação da assinatura.
* **`situacao`**: Estado atual da assinatura (ex.: Ativa, Cancelada, Suspensa).

### 2.4. `Perfil`

Representa os perfis individuais de acesso vinculados a uma conta de `Usuario`, permitindo personalização de recomendações, avaliações e controle parental.

* **`id_perfil`** *(Chave Primária)*: Identificador único do perfil.
* **`nome`**: Nome de exibição do perfil.
* **`infantil`**: Indicador que define se o perfil é restrito a conteúdo infantil.
* **`classificacao_max`**: Classificação indicativa máxima permitida para exibição no perfil.

### 2.5. `Filme`

Armazena as informações das obras audiovisuais disponíveis no catálogo da plataforma.

* **`id_filme`** *(Chave Primária)*: Identificador único do filme.
* **`titulo`**: Título de exibição localizado.
* **`titulo_original`**: Título original da obra.
* **`ano_lancamento`**: Ano de lançamento do filme.
* **`sinopse`**: Resumo descritivo da trama.
* **`duracao_min`**: Duração total do filme em minutos.
* **`classificacao`**: Classificação indicativa etária da obra.
* **`data_inclusao`**: Data de entrada do filme no catálogo.

### 2.6. `Genero`

Define as categorias temáticas utilizadas para classificar os filmes do catálogo.

* **`id_genero`** *(Chave Primária)*: Identificador único do gênero.
* **`nome`**: Nome do gênero (ex.: Ação, Drama, Animação, Ficção Científica).
* **`descricao`**: Breve descrição das características do gênero.

### 2.7. `Pessoa`

Representa profissionais ligados à produção audiovisual, contemplando atores, atrizes e diretores.

* **`id_pessoa`** *(Chave Primária)*: Identificador único da pessoa.
* **`nome`**: Nome completo ou artístico.
* **`data_nascimento`**: Data de nascimento.
* **`nacionalidade`**: País de origem.

### 2.8. `Visualizacao`

Registra cada sessão de reprodução de um filme realizada por um determinado perfil.

* **`id_visualizacao`** *(Chave Primária)*: Identificador único do registro de visualização.
* **`data_hora_inicio`**: Data e horário em que a reprodução foi iniciada.
* **`minutos_assistidos`**: Tempo total assistido na sessão, em minutos.
* **`conclusao`**: Indicador que informa se o filme foi assistido até o final.

## 3. Relacionamentos, Cardinalidades e Participação

A tabela abaixo consolida os **9 relacionamentos** presentes no DER, com suas respectivas razões de cardinalidade, restrições de participação (na notação $(\min, \max)$) e atributos próprios.

| Relacionamento | Entidade A | Entidade B | Razão de Cardinalidade | Participação de A | Participação de B | Atributos do Relacionamento |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **`Contrata`** | `Usuario` | `Assinatura` | $1:N$ | Parcial $(0,N)$ | Total $(1,1)$ | — |
| **`Refere-se_a`** | `Plano` | `Assinatura` | $1:N$ | Parcial $(0,N)$ | Total $(1,1)$ | — |
| **`Possui`** | `Usuario` | `Perfil` | $1:N$ | Total $(1,N)$ | Total $(1,1)$ | — |
| **`Realiza`** | `Perfil` | `Visualizacao` | $1:N$ | Parcial $(0,N)$ | Total $(1,1)$ | — |
| **`Exibido_em`** | `Filme` | `Visualizacao` | $1:N$ | Parcial $(0,N)$ | Total $(1,1)$ | — |
| **`Avalia`** | `Perfil` | `Filme` | $N:M$ | Parcial $(0,N)$ | Parcial $(0,M)$ | `nota`, `data_avaliacao`, `comentario` |
| **`Pertence_a`** | `Genero` | `Filme` | $N:M$ | Parcial $(0,N)$ | Total $(1,M)$ | — |
| **`Atua`** | `Pessoa` | `Filme` | $N:M$ | Parcial $(0,N)$ | Parcial $(0,M)$ | `funcao`, `personagem` |
| **`Direcao`** | `Pessoa` | `Filme` | $1:N$ | Parcial $(0,N)$ | Total $(1,1)$ | — |

### 3.1. Descrição Detalhada dos Relacionamentos

* **`Contrata` (`Usuario` $\leftrightarrow$ `Assinatura`, $1:N$):** Um usuário pode manter um histórico com zero ou várias assinaturas ao longo do tempo, enquanto cada assinatura pertence obrigatoriamente a um único usuário.
* **`Refere-se_a` (`Plano` $\leftrightarrow$ `Assinatura`, $1:N$):** Um plano pode estar associado a várias assinaturas (ou a nenhuma, caso seja recém-cadastrado), mas toda assinatura refere-se obrigatoriamente a exatamente um plano.
* **`Possui` (`Usuario` $\leftrightarrow$ `Perfil`, $1:N$):** Todo usuário cadastrado possui obrigatoriamente ao menos um perfil de acesso, podendo criar vários perfis; cada perfil pertence exclusivamente a um único usuário.
* **`Realiza` (`Perfil` $\leftrightarrow$ `Visualizacao`, $1:N$):** Um perfil pode realizar diversas sessões de visualização, e todo registro de visualização é obrigatoriamente executado por um único perfil.
* **`Exibido_em` (`Filme` $\leftrightarrow$ `Visualizacao`, $1:N$):** Um filme pode ser exibido em múltiplas visualizações (ou ainda não ter sido assistido), enquanto toda visualização referencia obrigatoriamente um único filme.
* **`Avalia` (`Perfil` $\leftrightarrow$ `Filme`, $N:M$):** Um perfil pode avaliar vários filmes e um filme pode receber avaliações de vários perfis. A relação armazena a `nota` atribuída, a `data_avaliacao` e o `comentario` textual.
* **`Pertence_a` (`Genero` $\leftrightarrow$ `Filme`, $N:M$):** Todo filme deve estar classificado em pelo menos um gênero, podendo pertencer a múltiplos gêneros simultaneamente. Um gênero pode agrupar vários filmes.
* **`Atua` (`Pessoa` $\leftrightarrow$ `Filme`, $N:M$):** Associa atores e atrizes aos filmes em que atuam, registrando o `personagem` interpretado e a `funcao` desempenhada no elenco (ex.: protagonista/principal, coadjuvante/secundário, participação especial). A participação é parcial em ambos os lados, pois uma pessoa pode atuar apenas como diretora e um filme (como animações) pode não possuir elenco de atores cadastrado.
* **`Direcao` (`Pessoa` $\leftrightarrow$ `Filme`, $1:N$):** Associa um diretor às obras dirigidas por ele. Uma pessoa pode dirigir zero ou vários filmes, enquanto todo filme possui obrigatoriamente um diretor responsável vinculado.

## 4. Resumo das Restrições de Participação (Notação MER)

Na representação gráfica do DER, as restrições de obrigatoriedade são expressas pelo tipo de linha que conecta as entidades aos relacionamentos:

* **Participação Total (Linha Dupla):**
  * `Assinatura` em `Contrata` e em `Refere-se_a`
  * `Usuario` e `Perfil` em `Possui`
  * `Visualizacao` em `Realiza` e em `Exibido_em`
  * `Filme` em `Pertence_a`
  * `Filme` em `Direcao`

* **Participação Parcial (Linha Simples):**
  * `Usuario` em `Contrata`
  * `Plano` em `Refere-se_a`
  * `Perfil` em `Realiza` e em `Avalia`
  * `Filme` em `Exibido_em`, em `Avalia` e em `Atua`
  * `Genero` em `Pertence_a`
  * `Pessoa` em `Atua` e em `Direcao`

## 5. Regras de Negócio Estruturais Representadas

1. **Conta e Perfis:** Nenhum usuário pode existir no sistema sem ao menos um perfil associado, e todo perfil pertence exclusivamente a uma conta titular.
2. **Histórico de Assinaturas:** Cada assinatura vincula obrigatoriamente um usuário a um plano comercial, preservando o histórico de vigências e situações contratuais.
3. **Rastreabilidade de Reprodução:** Cada registro de visualização corresponde à exibição de exatamente um filme por exatamente um perfil, registrando início, duração assistida e conclusão.
4. **Avaliação por Perfil:** As avaliações (nota, data e comentário) são individualizadas por perfil em relação a cada filme.
5. **Classificação Obrigatória de Gênero:** Todo filme presente no catálogo deve estar vinculado a pelo menos um gênero.
6. **Obrigatoriedade de Direção:** Todo filme cadastrado no sistema possui obrigatoriamente um diretor responsável, e um mesmo diretor pode assinar múltiplos filmes.
7. **Flexibilidade e Detalhamento de Elenco:** O vínculo de atuação entre pessoas e filmes é opcional para a obra, acomodando produções sem elenco de atores (como animações), com registro do personagem interpretado e da função no elenco (principal, secundário, etc.) quando aplicável.