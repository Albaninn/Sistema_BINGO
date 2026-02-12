# 🎯 Sistema de Gerenciamento de Bingo (75 Bolas) [![en](https://img.shields.io/badge/lang-en-red.svg)](README.en.md)

Este repositório contém a arquitetura e as especificações técnicas para um Sistema de Gerenciamento de Bingo completo, focado em alta integridade do jogo, gestão de inventário de cartelas (reserva/venda) e comunicação em tempo real via WhatsApp.

## 1. 🏗️ Arquitetura e Visão Geral

O sistema é construído em uma arquitetura de **Serviços Desacoplados**, onde cada módulo tem responsabilidades claras.

| Serviço/Módulo | Responsabilidade Principal | Canais de Comunicação |
| :--- | :--- | :--- |
| **GAMES** | Lógica central do Sorteio, Controle de Jogo (Pausa/Continuação), Gestão de Ganhadores. | `MESSAGING` (WhatsApp), `REAL-TIME` (WebSockets) |
| **CARDS** | Geração e Inventário de Cartelas, Ciclo de Vida (RESERVADA/PAGA_ATIVA), Lógica de Verificação de Vitória. | `USERS`, `GAMES` |
| **MESSAGING** | Processamento de comandos WhatsApp (INBOUND) e Notificações (OUTBOUND), Sorteio em tempo real. | `GAMES`, `CARDS`, `USERS` |
| **AUDIT** | Log imutável de eventos críticos (Sorteios, Pagamentos, Vitórias). | Interno (Consumido por ADM Portal) |
| **USERS** | Autenticação (Gestor/Cliente), Mapeamento ID de usuário $\leftrightarrow$ ID de WhatsApp. | `CARDS`, `MESSAGING` |

## 2. 🃏 Ciclo de Vida da Cartela (Serviço CARDS)

As cartelas transitam por três estados principais, controlados pelo Gestor (ADM) no momento da venda.

| Status | Descrição | Transição para o Status |
| :--- | :--- | :--- |
| **DISPONIVEL** | Cartela livre no inventário. | Liberação (ADM/Cliente) |
| **RESERVADA** | Associada a um cliente via WhatsApp/Portal; Pagamento pendente. | Comando `Quero Cartela` |
| **PAGA\_ATIVA** | Cartela comprada, elegível para jogar. | **Ação ADM:** `Pagar [ID_Cartela]` |
| **INATIVA** | Cartela de um jogo finalizado. | Fim do Jogo |

> **Regra de Venda:** A mudança para `PAGA_ATIVA` só pode ser feita por um **Gestor (ADM)** no Portal. Se o cliente tiver um `whatsapp_id` válido, a cartela será enviada automaticamente.

## 3. 🎲 Lógica de Jogo e Sorteio (Serviço GAMES)

### 3.1. Algoritmo de Sorteio (`SortearProximoNumero`)

* **Princípio:** Sorteio sem reposição (a bola é removida da lista `BOLAS_DISPONIVEIS` após ser sorteada).
* **Formatação BINGO:** O número sorteado é formatado com sua respectiva letra:
    * **B:** 1 - 15
    * **I:** 16 - 30
    * **N:** 31 - 45
    * **G:** 46 - 60
    * **O:** 61 - 75
* **Log:** Cada sorteio aciona o **Serviço AUDIT** para registro completo.

### 3.2. Gestão de Ganhadores e Desempate

1.  **Pausing:** Um `Grito de BINGO!` aciona o **Serviço GAMES** e pausa o sorteio imediatamente.
2.  **Confirmação:** A vitória deve ser **confirmada manualmente** pelo Gestor no **Portal ADM**.
3.  **Regra de Desempate (Pedra Maior):** Em caso de empate (múltiplas cartelas ganham com a mesma bola):
    * O **GAMES** executa um **sorteio avulso (cego)** de uma nova bola.
    * O vencedor é a cartela empatada que tiver o número desta nova bola sorteada em **qualquer lugar**.

## 4. 📱 Comandos de Interação (WhatsApp)

A interface de comandos no WhatsApp é baseada em palavras-chave para agilizar as operações mais comuns.

| Perfil | Comando | Serviço Acionado | Ação Essencial |
| :--- | :--- | :--- | :--- |
| **Cliente** | `Quero Cartela` | CARDS | Reserva a próxima cartela vaga. |
| **Cliente** | `Cancelar Reserva [ID]` | CARDS | Libera a cartela reservada pelo próprio usuário. |
| **Cliente** | `BINGO!` | CARDS/GAMES | Aciona a checagem de vitória e pausa o jogo. |
| **Gestor** | `Pagar [ID]` | CARDS | Altera o status para `PAGA_ATIVA` (Confirmação de Venda). |
| **Gestor** | `Sortear` | GAMES | Executa o sorteio da próxima bola e broadcast. |
| **Gestor** | `Inventário` | CARDS | Consulta rápida do status de todas as cartelas. |

---

## 5. 🔒 Requisitos de Integridade (Serviço AUDIT)

O **Serviço AUDIT** é obrigatório para registrar eventos críticos com *timestamp* preciso, garantindo a rastreabilidade e a capacidade de resolver disputas sobre o sorteio e vitórias.

* **Eventos Registrados:** `SORTEIO`, `PAGAMENTO`, `BINGO_ACIONADO`, `VITORIA_CONFIRMADA`.
* **Dados:** `timestamp_utc`, `tipo_evento`, `id_usuario`, e dados detalhados do evento (ex: bola, cartela, padrão).
