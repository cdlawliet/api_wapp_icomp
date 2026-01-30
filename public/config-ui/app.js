const { createApp } = Vue;

createApp({
  data() {
    return {
      config: {
        db: {},
        api: {}
      },
      sucesso: false,
      erro: null
    };
  },
  mounted() {
    fetch('/config')
      .then(r => r.json())
      .then(data => {
        this.config = data;
      })
      .catch(() => {
        this.erro = 'Erro ao carregar configuração';
      });
  },
  methods: {
    salvar() {
      this.sucesso = false;
      this.erro = null;

      fetch('/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.config)
      })
        .then(async r => {
          if (!r.ok) {
            const e = await r.json();
            throw new Error(e.error || 'Erro ao salvar');
          }
          this.sucesso = true;
        })
        .catch(err => {
          this.erro = err.message;
        });
    }
  }
}).mount('#app');
