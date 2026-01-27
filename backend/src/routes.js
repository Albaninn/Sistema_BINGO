// backend/src/app.js ou routes.js
const express = require('express');
const router = express.Router();
const cardController = require('./services/cards/cardController');

// Rota que o Portal ADM vai chamar
router.post('/api/cards/generate', cardController.handleGerarCartelas);

// ... importações
router.post('/api/cards/reserve', cardController.handleReservarCartela);