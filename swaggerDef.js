const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Riquirri-API',
      version: '1.0.0',
      description: 'API para a loja Riquirri',
    },
  },
  apis: ['./routes/categorias-route.js'], 
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
