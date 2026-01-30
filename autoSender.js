const { getConfig } = require('./configService');
const { getClient, isReady } = require('./whatsappClient');
const { Client } = require('pg');

let running = false;

async function startAutoSender() {
    if (running) return;
    running = true;

    console.log("📨 Envio automático iniciado...");

    while (running) {
        try {
            if (!isReady) {
                console.log("⏳ WhatsApp ainda não está pronto. Aguardando...");
                await delay(3000);
                continue;
            }

            const client = getClient(); // <-- AGORA FUNCIONA

            const config = getConfig();

            const db = new Client({
                host: config.db_host,
                port: config.db_port,
                user: config.db_user,
                password: config.db_pass,
                database: config.db_name
            });

            await db.connect();

            const query = `
                SELECT *
                FROM envio_mensagens
                WHERE enviada = false
                AND msg_grupo = $1
                ORDER BY id ASC
                LIMIT 1
            `;

            const result = await db.query(query, [config.grupo_mensagens]);

            if (result.rows.length === 0) {
                await db.end();
                await delay(config.delay_segundos * 1000);
                continue;
            }

            const msg = result.rows[0];

            const numero = msg.fone_destino;
            const texto = msg.mensagem;
            const anexo = msg.anexo;
            const nomeArquivo = msg.nome_original_arquivo_anexo || "arquivo";

            const ddi = numero.substring(0, 2);
            const ddd = numero.substring(2, 4);
            const user = numero.substring(numero.length - 8);

            let numberZDG = "";

            if (ddi !== "55") {
                numberZDG = numero + "@c.us";
            } else if (parseInt(ddd) <= 30) {
                numberZDG = "55" + ddd + "9" + user + "@c.us";
            } else {
                numberZDG = "55" + ddd + user + "@c.us";
            }

            if (anexo === null) {
                await client.sendMessage(numberZDG, texto);
            } else {
                const base64 = Buffer.from(anexo).toString('base64');

                const media = new (require('whatsapp-web.js').MessageMedia)(
                    "image/jpeg",
                    base64,
                    nomeArquivo
                );

                await client.sendMessage(numberZDG, media, { caption: texto });
            }

            await db.query(
                "UPDATE envio_mensagens SET enviada = true, updated_at = now() WHERE id = $1",
                [msg.id]
            );

            console.log(`✔ Mensagem ID ${msg.id} enviada com sucesso`);

            await db.end();

            await delay(config.delay_segundos * 1000);

        } catch (err) {
            console.error("❌ Erro no envio automático:", err);
            await delay(5000);
        }
    }
}

function stopAutoSender() {
    running = false;
    console.log("⛔ Envio automático parado.");
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { startAutoSender, stopAutoSender };