const express = require("express");
const enderecoController = require("../controllers/enderecoController");
const login = require("../middleware/authLoginUser.js");

const router = express.Router();
router.get("/listar", enderecoController.listarEnderecos);
// router.get("/buscar", enderecoController.getEndereco);
// router.get("/", enderecoController.listarEnderecosOrdenados);

router.post("/cadastro", login, enderecoController.criarEndereco);
router.put("/atualizar/:id", enderecoController.atualizarEndereco);
router.get("/buscar/:id", enderecoController.getEndereco);

router.delete("/deletar/:id", enderecoController.deletarEndereco);

module.exports = router;
 