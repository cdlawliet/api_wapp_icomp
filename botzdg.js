const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 8888;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const { createClient } = require('./whatsappClient');
const configRoutes = require('./configRoutes');
const { startAutoSender, stopAutoSender } = require('./autoSender');

(async () => {

  const client = await createClient();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(fileUpload({ debug: true }));
  app.use("/", express.static(__dirname + "/"));

  app.use('/', configRoutes);

  app.get('/', (req, res) => {
    res.sendFile('dashboard.html', { root: __dirname });
  });

  io.on('connection', function(socket) {
    socket.emit('message', '© Iniciado');
    socket.emit('qr', './icon.svg');

    client.on('qr', (qr) => {
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', '© QRCode recebido, aponte a câmera do seu celular!');
      });
    });

    client.on('ready', () => {
      socket.emit('ready', '© Dispositivo pronto!');
      socket.emit('message', '© Dispositivo pronto!');
      socket.emit('qr', './check.svg');
    });

    client.on('authenticated', () => {
      socket.emit('authenticated', '© Autenticado!');
      socket.emit('message', '© Autenticado!');
    });

    client.on('auth_failure', () => {
      socket.emit('message', '© Falha na autenticação, reiniciando...');
    });

    client.on('disconnected', () => {
      socket.emit('message', '© Cliente desconectado!');
    });
  });

  app.post('/start-auto', (req, res) => {
    startAutoSender();
    res.json({ message: "Envio automático iniciado" });
  });

  app.post('/stop-auto', (req, res) => {
    stopAutoSender();
    res.json({ message: "Envio automático parado" });
  });

  app.post('/message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req, res) => {

    const errors = validationResult(req).formatWith(({ msg }) => msg);
    if (!errors.isEmpty()) {
      return res.status(422).json({ status: false, message: errors.mapped() });
    }

    const number = req.body.number;
    const numberDDI = number.substr(0, 2);
    const numberDDD = number.substr(2, 2);
    const numberUser = number.substr(-8, 8);
    const message = req.body.message;

    let numberZDG = "";

    if (numberDDI !== "55") {
      numberZDG = number + "@c.us";
    } else if (parseInt(numberDDD) <= 30) {
      numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    } else {
      numberZDG = "55" + numberDDD + numberUser + "@c.us";
    }

    client.sendMessage(numberZDG, message)
      .then(response => res.status(200).json({ status: true, message: 'Mensagem enviada', response }))
      .catch(err => res.status(500).json({ status: false, message: 'Mensagem não enviada', response: err.text }));
  });

  server.listen(port, function() {
    console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
  });

})();