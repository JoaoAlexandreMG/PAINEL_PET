-- 1. Criação do Banco de Dados
CREATE DATABASE pet_eletrica;

-- 2. Conexão ao Banco de Dados (executar após criar o banco)
\c pet_eletrica

-- 3. Criação do Schema
CREATE SCHEMA IF NOT EXISTS painel_pet;

-- 4. Criação das Tabelas

-- 4.1. Tabela de Usuários
CREATE TABLE painel_pet.usuarios (
    id SERIAL PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    itens_emprestados text[],
    curso VARCHAR(100) NOT NULL DEFAULT 'Sem Curso',
    email VARCHAR(255)
);

-- 4.2. Tabela de Itens
CREATE TABLE painel_pet.itens (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    localizacao INTEGER,
    estoque INTEGER NOT NULL CHECK (estoque >= 0)
);

-- 4.3. Tabela de Histórico de Empréstimos
CREATE TABLE painel_pet.itens_historico (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    data_emprestimo TIMESTAMP NOT NULL DEFAULT NOW(),
    data_devolucao TIMESTAMP,
    data_prevista_devolucao TIMESTAMP NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES painel_pet.usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES painel_pet.itens(id) ON DELETE CASCADE
);

-- 4.4. Tabela de Itens Emprestados (Normalização)
CREATE TABLE painel_pet.itens_emprestados (
    usuario_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    PRIMARY KEY (usuario_id, item_id),
    FOREIGN KEY (usuario_id) REFERENCES painel_pet.usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES painel_pet.itens(id) ON DELETE CASCADE
);

-- 5. Criação das Views

-- 5.1. Histórico de Empréstimos
CREATE OR REPLACE VIEW painel_pet.vw_historico_emprestimos AS
SELECT 
    ih.id,
    u.nome AS nome_usuario,
    i.nome AS nome_item,
    ih.data_emprestimo,
    ih.data_devolucao,
    ih.data_prevista_devolucao
FROM 
    painel_pet.itens_historico ih
JOIN 
    painel_pet.usuarios u ON ih.usuario_id = u.id
JOIN 
    painel_pet.itens i ON ih.item_id = i.id;

-- 5.2. Itens Atrasados
CREATE OR REPLACE VIEW painel_pet.vw_itens_atrasados AS
SELECT 
    u.id AS usuario_id,
    u.nome AS nome_usuario,
    i.id AS item_id,
    i.nome AS nome_item,
    ih.data_prevista_devolucao,
    (CURRENT_DATE - ih.data_prevista_devolucao::date) AS dias_atraso
FROM 
    painel_pet.itens_historico ih
JOIN 
    painel_pet.usuarios u ON ih.usuario_id = u.id
JOIN 
    painel_pet.itens i ON ih.item_id = i.id
WHERE 
    ih.data_devolucao IS NULL 
    AND ih.data_prevista_devolucao < CURRENT_DATE;

-- 5.3. Itens por Usuário
CREATE OR REPLACE VIEW painel_pet.vw_itens_usuario AS
SELECT 
    ih.usuario_id,
    i.id AS item_id,
    i.nome AS nome_item,
    ih.data_emprestimo,
    ih.data_devolucao,
    ih.data_prevista_devolucao
FROM 
    painel_pet.itens_historico ih
JOIN 
    painel_pet.itens i ON ih.item_id = i.id;

-- 6. Criação dos Índices (Apenas se necessário para performance)

-- Índices para melhorar consultas no histórico de empréstimos
CREATE INDEX IF NOT EXISTS idx_itens_historico_item_id 
    ON painel_pet.itens_historico (item_id);

CREATE INDEX IF NOT EXISTS idx_itens_historico_usuario_id 
    ON painel_pet.itens_historico (usuario_id);

-- 7. Criação do Procedimento Armazenado Otimizado

CREATE OR REPLACE PROCEDURE painel_pet.registrar_emprestimo(
    IN p_usuario_id INTEGER,
    IN p_item_id INTEGER,
    IN p_quantidade INTEGER,
    IN p_data_prevista_devolucao TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Iniciar uma transação
    BEGIN
        -- Verificar se o item existe e possui estoque suficiente
        IF NOT EXISTS (
            SELECT 1 
            FROM painel_pet.itens 
            WHERE id = p_item_id 
              AND estoque >= p_quantidade
        ) THEN
            RAISE EXCEPTION 'Item com ID % não encontrado ou estoque insuficiente.', p_item_id;
        END IF;

        -- Inserir no histórico de empréstimos
        INSERT INTO painel_pet.itens_historico (
            usuario_id, 
            item_id, 
            data_prevista_devolucao
        )
        VALUES (
            p_usuario_id, 
            p_item_id, 
            p_data_prevista_devolucao
        );

        -- Atualizar o estoque
        UPDATE painel_pet.itens
        SET estoque = estoque - p_quantidade
        WHERE id = p_item_id;

        -- Atualizar a tabela de itens emprestados
        INSERT INTO painel_pet.itens_emprestados (usuario_id, item_id, quantidade)
        VALUES (p_usuario_id, p_item_id, p_quantidade)
        ON CONFLICT (usuario_id, item_id) 
        DO UPDATE SET quantidade = painel_pet.itens_emprestados.quantidade + EXCLUDED.quantidade;

    EXCEPTION
        WHEN OTHERS THEN
            -- Tratar erros e reverter a transação
            RAISE;
    END;
END;
$$;

-- 8. Criação do Procedimento para Registrar Devolução
CREATE OR REPLACE PROCEDURE painel_pet.registrar_devolucao(
    IN p_usuario_id INTEGER,
    IN p_item_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_historico_id INTEGER;  -- Para armazenar o ID do histórico de empréstimo
BEGIN
    -- Verificar se o usuário possui o item emprestado
    SELECT id INTO v_historico_id
    FROM painel_pet.itens_historico
    WHERE usuario_id = p_usuario_id 
      AND item_id = p_item_id 
      AND data_devolucao IS NULL
    LIMIT 1;

    IF v_historico_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não possui o item % emprestado.', p_usuario_id, p_item_id;
    END IF;

    -- Atualizar a data de devolução no histórico de empréstimos
    UPDATE painel_pet.itens_historico
    SET data_devolucao = NOW()
    WHERE id = v_historico_id;

    -- Aumentar o estoque do item devolvido
    UPDATE painel_pet.itens
    SET estoque = estoque + 1
    WHERE id = p_item_id;

    -- Atualizar itens_emprestados no usuário
    UPDATE painel_pet.itens_emprestados
    SET quantidade = quantidade - 1
    WHERE usuario_id = p_usuario_id AND item_id = p_item_id;

END;
$$;
