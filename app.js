const express = require('express');
const app = express();

const usuariosRouter = require('./routes/usuarios-route');
const enderecosRouter = require('./routes/enderecos-route');
const categoriasRouter = require('./routes/categorias-route');
const especificacoesRouter = require('./routes/especificacoes-route');
const produtosRouter = require('./routes/produtos-route');
const cuponsRouter = require('./routes/codigos-route');

const bodyParser = require('body-parser');
const cors = require('cors');

const swaggerSpec = require('./swaggerDef');
const swaggerUi = require('swagger-ui-express');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Configura as rotas de usuários
app.use('/usuarios', usuariosRouter);
app.use('/enderecos', enderecosRouter);
app.use('/categorias', categoriasRouter);
app.use('/especificacoes', especificacoesRouter);
app.use('/produtos', produtosRouter);
app.use('/cupons', cuponsRouter);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('Bem-vindo à API de usuários!');
});

module.exports = app;
