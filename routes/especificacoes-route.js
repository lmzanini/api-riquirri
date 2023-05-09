const express = require("express");
const especificacaoController = require("../controllers/especificacaoController");

const router = express.Router();
router.post("/cadastrar", especificacaoController.criarEspecificacao);
router.get("/listar", especificacaoController.listarEspecificacoes);
router.get("/listar/:id", especificacaoController.buscarEspecificacaoPorId);
router.get("/nome", especificacaoController.buscarEspecificacaoPorNomeOuDescricao);
router.put('/:id', especificacaoController.atualizarEspecificacao);
router.delete('/:id', especificacaoController.deletarEspecificacao);


module.exports = router;
