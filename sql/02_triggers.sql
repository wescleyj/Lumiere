-- =============================================================================
-- LUMIERE — Sistema de Filmes On-line
-- Script 02: Gatilhos (Triggers) e Funções de Regras de Negócio (PL/pgSQL)
-- =============================================================================

-- Função auxiliar para converter a classificação indicativa DJCTQ em ordem numérica
CREATE OR REPLACE FUNCTION fn_ordem_classificacao(p_classificacao VARCHAR)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN CASE TRIM(COALESCE(p_classificacao, '18'))
        WHEN 'L'  THEN 0
        WHEN '10' THEN 10
        WHEN '12' THEN 12
        WHEN '14' THEN 14
        WHEN '16' THEN 16
        WHEN '18' THEN 18
        ELSE 18
    END;
END;
$$;

-- -----------------------------------------------------------------------------
-- Trigger 1: Validação de idade mínima (>= 18 anos) e normalização de e-mail
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_usuario_idade_minima()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.email := LOWER(TRIM(NEW.email));

    IF AGE(NEW.data_cadastro, NEW.data_nascimento) < INTERVAL '18 years' THEN
        RAISE EXCEPTION 'O titular da conta precisa ter no mínimo 18 anos completos na data de cadastro.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuario_idade_minima ON usuario;
CREATE TRIGGER trg_usuario_idade_minima
    BEFORE INSERT OR UPDATE ON usuario
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_usuario_idade_minima();

-- -----------------------------------------------------------------------------
-- Trigger 2: Unicidade de assinatura Ativa por usuário e preenchimento de data_fim
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_assinatura_unica_ativa()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_existe_ativa BOOLEAN;
BEGIN
    IF NEW.situacao = 'Ativa' THEN
        SELECT EXISTS (
            SELECT 1
            FROM assinatura a
            WHERE a.id_usuario = NEW.id_usuario
              AND a.situacao = 'Ativa'
              AND (TG_OP = 'INSERT' OR a.id_assinatura <> NEW.id_assinatura)
        ) INTO v_existe_ativa;

        IF v_existe_ativa THEN
            RAISE EXCEPTION 'Este usuário já possui uma assinatura Ativa vigente. Cancele ou suspenda a anterior antes de ativar outra.';
        END IF;
    END IF;

    IF NEW.situacao = 'Cancelada' AND NEW.data_fim IS NULL THEN
        NEW.data_fim := GREATEST(CURRENT_DATE, NEW.data_inicio);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assinatura_unica_ativa ON assinatura;
CREATE TRIGGER trg_assinatura_unica_ativa
    BEFORE INSERT OR UPDATE ON assinatura
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_assinatura_unica_ativa();

-- -----------------------------------------------------------------------------
-- Trigger 3: Controle de classificação máxima para perfis infantis (até 12 anos)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_perfil_controle_infantil()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.infantil AND fn_ordem_classificacao(NEW.classificacao_max) > 12 THEN
        RAISE EXCEPTION 'Perfis infantis aceitam classificação máxima até 12 anos (L, 10 ou 12).';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfil_controle_infantil ON perfil;
CREATE TRIGGER trg_perfil_controle_infantil
    BEFORE INSERT OR UPDATE ON perfil
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_perfil_controle_infantil();

-- -----------------------------------------------------------------------------
-- Trigger 4: Participação total (1,N) de Usuario em Possui -> Perfil
-- Impede que um usuário existente fique sem pelo menos 1 perfil associado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_perfil_participacao_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_usuario_existe BOOLEAN;
    v_possui_perfil  BOOLEAN;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.id_usuario = OLD.id_usuario THEN
        RETURN NULL;
    END IF;

    SELECT EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = OLD.id_usuario)
      INTO v_usuario_existe;

    IF v_usuario_existe THEN
        SELECT EXISTS (SELECT 1 FROM perfil p WHERE p.id_usuario = OLD.id_usuario)
          INTO v_possui_perfil;

        IF NOT v_possui_perfil THEN
            RAISE EXCEPTION 'Regra 1,N: todo usuário precisa manter ao menos 1 perfil ativo.';
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfil_participacao_total ON perfil;
CREATE CONSTRAINT TRIGGER trg_perfil_participacao_total
    AFTER DELETE OR UPDATE OF id_usuario ON perfil
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_perfil_participacao_total();

