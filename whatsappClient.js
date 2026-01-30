const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

let client = null;
let readyState = false;

async function createClient() {
  if (client) return client; // evita criar duas vezes

  const executablePath = puppeteer.executablePath();

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
    puppeteer: {
      executablePath,
      headless: false, // pode ativar/desativar aqui
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    }
  });

  client.on('authenticated', () => {
    console.log("✔ WhatsApp autenticado");
  });

  client.on('ready', async () => {
    console.log("✔ WhatsApp pronto! Validando sessão...");

    try {
      const me = await client.getMe();

      if (me && me.id) {
        console.log("✔ Sessão validada. WhatsApp realmente pronto para enviar mensagens.");
        readyState = true;
      } else {
        console.log("⏳ Sessão ainda carregando. Aguardando...");
        readyState = false;
      }

    } catch (err) {
      console.log("⏳ WhatsApp ainda não está pronto. Aguardando...");
      readyState = false;
    }
  });

  client.on('disconnected', () => {
    console.log("❌ WhatsApp desconectado");
    readyState = false;
  });

  client.initialize();

  return client;
}

module.exports = {
  createClient,
  getClient: () => client,
  isReady: () => readyState
};