const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');

let client = null;
let readyState = false;

async function createClient() {
  if (client) return client;

  const executablePath = puppeteer.executablePath();

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
    puppeteer: {
      executablePath,
      headless: false,
      args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--restore-last-session=false',
    '--disable-session-crashed-bubble'

      ]
    }
  });

  client.on('authenticated', () => {
    console.log("✔ WhatsApp autenticado");
  });

  client.on('ready', () => {
    console.log("✔ WhatsApp pronto!");
    readyState = true;
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