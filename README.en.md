# 🎯 Bingo Management System (75 Balls) [![Pt-Br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.md)

This repository contains the architecture and technical specifications for a complete Bingo Management System. The project focuses on high game integrity, card inventory management (reservation/sales), and real-time communication via WhatsApp.

## 1. 🏗️ Architecture and Overview

The system is built on a **Decoupled Services** architecture, where each module has clear responsibilities.

| Service/Module | Main Responsibility | Communication Channels |
| :--- | :--- | :--- |
| **GAMES** | Core Draw logic, Game Control (Pause/Resume), Winner Management. | `MESSAGING` (WhatsApp), `REAL-TIME` (WebSockets) |
| **CARDS** | Generation and Card Inventory, Life Cycle (RESERVED/PAID_ACTIVE), Win Verification Logic. | `USERS`, `GAMES` |
| **MESSAGING** | WhatsApp command processing (INBOUND) and Notifications (OUTBOUND), Real-time broadcasting. | `GAMES`, `CARDS`, `USERS` |
| **AUDIT** | Immutable log of critical events (Draws, Payments, Wins). | Internal (Consumed by ADM Portal) |
| **USERS** | Authentication (Manager/Client), User ID $\leftrightarrow$ WhatsApp ID mapping. | `CARDS`, `MESSAGING` |

## 2. 🃏 Card Life Cycle (CARDS Service)

Cards transition through three primary states, controlled by the Manager (ADM) at the point of sale.

| Status | Description | Transition Trigger |
| :--- | :--- | :--- |
| **AVAILABLE** | Free card in inventory. | Release (ADM/Client) |
| **RESERVED** | Associated with a client via WhatsApp/Portal; Pending payment. | `I want a card` command |
| **PAID\_ACTIVE** | Purchased card, eligible to play. | **ADM Action:** `Pay [Card_ID]` |
| **INACTIVE** | Card from a finished game. | End of Game |

> **Sales Rule:** The transition to `PAID_ACTIVE` can only be performed by a **Manager (ADM)** via the Portal. If the client has a valid `whatsapp_id`, the card data/image is sent automatically.

## 3. 🎲 Game Logic and Draws (GAMES Service)

### 3.1. Draw Algorithm (`DrawNextNumber`)

* **Principle:** Draw without replacement (the ball is removed from the `AVAILABLE_BALLS` list once drawn).
* **BINGO Formatting:** The drawn number is formatted with its respective letter:
    * **B:** 1 - 15
    * **I:** 16 - 30
    * **N:** 31 - 45
    * **G:** 46 - 60
    * **O:** 61 - 75
* **Logging:** Every draw triggers the **AUDIT Service** for full traceability.

### 3.2. Winner Management and Tie-breaking

1. **Pausing:** A `BINGO!` shout triggers the **GAMES Service** and pauses the draw immediately.
2. **Confirmation:** Wins must be **manually confirmed** by the Manager in the **ADM Portal**.
3. **Tie-break Rule (High Ball):** In case of a tie (multiple cards winning with the same ball):
    * The **GAMES** service executes a **blind extra draw** of a new ball.
    * The winner is the tied card that contains this new ball number **anywhere** on its grid.

## 4. 📱 Interaction Commands (WhatsApp)

The WhatsApp command interface uses keywords to streamline the most common operations.

| Profile | Command | Triggered Service | Core Action |
| :--- | :--- | :--- | :--- |
| **Client** | `I want a card` | CARDS | Reserves the next vacant card. |
| **Client** | `Cancel reservation [ID]` | CARDS | Releases the card reserved by the user. |
| **Client** | `BINGO!` | CARDS/GAMES | Triggers win check and pauses the game. |
| **Manager** | `Pay [ID]` | CARDS | Sets status to `PAID_ACTIVE` (Sales Confirmation). |
| **Manager** | `Draw` | GAMES | Executes the next ball draw and broadcast. |
| **Manager** | `Inventory` | CARDS | Quick status check of all cards. |

---

## 5. 🔒 Integrity Requirements (AUDIT Service)

The **AUDIT Service** is mandatory for recording critical events with precise timestamps, ensuring traceability and the ability to resolve disputes regarding draws and wins.

* **Recorded Events:** `DRAW`, `PAYMENT`, `BINGO_TRIGGERED`, `WIN_CONFIRMED`.
* **Data Points:** `timestamp_utc`, `event_type`, `user_id`, and detailed event payloads (e.g., ball number, card ID, pattern).