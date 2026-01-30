const { Client, LocalAuth } = require('whatsapp-web.js');

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { 
    headless: true,
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

client.on('ready', () => {
  console.log("✔ WhatsApp pronto!");
  isReady = true;
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