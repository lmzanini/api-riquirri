const app = require('./app');

const port = process.env.PORT || 3000;

// Inicia a escuta na porta 3000
app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});


