# 🔗 docs/api-endpoints.md

## Especificação dos Endpoints da API do Sistema de Bingo

Este documento especifica as rotas RESTful para interação com os serviços de Backend (GAMES, CARDS, USERS) do Sistema de Bingo. Todas as rotas críticas devem ser protegidas por autenticação (Token JWT).

## 1. 👥 Serviço USERS (Autenticação e Permissões)

| Método | Rota | Descrição | Permissão | Parâmetros de Entrada (Body) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/login` | **Autenticação de Usuário.** | Pública | `{"email": "...", "password": "..."}` |
| `GET` | `/api/users/profile` | **Busca Perfil.** Retorna dados do usuário autenticado. | Autenticada | Nenhum (usa token) |
| `POST` | `/api/users/register-whatsapp` | **Mapeia ID do WhatsApp** ao usuário autenticado. | Autenticada | `{"whatsappId": "+55..."}` |

---

## 2. 🃏 Serviço CARDS (Inventário e Status)

| Método | Rota | Descrição | Permissão | Parâmetros de Entrada (Body) |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/cards/available/:id_jogo` | **Consulta Cartelas Livres.** | Pública/Autenticada | Nenhum |
| `POST` | `/api/cards/reserve/:id_jogo` | **Reserva Cartela.** | Cliente/ADM | `{"clienteId": 99}` (Opcional, se for ADM) |
| `POST` | `/api/cards/release/:id_cartela` | **Libera Cartela** (Cancela Reserva). | Cliente/ADM | Nenhum |
| `POST` | `/api/cards/pay/:id_cartela` | **Confirma Pagamento** (Ação Exclusiva ADM). | **ADM** | `{"gestorId": 10}` |
| `GET` | `/api/cards/my-cards` | **Lista Cartelas do Cliente.** | Cliente | Nenhum |

---

## 3. 🎲 Serviço GAMES (Controle do Jogo e Sorteio)

### 3.1. Sorteio e Controle

| Método | Rota | Descrição | Permissão | Parâmetros de Entrada (Body) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/games/draw/:id_jogo` | **Sortear Próximo Número.** | **ADM** | Nenhum |
| `POST` | `/api/games/pause/:id_jogo` | **Pausa o Sorteio.** | **ADM** | Nenhum |
| `POST` | `/api/games/resume/:id_jogo` | **Continua o Sorteio.** | **ADM** | Nenhum |
| `GET` | `/api/games/status/:id_jogo` | **Status do Jogo** e últimas bolas. | Público | Nenhum |

### 3.2. Vitória e Desempate

| Método | Rota | Descrição | Permissão | Resposta (Sucesso) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/games/bingo/:id_jogo` | **Grito de BINGO!** (Acionamento pelo Cliente). | Cliente | `{"status": "PAUSED_FOR_VERIFICATION", "cartelaId": 456}` |
| `POST` | `/api/games/confirm-winner/:id_jogo` | **Confirmação Final da Vitória.** | **ADM** | `{"status": "GAME_CONTINUED/FINISHED"}` |
| `POST` | `/api/games/draw-tiebreaker/:id_jogo`| **Inicia Sorteio de Desempate** (Pedra Avulsa). | **ADM** | `{"tiebreakerBall": "I-20", "winnerId": 99}` |

---

## 4. 📢 Serviço MESSAGING (Comunicação - Rotas de Webhook)

| Método | Rota | Descrição | Origem | Ação |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/messaging/webhook` | **Recebimento de Mensagens WhatsApp** (Comandos). | WhatsApp API | Chama `MESSAGING.commandParser` para processar comandos. |
| `POST` | `/api/messaging/broadcast-ball` | **Notificação de Bola Sorteada.** | GAMES | Aciona o *broadcast* via WebSockets e WhatsApp. |