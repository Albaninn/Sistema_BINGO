# 🏛️ Arquitetura do Sistema de Bingo

Este documento detalha a arquitetura de componentes e a estrutura de permissões do sistema, que opera em uma arquitetura de microsserviços desacoplados.

## 1. Diagrama de Componentes de Alto Nível

Abaixo está a representação visual dos serviços do sistema e suas interações, destacando a separação entre as camadas de **Frontend**, **Serviços Backend** e **Dados/Comunicação Externa**.

```mermaid
graph TD
    subgraph 🌐 CLIENTE/FRONTEND
        ADM_Portal[Painel ADM]
        Cliente_Portal[Portal Jogador]
        Telao(Telão Público)
    end

    subgraph 🧠 SERVIÇOS BACKEND
        direction LR
        API_Gateway((API Gateway))
        GAMES[Serviço GAMES (Sorteio)]
        CARDS[Serviço CARDS (Cartelas/Vitória)]
        USERS[Serviço USERS (Autenticação)]
        MESSAGING[Serviço MESSAGING (Comunicação)]
        AUDIT[Serviço AUDIT (Logs)]
    end

    subgraph 💾 DADOS & EXTERNOS
        DB[PostgreSQL/MySQL]
        Cache[(Redis - Cache)]
        WhatsAppAPI[API WhatsApp Business]
    end
    
    %% CONEXÕES GERAIS
    ADM_Portal --> API_Gateway
    Cliente_Portal --> API_Gateway
    API_Gateway --> GAMES
    API_Gateway --> CARDS
    API_Gateway --> USERS
    
    %% FLUXO DE LÓGICA E COMUNICAÇÃO
    GAMES --> CARDS
    CARDS --> GAMES
    GAMES --> MESSAGING
    CARDS --> MESSAGING
    MESSAGING --> WhatsAppAPI
    WhatsAppAPI --> MESSAGING
    MESSAGING --> Telao
    MESSAGING --> Cliente_Portal
    
    %% CONEXÕES DE DADOS
    GAMES --> Cache
    CARDS --> DB
    USERS --> DB
    GAMES --> DB
    
    %% AUDITORIA
    GAMES --> AUDIT
    CARDS --> AUDIT


## 2. Responsabilidades dos Serviços

Cada serviço é um módulo independente com funções específicas para garantir a estabilidade e a integridade do jogo.

| Serviço | Dependências Primárias | Funções de Design |
| :--- | :--- | :--- |
| **GAMES** | CARDS, Redis, AUDIT | **Gerencia o Sorteio** e o estado do jogo (pausa, desempate). Mantém a urna (`BOLAS_DISPONIVEIS`) no **Redis** para velocidade. |
| **CARDS** | USERS, DB, GAMES | **Controla o Inventário** de cartelas, transição de status (`RESERVADA` $\leftrightarrow$ `PAGA_ATIVA`) e executa a lógica de **Verificação de Vitória** (padrões L, U, etc.). |
| **MESSAGING** | WhatsApp API, GAMES, CARDS | Ponto central de **Comunicação**. Responsável por receber comandos de texto (parser), enviar notificações OUTBOUND (cartela paga) e gerenciar o **Real-Time** (WebSockets). |
| **USERS** | DB | Gerencia a autenticação e autorização (identifica se é Gestor ou Cliente) e o mapeamento do `whatsapp_id`. |
| **AUDIT** | DB | Serviço passivo que **Registra Imutavelmente** todas as transações e eventos críticos (sorteios, pagamentos, vitórias). |

---

## 3. Estrutura de Permissões (Autorização)

A autorização é verificada pelo **Serviço USERS** em conjunto com o **API Gateway** antes que o comando chegue ao serviço final. A integridade do jogo depende da **restrição de ações críticas** aos Gestores (ADM).

| Ação Crítica | Perfil Necessário | Serviço que Executa | Regra de Autorização |
| :--- | :--- | :--- | :--- |
| **Confirmar Pagamento** | **Gestor (ADM)** | CARDS | Requer permissão de ADM no `USERS`. |
| **Sortear Próximo Número** | **Gestor (ADM)** | GAMES | Requer permissão de ADM no `USERS`. |
| **Pausar/Continuar Jogo** | **Gestor (ADM)** | GAMES | Requer permissão de ADM no `USERS`. |
| **Reservar Cartela** | **Cliente** | CARDS | Requer cliente autenticado, limitada ao próprio `id_usuario`. |
| **Grito de BINGO!** | **Cliente** | CARDS | Requer cartela `PAGA_ATIVA` associada ao `id_usuario`. |
| **Consultar Log de Auditoria** | **Gestor (ADM)** | AUDIT | Requer permissão de ADM para acesso. |