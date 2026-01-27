const crypto = require('crypto');

/**
 * Função para gerar um lote de cartelas únicas
 * @param {number} jogoId - ID do jogo no DB
 * @param {number} quantidade - Quantas cartelas gerar
 */
async function gerarLoteCartelas(jogoId, quantidade) {
    const cartelasGeradas = new Set(); // Para garantir unicidade no lote

    while (cartelasGeradas.size < quantidade) {
        const cartela = gerarNumerosCartela();
        const hash = crypto.createHash('md5').update(JSON.stringify(cartela)).digest('hex');
        
        // Se o hash já existe, o Set não adiciona, garantindo cartelas únicas
        cartelasGeradas.add({
            jogoId: jogoId,
            numeros: cartela,
            hash: hash // Opcional: para checagem rápida de duplicatas no DB
        });
    }

    return Array.from(cartelasGeradas);
}

/**
 * Gera os 24 números seguindo a regra B-I-N-G-O
 * B: 1-15 | I: 16-30 | N: 31-45 | G: 46-60 | O: 61-75
 */
function gerarNumerosCartela() {
    const colunas = {
        B: getNumerosAleatorios(1, 15, 5),
        I: getNumerosAleatorios(16, 30, 5),
        N: getNumerosAleatorios(31, 45, 4), // Apenas 4, pois o centro é FREE
        G: getNumerosAleatorios(46, 60, 5),
        O: getNumerosAleatorios(61, 75, 5)
    };

    // Monta a cartela seguindo a ordem dos nossos índices (0-23)
    // Linha 1: B[0], I[0], N[0], G[0], O[0]
    // ...até a Linha 5
    const cartelaFinal = [
        colunas.B[0], colunas.I[0], colunas.N[0], colunas.G[0], colunas.O[0], // 0-4
        colunas.B[1], colunas.I[1], colunas.N[1], colunas.G[1], colunas.O[1], // 5-9
        colunas.B[2], colunas.I[2],               colunas.G[2], colunas.O[2], // 10-13 (N é FREE)
        colunas.B[3], colunas.I[3], colunas.N[2], colunas.G[3], colunas.O[3], // 14-18
        colunas.B[4], colunas.I[4], colunas.N[3], colunas.G[4], colunas.O[4]  // 19-23
    ];

    return cartelaFinal;
}

/**
 * Helper para pegar X números aleatórios sem repetição em um intervalo
 */
function getNumerosAleatorios(min, max, qtd) {
    const numeros = [];
    while (numeros.length < qtd) {
        const n = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!numeros.includes(n)) numeros.push(n);
    }
    return numeros.sort((a, b) => a - b); // Ordenar colunas é comum no Bingo
}

module.exports = { gerarLoteCartelas };