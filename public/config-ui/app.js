const { createApp } = Vue;

createApp({
  data() {
    return {
      route: 'home', // 'home' | 'config'

      config: {
        autoStartWorker: false,
        db: { host: '', port: 5432, user: '', password: '', database: '' },
        delay: 5,
        grupo: '',
        api: { baseUrl: '' } // mantemos internamente
      },

      // porta editável no UI (derivada de baseUrl)
      apiPort: 8888,

      worker: { running: false, loading: true },

      wa: {
        connected: false,
        ready: false,
        authenticated: false,
        qrSrc: '',
        socketId: '',
        logs: []
      },

      ui: { showPassword: false },

      saving: false,
      status: '',
      erro: '',

      // mensagens/status específicas da HOME
      statusHome: '',
      erroHome: '',
      autoStartSaving: false,

      socket: null,

      // ===== AUTH MODAL =====
      auth: {
        open: false,
        user: '',
        pass: '',
        loading: false,
        error: ''
      },

      // Para qual rota o login está tentando levar
      pendingRoute: '#/config',

      // “janela” curta de permissão após validar (NÃO guarda senha)
      allowConfigUntil: 0
    };
  },

  computed: {
    computedBaseUrl() {
      const p = Number(this.apiPort || 0);
      if (!p || p < 1) return 'http://localhost:????';
      return `http://localhost:${p}`;
    }
  },

  async mounted() {
    this.syncRouteFromHash();
    window.addEventListener('hashchange', this.syncRouteFromHash);

    await this.carregarConfig();
    await this.atualizarStatusWorker();
    this.initSocket();
  },

  beforeUnmount() {
    window.removeEventListener('hashchange', this.syncRouteFromHash);
  },

  methods: {
    // ==============================
    // Roteamento simples por hash + Guard de auth
    // ==============================
    syncRouteFromHash() {
      const h = (location.hash || '').toLowerCase();
      const wantsConfig = h.includes('config');

      if (wantsConfig) {
        const allowed = Date.now() < (this.allowConfigUntil || 0);

        if (!allowed) {
          // Bloqueia acesso direto a config sem login
          this.route = 'home';

          // Garante que o hash fica em home (evita "ficar preso" em config)
          if (location.hash !== '#/' && location.hash !== '') {
            location.hash = '#/';
          }

          // Abre modal (uma vez)
          if (!this.auth.open) this.openAuth('#/config');
          return;
        }

        // Consumiu a permissão (não deixa ficar “logado”)
        this.allowConfigUntil = 0;
        this.route = 'config';
        return;
      }

      this.route = 'home';
    },

    goHome() {
      location.hash = '#/';
    },

    // botão do header (sempre pede)
    requestConfigAccess() {
      this.openAuth('#/config');
    },

    // ==============================
    // AUTH MODAL
    // ==============================
    openAuth(pendingHash = '#/config') {
      this.pendingRoute = pendingHash;

      // sempre limpa ao abrir (pra não "guardar")
      this.auth.open = true;
      this.auth.user = '';
      this.auth.pass = '';
      this.auth.error = '';
      this.auth.loading = false;

      this.$nextTick(() => {
        const el = document.querySelector('.modal-body input');
        if (el) el.focus();
      });
    },

    closeAuth() {
      if (this.auth.loading) return;
      this.auth.open = false;
      this.auth.user = '';
      this.auth.pass = '';
      this.auth.error = '';
      this.auth.loading = false;

      // se por algum motivo estava em config, volta pra home
      if ((location.hash || '').toLowerCase().includes('config')) {
        location.hash = '#/';
      }
    },

    async submitAuth() {
      if (this.auth.loading) return;

      const user = (this.auth.user || '').trim();
      const pass = (this.auth.pass || '').toString();

      if (!user || !pass) {
        this.auth.error = 'Informe usuário e senha.';
        return;
      }

      this.auth.loading = true;
      this.auth.error = '';

      try {
        const res = await fetch('/auth/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, pass })
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok || !body.ok) {
          throw new Error(body.error || 'Usuário ou senha inválidos.');
        }

        // ✅ Libera entrada na tela config por uma janela curta
        this.allowConfigUntil = Date.now() + 4000;

        // Fecha modal e limpa credenciais (não guarda)
        this.auth.open = false;
        this.auth.user = '';
        this.auth.pass = '';
        this.auth.error = '';
        this.auth.loading = false;

        // Navega para onde estava pendente
        location.hash = this.pendingRoute || '#/config';

      } catch (e) {
        this.auth.error = e.message || 'Falha ao validar acesso.';
      } finally {
        this.auth.loading = false;

        // limpa credenciais mesmo com erro (se quiser manter em caso de erro, comente)
        this.auth.user = '';
        this.auth.pass = '';
      }
    },

    // ==============================
    // Utils
    // ==============================
    nowTime() {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    },

    // level: info | ok | warn | err
    pushWaLog(text, level = 'info') {
      this.wa.logs.push({
        time: this.nowTime(),
        level,
        text: (text ?? '').toString()
      });

      this.$nextTick(() => {
        const el = document.querySelector('.logs-box');
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    limparLogs() {
      this.wa.logs = [];
      this.pushWaLog('Logs limpos', 'info');
    },

    // Converte possíveis formatos de QR para src de <img>
    normalizeQrSrc(src) {
      const s = (src || '').toString().trim();
      if (!s) return '';

      if (s.startsWith('data:image/')) return s;

      const looksLikeBase64 =
        s.length > 100 &&
        /^[A-Za-z0-9+/=\r\n]+$/.test(s);

      if (looksLikeBase64) {
        return `data:image/png;base64,${s.replace(/\r?\n/g, '')}`;
      }

      if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:')) return s;

      return '';
    },

    // extrai porta do http://localhost:8888 (fallback 8888)
    extractPortFromBaseUrl(baseUrl) {
      try {
        const s = (baseUrl || '').toString().trim();
        if (!s) return 8888;
        const m = s.match(/localhost:(\d+)/i);
        if (m && m[1]) return Number(m[1]) || 8888;
        const u = new URL(s);
        return Number(u.port || 8888) || 8888;
      } catch (_) {
        return 8888;
      }
    },

    // aplica apiPort -> config.api.baseUrl
    applyApiPortToConfig() {
      const p = Number(this.apiPort || 0);
      const safePort = (!p || p < 1) ? 8888 : p;
      this.config.api = this.config.api || {};
      this.config.api.baseUrl = `http://localhost:${safePort}`;
    },

    // ==============================
    // Config
    // ==============================
    async carregarConfig() {
      try {
        const res = await fetch('/config');
        if (!res.ok) throw new Error('Falha ao carregar /config');
        const data = await res.json();

        this.config = Object.assign({}, this.config, data);
        this.config.db = Object.assign({}, this.config.db, data.db || {});
        this.config.api = Object.assign({}, this.config.api, data.api || {});

        // deriva porta para editar no UI
        this.apiPort = this.extractPortFromBaseUrl(this.config?.api?.baseUrl);
      } catch (e) {
        this.erro = e.message || 'Erro ao carregar configuração';
      }
    },

    // Salva config (tela Config) e volta pra Home
    async salvarConfigEVoltar() {
      this.status = '';
      this.erro = '';
      this.saving = true;

      try {
        this.applyApiPortToConfig();

        const res = await fetch('/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.config)
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Erro ao salvar');

        this.status = 'Configuração salva com sucesso';
        setTimeout(() => {
          this.status = '';
          this.goHome();
        }, 350);
      } catch (e) {
        this.erro = e.message || 'Erro ao salvar configuração';
      } finally {
        this.saving = false;
      }
    },

    // Checkbox da HOME: salva só o autoStartWorker sem trocar de tela
    async salvarSomenteAutoStart() {
      this.statusHome = '';
      this.erroHome = '';
      this.autoStartSaving = true;

      try {
        this.applyApiPortToConfig();

        const res = await fetch('/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.config)
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Erro ao salvar');

        this.statusHome = 'AutoStart atualizado';
        setTimeout(() => (this.statusHome = ''), 1800);
      } catch (e) {
        this.erroHome = e.message || 'Erro ao salvar AutoStart';
        setTimeout(() => (this.erroHome = ''), 3500);
      } finally {
        this.autoStartSaving = false;
      }
    },

    // ==============================
    // Worker status/control
    // ==============================
    async atualizarStatusWorker() {
      this.worker.loading = true;
      try {
        const res = await fetch('/worker/status');
        if (!res.ok) throw new Error('Falha ao consultar /worker/status');
        const data = await res.json();
        this.worker.running = !!data.running;
      } catch (e) {
        this.erroHome = e.message || 'Erro ao consultar status do worker';
      } finally {
        this.worker.loading = false;
      }
    },

    async ativarWorker() {
      this.statusHome = '';
      this.erroHome = '';
      this.worker.loading = true;

      try {
        const res = await fetch('/worker/start', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Erro ao iniciar worker');

        this.worker.running = true;
        this.statusHome = data.message || 'Worker iniciado';
        setTimeout(() => (this.statusHome = ''), 2500);
      } catch (e) {
        this.erroHome = e.message || 'Erro ao iniciar worker';
      } finally {
        this.worker.loading = false;
      }
    },

    async pararWorker() {
      this.statusHome = '';
      this.erroHome = '';
      this.worker.loading = true;

      try {
        const res = await fetch('/worker/stop', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Erro ao parar worker');

        this.worker.running = false;
        this.statusHome = data.message || 'Worker parado';
        setTimeout(() => (this.statusHome = ''), 2500);
      } catch (e) {
        this.erroHome = e.message || 'Erro ao parar worker';
      } finally {
        this.worker.loading = false;
      }
    },

    // ==============================
    // WhatsApp Socket
    // ==============================
    initSocket() {
      try {
        if (typeof io === 'undefined') {
          this.pushWaLog('Socket.IO não encontrado no frontend (io undefined)', 'err');
          return;
        }

        // evita múltiplas conexões
        if (this.socket) {
          try { this.socket.disconnect(); } catch (_) {}
          this.socket = null;
        }

        this.socket = io();

        this.socket.on('connect', () => {
          this.wa.connected = true;
          this.wa.socketId = this.socket.id || '';
          this.pushWaLog(`Socket conectado (${this.wa.socketId})`, 'ok');
        });

        this.socket.on('disconnect', () => {
          this.wa.connected = false;
          this.wa.socketId = '';
          this.pushWaLog('Socket desconectado', 'warn');
        });

        // logs "message"
        this.socket.on('message', (msg) => {
          const text = (msg || '').toString().trim();
          if (!text) return;

          if (/qrcode recebido|qr code recebido|aponte a c[aâ]mera|aguardando leitura/i.test(text)) {
            if (!this.wa.qrSrc) {
              this.wa.ready = false;
              this.wa.authenticated = false;
            }
            this.pushWaLog(`@ ${text}`, 'info');
            return;
          }

          if (/dispositivo pronto/i.test(text)) {
            this.wa.ready = true;
            this.wa.qrSrc = '';
            this.pushWaLog('Dispositivo pronto!', 'ok');
            return;
          }

          if (/autenticado/i.test(text)) {
            this.wa.authenticated = true;
            this.wa.qrSrc = '';
            this.pushWaLog('Autenticado!', 'ok');
            return;
          }

          if (/iniciado/i.test(text)) {
            this.pushWaLog('© Iniciado', 'info');
            return;
          }

          if (/falha|erro/i.test(text)) {
            this.pushWaLog(text, 'err');
            return;
          }

          this.pushWaLog(text, 'info');
        });

        // QR
        this.socket.on('qr', (src) => {
          const normalized = this.normalizeQrSrc(src);

          if (!normalized) {
            this.pushWaLog('QR recebido sem imagem válida (ignorado)', 'warn');
            return;
          }

          const wasReady = this.wa.ready;

          this.wa.ready = false;
          this.wa.authenticated = false;
          this.wa.qrSrc = normalized;

          if (wasReady) {
            this.pushWaLog('Novo QR recebido (pareamento necessário)', 'warn');
          } else {
            this.pushWaLog('QR Code recebido (aguardando leitura)', 'warn');
          }
        });

        this.socket.on('ready', () => {
          this.wa.ready = true;
          this.wa.qrSrc = '';
          this.pushWaLog('Dispositivo pronto!', 'ok');
        });

        this.socket.on('authenticated', () => {
          this.wa.authenticated = true;
          this.wa.qrSrc = '';
          this.pushWaLog('Autenticado!', 'ok');
        });

      } catch (e) {
        this.pushWaLog('Erro ao inicializar socket: ' + (e.message || e), 'err');
      }
    },

    reconectarSocket() {
      try {
        this.pushWaLog('Reconectando socket...', 'info');
        this.initSocket();
      } catch (e) {
        this.pushWaLog('Falha ao reconectar: ' + (e.message || e), 'err');
      }
    }
  }
}).mount('#app');
