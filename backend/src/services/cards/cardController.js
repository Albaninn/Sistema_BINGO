const { gerarLoteCartelas } = require('./cartelaGenerator');
const db = require('../../shared/db'); // Sua conexão central com o Postgres

/**
 * Controller para gerar e salvar cartelas no banco de dados
 */
async function handleGerarCartelas(req, res) {
    const { jogoId, quantidade } = req.body;

    // 1. Validação básica
    if (!jogoId || !quantidade) {
        return res.status(400).json({ error: "jogoId e quantidade são obrigatórios." });
    }

    try {
        // 2. Chama a lógica de geração que criamos anteriormente
        const lote = await gerarLoteCartelas(jogoId, quantidade);

        // 3. Persistência em lote (Bulk Insert) no PostgreSQL
        // O PostgreSQL aceita arrays no formato '{val1, val2, ...}'
        const queries = lote.map(c => {
            return db.query(
                `INSERT INTO Cartelas (id_jogo, numeros, status) 
                 VALUES ($1, $2, 'DISPONIVEL')`,
                [c.jogoId, c.numeros] // c.numeros é o array [24]
            );
        });

        await Promise.all(queries);

        // 4. Log de Auditoria (Opcional mas recomendado)
        await db.query(
            `INSERT INTO Logs (id_jogo, tipo_evento, dados_evento) 
             VALUES ($1, 'GERACAO_CARTELAS', $2)`,
            [jogoId, JSON.stringify({ quantidade, acao: 'Criação de lote inicial' })]
        );

        return res.status(201).json({ 
            message: `${quantidade} cartelas geradas com sucesso para o jogo ${jogoId}.` 
        });

    } catch (error) {
        console.error("Erro ao gerar cartelas:", error);
        return res.status(500).json({ error: "Falha interna ao gerar cartelas." });
    }
}

module.exports = { handleGerarCartelas };

/**
 * Reserva uma cartela disponível para um usuário
 */
async function handleReservarCartela(req, res) {
    const { jogoId, usuarioId } = req.body;

    if (!jogoId || !usuarioId) {
        return res.status(400).json({ error: "jogoId e usuarioId são obrigatórios." });
    }

    const client = await db.getClient(); // Usar client para gerenciar transação

    try {
        await client.query('BEGIN');

        // 1. Busca UMA cartela disponível e a "tranca" para outros processos
        const selectQuery = `
            SELECT id_cartela 
            FROM Cartelas 
            WHERE id_jogo = $1 AND status = 'DISPONIVEL' 
            LIMIT 1 
            FOR UPDATE SKIP LOCKED`;
        
        const result = await client.query(selectQuery, [jogoId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Não há cartelas disponíveis para este jogo." });
        }

        const cartelaId = result.rows[0].id_cartela;

        // 2. Atualiza a cartela com o dono e o novo status
        const updateQuery = `
            UPDATE Cartelas 
            SET status = 'RESERVADA', 
                id_dono = $1, 
                data_reserva = NOW() 
            WHERE id_cartela = $2`;
        
        await client.query(updateQuery, [usuarioId, cartelaId]);

        // 3. Registra no Log de Auditoria
        await client.query(
            `INSERT INTO Logs (id_jogo, id_usuario, tipo_evento, dados_evento) 
             VALUES ($1, $2, 'RESERVA', $3)`,
            [jogoId, usuarioId, JSON.stringify({ cartelaId })]
        );

        await client.query('COMMIT');

        return res.status(200).json({ 
            message: "Cartela reservada com sucesso!", 
            cartelaId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro na reserva:", error);
        return res.status(500).json({ error: "Erro ao processar reserva." });
    } finally {
        client.release();
    }
}