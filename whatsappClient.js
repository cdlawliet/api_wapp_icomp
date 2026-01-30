const { Client, LocalAuth } = require('whatsapp-web.js');

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { 
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

client.on('ready', async () => {
  console.log("✔ WhatsApp pronto! Validando sessão...");

  try {
    // Teste real: tenta buscar o próprio número
    const me = await client.getMe();

    if (me && me.id) {
      console.log("✔ Sessão validada. WhatsApp realmente pronto para enviar mensagens.");
      isReady = true;
    } else {
      console.log("⏳ Sessão ainda carregando. Aguardando...");
      isReady = false;
    }

  } catch (err) {
    console.log("⏳ WhatsApp ainda não está pronto. Aguardando...");
    isReady = false;
  }
});

client.on('authenticated', () => {
  console.log("✔ WhatsApp autenticado");
});

client.on('disconnected', () => {
  console.log("❌ WhatsApp desconectado");
  isReady = false;
});

client.initialize();

module.exports = { client, isReady };