-- -----------------------------------------------------------------------------
-- Trigger 5: Coerência de data_inclusao vs ano_lancamento e título original
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_filme_validar_inclusao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TRIM(COALESCE(NEW.titulo_original, '')) = '' THEN
        NEW.titulo_original := NEW.titulo;
    END IF;

    IF EXTRACT(YEAR FROM NEW.data_inclusao)::INTEGER < NEW.ano_lancamento THEN
        RAISE EXCEPTION 'A data de inclusão no catálogo não pode ser anterior ao ano de lançamento do filme.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_filme_validar_inclusao ON filme;
CREATE TRIGGER trg_filme_validar_inclusao
    BEFORE INSERT OR UPDATE ON filme
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_filme_validar_inclusao();

-- -----------------------------------------------------------------------------
-- Trigger 6: Participação total (1,M) de Filme em Pertence_a -> Genero
-- Garante que todo filme existente permaneça vinculado a ao menos 1 gênero.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_filme_participacao_genero()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_filme_existe BOOLEAN;
    v_tem_genero   BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM filme f WHERE f.id_filme = OLD.id_filme)
      INTO v_filme_existe;

    IF v_filme_existe THEN
        SELECT EXISTS (SELECT 1 FROM pertence_a pa WHERE pa.id_filme = OLD.id_filme)
          INTO v_tem_genero;

        IF NOT v_tem_genero THEN
            RAISE EXCEPTION 'Regra 1,M: todo filme deve permanecer associado a pelo menos 1 gênero.';
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_filme_participacao_genero ON pertence_a;
CREATE CONSTRAINT TRIGGER trg_filme_participacao_genero
    AFTER DELETE ON pertence_a
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_filme_participacao_genero();

-- -----------------------------------------------------------------------------
-- Trigger 7: Controle parental, limite de minutos e conclusão em Visualizacao
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_visualizacao_validar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_perfil RECORD;
    v_filme  RECORD;
BEGIN
    SELECT id_perfil, nome, infantil, classificacao_max
      INTO v_perfil
      FROM perfil
     WHERE id_perfil = NEW.id_perfil;

    SELECT id_filme, titulo, duracao_min, classificacao
      INTO v_filme
      FROM filme
     WHERE id_filme = NEW.id_filme;

    IF v_perfil IS NULL OR v_filme IS NULL THEN
        RETURN NEW;
    END IF;

    IF (v_perfil.infantil AND fn_ordem_classificacao(v_filme.classificacao) > 12)
       OR fn_ordem_classificacao(v_filme.classificacao) > fn_ordem_classificacao(v_perfil.classificacao_max) THEN
        RAISE EXCEPTION 'Controle parental: o perfil "%" (até %) não tem permissão para assistir "%" (%).',
            v_perfil.nome, v_perfil.classificacao_max, v_filme.titulo, v_filme.classificacao;
    END IF;

    IF NEW.minutos_assistidos > v_filme.duracao_min THEN
        RAISE EXCEPTION 'Os minutos assistidos (%) não podem ultrapassar a duração do filme (% min).',
            NEW.minutos_assistidos, v_filme.duracao_min;
    END IF;

    IF NEW.minutos_assistidos = v_filme.duracao_min THEN
        NEW.conclusao := TRUE;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_visualizacao_validar ON visualizacao;
CREATE TRIGGER trg_visualizacao_validar
    BEFORE INSERT OR UPDATE ON visualizacao
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_visualizacao_validar();

-- -----------------------------------------------------------------------------
-- Trigger 8: Controle parental em Avalia (avaliação por perfil)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_avalia_controle_parental()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_perfil RECORD;
    v_filme  RECORD;
BEGIN
    SELECT id_perfil, nome, infantil, classificacao_max
      INTO v_perfil
      FROM perfil
     WHERE id_perfil = NEW.id_perfil;

    SELECT id_filme, titulo, classificacao
      INTO v_filme
      FROM filme
     WHERE id_filme = NEW.id_filme;

    IF v_perfil IS NULL OR v_filme IS NULL THEN
        RETURN NEW;
    END IF;

    IF (v_perfil.infantil AND fn_ordem_classificacao(v_filme.classificacao) > 12)
       OR fn_ordem_classificacao(v_filme.classificacao) > fn_ordem_classificacao(v_perfil.classificacao_max) THEN
        RAISE EXCEPTION 'Controle parental: o perfil "%" não pode avaliar obras acima de sua classificação (%).',
            v_perfil.nome, v_perfil.classificacao_max;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avalia_controle_parental ON avalia;
CREATE TRIGGER trg_avalia_controle_parental
    BEFORE INSERT OR UPDATE ON avalia
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_avalia_controle_parental();
