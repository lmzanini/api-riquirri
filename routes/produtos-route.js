const express = require('express');
const router = express.Router();
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
    },
  });
  
  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/svg" ||
      file.mimetype === "image/bmp" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5,
      //esse calculo deixa no maximo 5mb de imagem
    },
    fileFilter: fileFilter,
  });

const produtosController = require('../controllers/produtoController');

router.post('/cadastro', upload.array('imagem'), produtosController.criarProduto);
router.get('/listar', produtosController.listarProdutos);
router.get('/listarAtivos', produtosController.listarProdutosAtivos);
router.get('/listarOferta', produtosController.listarProdutosAtivosOferta);
router.get('/listarDestaque', produtosController.listarProdutosAtivosDestaque);
router.get('/listar/nome', produtosController.getProductByName);
router.get('/categoria/:id', produtosController.buscarProdutosPorCategoria);
router.put('/atualizar/:id', upload.array('imagem'), produtosController.atualizarProduto);
router.delete('/deletar/:id', produtosController.deleteProduct);
router.get('/listar/:id', produtosController.buscarProdutoPorId);

module.exports = router;
