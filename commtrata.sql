/* =============================================================
   (re)CRIAÇÃO DO ESQUEMA
   =============================================================*/
DROP DATABASE IF EXISTS commtratta;
CREATE DATABASE commtratta;
USE commtratta;

/* ------------------ USUÁRIOS E ESPECIALIZAÇÕES ------------------ */
CREATE TABLE usuarios (
    id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username       VARCHAR(60) NOT NULL,
    email          VARCHAR(120)  NOT NULL UNIQUE,
    telefone       VARCHAR(20),
    senha          CHAR(60)      NOT NULL,
    img            VARCHAR(145),
    criado_em      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE pessoa_fisica (
    id        BIGINT UNSIGNED PRIMARY KEY,           -- = usuarios.id
    cpf       CHAR(11) NOT NULL UNIQUE,
    name      VARCHAR(20) NOT NULL,
    surname   VARCHAR(30) NOT NULL,
    CONSTRAINT fk_pfisica__id
        FOREIGN KEY (id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE pessoa_juridica (
    id        BIGINT UNSIGNED PRIMARY KEY,
    cnpj      CHAR(14) NOT NULL UNIQUE,
    descricao TEXT,
    CONSTRAINT fk_pjuridica__id
        FOREIGN KEY (id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

/* ---------------------- PAGAMENTOS ---------------------- */
CREATE TABLE pagamentos (
    id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_usuario  BIGINT UNSIGNED NOT NULL,
    tipo        ENUM('PIX','CARTAO','OUTRO') NOT NULL,
    apelido     VARCHAR(40),
    dados       JSON            NOT NULL,
    criado_em   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pag__usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

/* ----------------------- CONTRATOS ----------------------- */
CREATE TABLE contratos (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    id_fornecedor   BIGINT UNSIGNED NOT NULL,   -- PJ que publica
    titulo          VARCHAR(140) NOT NULL,
    descricao       TEXT,
    data_criacao    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    contrato_arquivo VARCHAR(255),
    contrato_img    VARCHAR(255),
    status          ENUM('CADASTRADO','ABERTO','ASSINADO','APROVADO')
                   NOT NULL DEFAULT 'CADASTRADO',
    data_validade   DATETIME,
    CONSTRAINT fk_contratos__fornecedor
        FOREIGN KEY (id_fornecedor) REFERENCES pessoa_juridica(id)
        ON DELETE CASCADE
);

CREATE TABLE contrato_usuarios (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    usuario_id   BIGINT UNSIGNED NOT NULL,
    contrato_id  BIGINT UNSIGNED NOT NULL,
    data_insercao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_contrato_usuarios_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_contrato_usuarios_contrato
        FOREIGN KEY (contrato_id) REFERENCES contratos(id)
        ON DELETE CASCADE
);

/* ---------------------- CATEGORIAS ---------------------- */
CREATE TABLE categorias (
    id     BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nome   VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE contrato_categorias (
    id_contrato  BIGINT UNSIGNED NOT NULL,
    id_categoria BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id_contrato, id_categoria),
    CONSTRAINT fk_contratocat__contrato
        FOREIGN KEY (id_contrato) REFERENCES contratos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_contratocat__categoria
        FOREIGN KEY (id_categoria) REFERENCES categorias(id)
        ON DELETE CASCADE
);

CREATE TABLE usuario_interesses (
    usuario_id   BIGINT UNSIGNED NOT NULL,
    categoria_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (usuario_id, categoria_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

/* fornecedor × categoria (N-para-N) */
CREATE TABLE fornecedor_categoria (
    id_fornecedor BIGINT UNSIGNED NOT NULL,
    id_categoria  BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id_fornecedor, id_categoria),
    CONSTRAINT fk_forncat__forn
        FOREIGN KEY (id_fornecedor) REFERENCES pessoa_juridica(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_forncat__cat
        FOREIGN KEY (id_categoria)  REFERENCES categorias(id)
        ON DELETE CASCADE
);

/* ------------------ CONTRATOS ASSINADOS (1 : 1) ------------------ */
CREATE TABLE contratos_assinados (
    id_contrato     BIGINT UNSIGNED PRIMARY KEY,
    id_cliente      BIGINT UNSIGNED NOT NULL,
    data_assinatura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contassin__contrato
        FOREIGN KEY (id_contrato) REFERENCES contratos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_contassin__cliente
        FOREIGN KEY (id_cliente)  REFERENCES usuarios(id)
        ON DELETE CASCADE
);

/* -------------------- CONTATOS DOS USUÁRIOS -------------------- */
CREATE TABLE contatos_usuario (
    id_usuario    BIGINT UNSIGNED NOT NULL,
    tipo          ENUM('EMAIL','TEL','OUTRO') NOT NULL,
    valor         VARCHAR(120) NOT NULL,
    preferencial  BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_usuario, tipo, valor),
    CONSTRAINT fk_contuser__user
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

/* ------------ CONTATOS + PAGAMENTOS VINCULADOS AO CONTRATO -------- */
CREATE TABLE contatos_contrato (
    id_contrato BIGINT UNSIGNED NOT NULL,
    tipo        ENUM('EMAIL','TEL','OUTRO') NOT NULL,
    valor       VARCHAR(120) NOT NULL,
    PRIMARY KEY (id_contrato, tipo, valor),
    CONSTRAINT fk_contcontrato__contrato
        FOREIGN KEY (id_contrato) REFERENCES contratos(id)
        ON DELETE CASCADE
);

CREATE TABLE pagamentos_contrato (
    id_contrato  BIGINT UNSIGNED NOT NULL,
    id_pagamento BIGINT UNSIGNED NOT NULL,
    valor_cents  BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (id_contrato, id_pagamento),
    CONSTRAINT fk_pagcontrato__contrato
        FOREIGN KEY (id_contrato)  REFERENCES contratos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pagcontrato__pag
        FOREIGN KEY (id_pagamento) REFERENCES pagamentos(id)
);

/* ----------------------- CHATS E MENSAGENS ----------------------- */
CREATE TABLE chats (
    id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    contrato_id   BIGINT UNSIGNED NOT NULL,
    fornecedor_id BIGINT UNSIGNED NOT NULL,
    cliente_id    BIGINT UNSIGNED NOT NULL,
    data_criacao  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_chat_contrato
        FOREIGN KEY (contrato_id) REFERENCES contratos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_chat_fornecedor
        FOREIGN KEY (fornecedor_id) REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_chat_cliente
        FOREIGN KEY (cliente_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE mensagens (
    id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    chat_id      BIGINT UNSIGNED NOT NULL,
    remetente_id BIGINT UNSIGNED NOT NULL,
    conteudo     TEXT NOT NULL,
    data_envio   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lida         BOOLEAN NOT NULL DEFAULT 0,
    
    CONSTRAINT fk_mensagem_chat
        FOREIGN KEY (chat_id) REFERENCES chats(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_remetente
        FOREIGN KEY (remetente_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
);

/* =============================================================
   SEED
   =============================================================*/

/* 1 ▸ Categorias */
INSERT INTO categorias (nome) VALUES
  ('Limpeza'), ('TI'), ('RH'), ('Marketing'), ('Logística');

/* 2 ▸ Usuários */
INSERT INTO usuarios (username, email, telefone, senha, interesses) VALUES
  ('alice'    , 'alice@cliente.com'        , '+55-11-99999-9999', REPEAT('a',60), 'RH,Finanças'),
  ('bob'      , 'bob@cliente.com'          , '+55-11-98888-8888', REPEAT('b',60), 'TI,DevOps'),
  ('glauco'   , 'glauco@dunicorniothinking.com', '+55-41-91234-5678', REPEAT('g',60), 'Design Thinking, Workshop'),
  ('empresa1' , 'empresa1@forn.com'        , '+55-11-3216-5432', REPEAT('c',60), 'Limpeza,Facilities'),
  ('empresa2' , 'empresa2@forn.com'        , '+55-11-3249-8765', REPEAT('d',60), 'TI,Cloud'),
  ('empresa3' , 'empresa3@forn.com'        , '+55-11-3248-7651', REPEAT('e',60), 'Marketing,Design');

/* 3 ▸ Especializações PF / PJ */
INSERT INTO pessoa_fisica (id, cpf, name, surname) VALUES
  (1, '11111111111', 'Alice', 'Silva'),
  (2, '22222222222', 'Bob', 'Souza');

INSERT INTO pessoa_juridica (id, cnpj, descricao) VALUES
  (3, '12345678000199', 'Empresa de Serviços Gerais'),
  (4, '98765432000155', 'Consultoria de TI e Cloud'),
  (5, '45678912000133', 'Agência de Marketing Digital');

/* 4 ▸ Vínculo fornecedor × categoria */
INSERT INTO fornecedor_categoria (id_fornecedor, id_categoria) VALUES
  (3, 1),          -- Empresa 1 → Limpeza
  (4, 2),          -- Empresa 2 → TI
  (4, 3),          -- Empresa 2 → RH
  (5, 4),          -- Empresa 3 → Marketing
  (5, 2);          -- Empresa 3 → TI

/* 5 ▸ Métodos de pagamento */
INSERT INTO pagamentos (id_usuario, tipo, apelido, dados) VALUES
  (1, 'PIX'   , 'PIX Principal' , '{"chave":"alice@cliente.com"}'),
  (1, 'CARTAO', 'Visa **** 4242', '{"ultimos4":"4242","bandeira":"VISA"}'),
  (2, 'CARTAO', 'Master **** 5555', '{"ultimos4":"5555","bandeira":"Master"}'),
  (3, 'PIX'   , 'PIX Empresa1' , '{"chave":"123e4567-e89b-12d3-a456-426614174000"}'),
  (4, 'PIX'   , 'PIX Empresa2' , '{"chave":"emp2@pix.com"}'),
  (5, 'PIX'   , 'PIX Empresa3' , '{"chave":"emp3@pix.com"}');

/* 6 ▸ Contatos permanentes */
INSERT INTO contatos_usuario (id_usuario, tipo, valor, preferencial) VALUES
  (1, 'EMAIL', 'alice@cliente.com',  TRUE),
  (1, 'TEL'  , '+55-11-99999-9999', FALSE),
  (2, 'EMAIL', 'bob@cliente.com',    TRUE),
  (2, 'TEL'  , '+55-11-98888-8888', FALSE),
  (3, 'EMAIL', 'contato@empresa1.com', TRUE),
  (3, 'TEL'  , '+55-11-5555-6666',     FALSE),
  (4, 'EMAIL', 'contato@empresa2.com', TRUE),
  (5, 'EMAIL', 'contato@empresa3.com', TRUE);

/* 7 ▸ Contratos */
INSERT INTO contratos (id_fornecedor, titulo, descricao, status, data_validade) VALUES
  (3, 'Serviço de Limpeza Semanal',
      'Limpeza de escritórios até 5× por semana',
      'ABERTO',
      DATE_ADD(NOW(), INTERVAL 30 DAY)),
  (3, 'Manutenção Predial Anual',
      'Serviços de manutenção elétrica e hidráulica',
      'ASSINADO',
      DATE_ADD(NOW(), INTERVAL 365 DAY)),
  (4, 'Migração para a Nuvem',
      'Projeto de migração AWS/Azure',
      'CADASTRADO',
      NULL),
  (5, 'Gestão de Redes Sociais',
      'Pacote completo de marketing digital',
      'ASSINADO',
      DATE_ADD(NOW(), INTERVAL 90 DAY));

/* 8 ▸ Dados pós-assinatura */
INSERT INTO contratos_assinados (id_contrato, id_cliente) VALUES
  (2, 1),   -- contrato #2 assinado por Alice
  (4, 2);   -- contrato #4 assinado por Bob

INSERT INTO contatos_contrato (id_contrato, tipo, valor) VALUES
  (2, 'EMAIL', 'alice@cliente.com'),
  (2, 'TEL'  , '+55-11-99999-9999'),
  (4, 'EMAIL', 'bob@cliente.com'),
  (4, 'TEL'  , '+55-11-98888-8888');

INSERT INTO pagamentos_contrato (id_contrato, id_pagamento, valor_cents) VALUES
  (2, 1, 500000),   -- R$5.000,00 via PIX
  (4, 3, 750000);   -- R$7.500,00 via cartão
