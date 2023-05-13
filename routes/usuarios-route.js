const express = require('express');
const usuarioController = require('../controllers/usuarioController')
const verifyJWT = require('../middleware/authLoginUser')

const router = express.Router();
router.get('/me', verifyJWT, usuarioController.getCurrentUser); 
// router.get("/user", verifyJWT, getUserInfo);
router.get('/listar', usuarioController.getAllUsers)
router.get('/search', usuarioController.getUserByName);

router.post('/login', usuarioController.login);
router.post('/cadastro', usuarioController.cadastrarUsuario);
router.post('/cadastroAdmin', usuarioController.cadastrarAdmin);

router.put('/trocarSenha', usuarioController.trocarSenha);

router.patch('/atualizar/:id', usuarioController.atualizarUsuario);
router.put('/atualizarAdmin/:id', usuarioController.atualizarAdmin);

router.delete('/deletar/:id', usuarioController.deletarUsuario);

router.get('/:id', usuarioController.getUser);
 

module.exports = router;
