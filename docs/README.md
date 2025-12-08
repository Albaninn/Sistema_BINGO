# 🎯 Sistema de Gerenciamento de Bingo Americano (75 Bolas)

Este repositório contém a arquitetura e as especificações técnicas para um **Sistema de Gerenciamento de Bingo** completo, focado em alta integridade do jogo, gestão de inventário de cartelas e comunicação em tempo real via WhatsApp.

## 1. 🏗️ Arquitetura e Estrutura de Serviços

O sistema é construído em uma arquitetura de **Serviços Desacoplados** (Microsserviços) para garantir escalabilidade e manutenção modular.

| Serviço/Módulo | Responsabilidade Principal | Tecnologias Chave |
| :--- | :--- | :--- |
| **GAMES** | Lógica central do Sorteio, Controle de Jogo (Pausa/Continuação), Gestão de Ganhadores e Desempate. | Backend API, Redis |
| **CARDS** | Geração e Inventário de Cartelas, Ciclo de Vida (RESERVADA/PAGA\_ATIVA), Lógica de Verificação de Vitória. | Backend API, PostgreSQL |
| **MESSAGING** | Processamento de comandos WhatsApp, Notificações OUTBOUND, Comunicação **Real-Time** (WebSockets). | Backend API, Socket.IO, WhatsApp API |
| **USERS** | Autenticação (Gestor/Cliente) e Mapeamento ID de usuário $\leftrightarrow$ ID de WhatsApp. | Backend API |
| **AUDIT** | Registro imutável de eventos críticos para auditoria. | PostgreSQL |

---

## 2. 🃏 Ciclo de Vida e Inventário de Cartelas

A gestão de inventário é feita pelo **Serviço CARDS**, controlando a disponibilidade das cartelas antes do jogo.

| Status | Descrição | Regra de Transição |
| :--- | :--- | :--- |
| **DISPONIVEL** | Cartela livre para reserva. | Padrão, ou após **Liberação** (ADM/Cliente). |
| **RESERVADA** | Associada a um cliente; pagamento pendente. | Comando `Quero Cartela` (Cliente) ou `Reservar para [ID]` (ADM). |
| **PAGA\_ATIVA** | Cartela comprada, elegível para jogar. | **Ação Exclusiva ADM:** `Pagar [ID_Cartela]`. Dispara o envio ao cliente via WhatsApp. |

## 3. 🎲 Lógica de Jogo e Integridade

### A. Algoritmo de Sorteio
Utiliza um método de **sorteio sem reposição** (bolas são removidas do conjunto `BOLAS_DISPONIVEIS` no Redis) para garantir que cada número saia apenas uma vez. Inclui a conversão para a formatação **B-I-N-G-O** (e.g., $44 \rightarrow \text{N-44}$).

### B. Desempate (Pedra Avulsa)
Em caso de empate no número que fecha o padrão: o **Serviço GAMES** executa um **sorteio avulso (cego)** de uma nova bola. O vencedor é a cartela empatada que contiver esse número em qualquer posição.

### C. Comandos via WhatsApp
O **Serviço MESSAGING** traduz comandos de texto para ações da API:
* **Cliente:** `Quero Cartela`, `BINGO!`, `Minhas Cartelas`.
* **Gestor:** `Pagar [ID]`, `Sortear`, `Confirmar [ID]`.

## 4. 🔗 Próximos Passos
O próximo passo é a codificação da **Fase 1 (Fundação)**, começando pela configuração do banco de dados e implementação do **Serviço USERS** e do **Algoritmo de Geração de Cartelas**.