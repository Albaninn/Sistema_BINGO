# 📚 Regras de Negócio e Especificações de Algoritmos

Este documento detalha as regras e algoritmos críticos do Sistema de Bingo, que garantem a integridade e a correta execução do jogo.

## 1. 🃏 Detalhamento do Inventário de Cartelas (Serviço CARDS)

### 1.1. Regra de Geração de Cartelas
As cartelas devem ser geradas em lotes, sendo **únicas** dentro de um jogo e respeitando os intervalos:
* **B:** 1 a 15
* **I:** 16 a 30
* **N:** 31 a 45 (Posição central é **Livre/Coringa**)
* **G:** 46 a 60
* **O:** 61 a 75

### 1.2. Regra de Confirmação de Venda
A mudança para o status **PAGA\_ATIVA** é uma **ação exclusiva do Gestor (ADM)**, representando a confirmação externa do pagamento.

* **Validação Crítica:** O sistema deve consultar o **Serviço USERS** para verificar se o cliente possui um `whatsapp_id` válido antes de tentar enviar a cartela paga. Se o ID for inválido, o status muda, mas o envio deve ser registrado como falho (ADM deve intervir).

## 2. 🎱 Algoritmo de Sorteio (Serviço GAMES)

### 2.1. Princípio de Aleatoriedade e Não Repetição
O mecanismo utiliza dois conjuntos no **Redis**: `BOLAS_DISPONIVEIS` (urna) e `BOLAS_SORTeadas` (histórico). A bola sorteada é **removida** do conjunto de disponíveis antes do *broadcast*.

### 2.2. Lógica de Formatação B-I-N-G-O
A bola sorteada (`numero_bruto`) deve ser formatada antes da comunicação: