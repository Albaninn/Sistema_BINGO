const { gerarLoteCartelas } = require('./cartelaGenerator');
const db = require('../../shared/db'); // Sua conexão central com o Postgres

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