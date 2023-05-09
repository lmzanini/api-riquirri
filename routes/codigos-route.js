const express = require('express');
const router = express.Router();
const cuponsController = require('../controllers/cupomController');


router.post('/criar', cuponsController.criarCupom);
router.get('/listar', cuponsController.listarCupons);
router.get('/listarAtivos', cuponsController.listarCuponsAtivos);
router.get('/cupomPorId/:id', cuponsController.getCupomById);
router.get('/getCupomByNome', cuponsController.getCupomByNome);
router.delete('/deletar/:id', cuponsController.deletarCupom);

module.exports = router;