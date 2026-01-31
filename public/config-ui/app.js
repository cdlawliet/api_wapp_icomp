const { createApp } = Vue;

createApp({
  data() {
    return {
      config: {
        db: {
          host: '',
          port: 5432,
          user: '',
          password: '',
          database: ''
        },
        delay: 5,
        grupo: '',
        api: {
          baseUrl: ''
        }
      },

      worker: {
        running: false,
        loading: true
      },

      ui: {
        showPassword: false
      },

      saving: false,
      status: '',
      erro: ''
    };
  },

  async mounted() {
    await this.carregarConfig();
    await this.atualizarStatusWorker();
  },

  methods: {
    async carregarConfig() {
      try {
        const res = await fetch('/config');
        if (!res.ok) throw new Error('Falha ao carregar /config');
        const data = await res.json();
        this.config = data;
      } catch (e) {
        this.erro = e.message || 'Erro ao carregar configuração';
      }
    },

    async salvar() {
      this.status = '';
      this.erro = '';
      this.saving = true;

      try {
        const res = await fetch('/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.config)
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body.error || 'Erro ao salvar');
        }

        this.status = 'Configuração salva com sucesso';
        setTimeout(() => (this.status = ''), 3000);
      } catch (e) {
        this.erro = e.message || 'Erro ao salvar configuração';
      } finally {
        this.saving = false;
      }
    },

    async atualizarStatusWorker() {
      this.worker.loading = true;
      try {
        const res = await fetch('/worker/status');
        if (!res.ok) throw new Error('Falha ao consultar /worker/status');
        const data = await res.json();
        this.worker.running = !!data.running;
      } catch (e) {
        // não derruba o app, apenas informa
        this.erro = e.message || 'Erro ao consultar status do worker';
      } finally {
        this.worker.loading = false;
      }
    },

    async ativarWorker() {
      this.status = '';
      this.erro = '';
      this.worker.loading = true;

      try {
        const res = await fetch('/worker/start', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Erro ao iniciar worker');

        this.worker.running = true;
        this.status = data.message || 'Worker iniciado';
        setTimeout(() => (this.status = ''), 2500);
      } catch (e) {
        this.erro = e.message || 'Erro ao iniciar worker';
      } finally {
        this.worker.loading = false;
      }
    },

    async pararWorker() {
      this.status = '';
      this.erro = '';
      this.worker.loading = true;

      try {
        const res = await fetch('/worker/stop', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Erro ao parar worker');

        this.worker.running = false;
        this.status = data.message || 'Worker parado';
        setTimeout(() => (this.status = ''), 2500);
      } catch (e) {
        this.erro = e.message || 'Erro ao parar worker';
      } finally {
        this.worker.loading = false;
      }
    }
  }
}).mount('#app');
