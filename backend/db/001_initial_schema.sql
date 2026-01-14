-- 1. CRIAÇÃO DE TIPOS ENUM (INTEGRIDADE DO ESTADO)
-- Tipos de status da Cartela
CREATE TYPE status_cartela AS ENUM ('DISPONIVEL', 'RESERVADA', 'PAGA_ATIVA', 'INATIVA');

-- Tipos de Perfis de Usuário
CREATE TYPE tipo_perfil AS ENUM ('CLIENTE', 'GESTOR');

-- Tipos de Logs para Auditoria
CREATE TYPE tipo_log AS ENUM ('SORTEIO', 'PAGAMENTO', 'BINGO_ACIONADO', 'VITORIA_CONFIRMADA', 'RESERVA', 'LIBERACAO');

-- 2. TABELA USUARIOS (Serviço USERS)
CREATE TABLE Usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    whatsapp_id VARCHAR(20) UNIQUE, -- CRÍTICO para o MESSAGING, pode ser NULL no registro inicial
    perfil tipo_perfil NOT NULL
);

-- 3. TABELA JOGOS (Serviço GAMES)
CREATE TABLE Jogos (
    id_jogo SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    data_inicio TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    status_jogo VARCHAR(50) NOT NULL, -- Ex: 'ABERTO', 'PAUSADO', 'FINALIZADO'
    
    -- Array para armazenar quais padrões estão ativos (L, U, LINHA, etc.)
    padroes_ativos VARCHAR[] NOT NULL, 
    
    -- Array para persistir o histórico das bolas sorteadas no formato B-7, I-20...
    bolas_sorteadas VARCHAR[] DEFAULT '{}' -- Inicializado como array vazio
);

-- 4. TABELA CARTELLAS (Serviço CARDS)
CREATE TABLE Cartelas (
    id_cartela SERIAL PRIMARY KEY,
    id_jogo INTEGER NOT NULL REFERENCES Jogos(id_jogo) ON DELETE CASCADE,
    
    -- Armazena os 24 números da cartela. Usamos Array para facilitar a lógica de verificação.
    numeros INTEGER[24] NOT NULL, 
    
    status status_cartela NOT NULL,
    
    -- id_dono é NULL se o status for 'DISPONIVEL'
    id_dono INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL, 
    
    data_reserva TIMESTAMP WITHOUT TIME ZONE,
    data_pagamento TIMESTAMP WITHOUT TIME ZONE
);

-- 5. TABELA LOGS (Serviço AUDIT)
CREATE TABLE Logs (
    id_log SERIAL PRIMARY KEY,
    id_jogo INTEGER REFERENCES Jogos(id_jogo) ON DELETE CASCADE,
    id_usuario INTEGER REFERENCES Usuarios(id_usuario) ON DELETE SET NULL, -- Usuário que realizou a ação
    
    tipo_evento tipo_log NOT NULL,
    timestamp_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- JSONB é ideal para armazenar detalhes flexíveis do evento (Ex: {bola: 'B-7', padrao: 'LINHA'})
    dados_evento JSONB 
);