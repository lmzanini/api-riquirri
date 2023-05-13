const express = require("express");
const categoriaController = require("../controllers/categoriaController");

const router = express.Router();
/**
 * @swagger
 * /categorias/cadastrar:
 *   post:
 *     summary: Cria uma nova categoria.
 *     description: Cria uma nova categoria com base nos dados fornecidos no corpo da solicitação.
 *     tags:
 *       - Categorias
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Categoria'
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       400:
 *         description: Requisição inválida.
 *       500:
 *         description: Erro interno do servidor.
 */

router.post("/cadastrar", categoriaController.criarCategoria);

/**
 * @swagger
 * /categorias/listar:
 *   get:
 *     summary: Lista todas as categorias.
 *     description: Endpoint para listar todas as categorias cadastradas.
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso.
 *       400:
 *         description: Erro ao listar as categorias.
 */
router.get("/listar", categoriaController.listarCategorias);

 
/**
 * @swagger
 * /nome:
 *   get:
 *     summary: Busca uma categoria pelo nome.
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         description: Nome da categoria.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria encontrada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       404:
 *         description: Categoria não encontrada.
 *       500:
 *         description: Erro interno no servidor.
 */
router.get("/listar/:id", categoriaController.buscarCategoriaPorId);

/**
 * @swagger
 * /categoria/nome:
 *   get:
 *     summary: Buscar categorias pelo nome.
 *     tags:
 *       - Categoria
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Nome da categoria.
 *     responses:
 *       200:
 *         description: Lista de categorias com o nome especificado.
 *       400:
 *         description: Requisição inválida.
 *       404:
 *         description: Categoria não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
router.get("/nome", categoriaController.buscarCategoriaPorNome);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Atualiza uma categoria pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID da categoria a ser atualizada
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       description: Objeto com os novos dados da categoria
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Categoria'
 *     responses:
 *       '200':
 *         description: Categoria atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Categoria'
 *       '400':
 *         description: Requisição inválida (por exemplo, dados ausentes ou mal formatados)
 *       '404':
 *         description: Categoria não encontrada
 *       '500':
 *         description: Erro interno do servidor
 */

router.put('/:id', categoriaController.atualizarCategoria); 

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Deleta uma categoria por ID.
 *     tags:
 *       - Categoria
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID da categoria que será deletada.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Categoria deletada com sucesso.
 *       '404':
 *         description: Categoria não encontrada.
 *       '500':
 *         description: Erro interno do servidor.
 */

router.delete('/:id', categoriaController.deletarCategoria);


module.exports = router; 
