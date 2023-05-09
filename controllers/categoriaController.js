const Joi = require("joi");
const knexConfig = require("../knexfile");
const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");
const db = knex(config);

const categoriasSchema = Joi.object({
  nome: Joi.string().required(),
});

async function criarCategoria(req, res) {
  try {
    const { nome } = await categoriasSchema.validateAsync(req.body);
    await db("categorias").insert({ nome });
    return res.status(201).json({ mensagem: "Categoria criada com sucesso." });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível criar a categoria." });
  }
}

async function listarCategorias(req, res) {
  try {
    const categorias = await db("categorias").select("*");
    return res.status(200).json(categorias);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível listar as categorias." });
  }
}

async function buscarCategoriaPorId(req, res) {
  try {
    const { id } = req.params;
    const categoria = await db("categorias")
      .select("*")
      .where({ id_categorias: id })
      .first();
    if (!categoria) {
      return res.status(404).json({ mensagem: "Categoria não encontrada." });
    }
    return res.status(200).json(categoria);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível buscar a categoria." });
  }
}

async function buscarCategoriaPorNome(req, res) {
  try {
    const { nome } = req.query;
    const categoria = await db("categorias")
      .select("*")
      .where("nome", "like", `%${nome}%`)
      .first();
    if (!categoria) {
      return res.status(404).json({ mensagem: "Categoria não encontrada." });
    }
    return res.status(200).json(categoria);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível buscar a categoria." });
  }
}

async function atualizarCategoria(req, res) {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    const categoria = await db("categorias")
      .where({ id_categorias: id })
      .update({ nome });
    if (!categoria) {
      return res.status(404).json({ mensagem: "Categoria não encontrada." });
    }
    return res
      .status(200)
      .json({ mensagem: "Categoria atualizada com sucesso." });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível atualizar a categoria." });
  }
}

async function deletarCategoria(req, res) {
  const { id } = req.params;
  try{
    await db.transaction(async (trx) => {

      await db("produtos_categoria")
      .where({ categorias_id_categorias: id })
      .delete();

      await db("categorias")
      .where({ id_categorias: id })
      .delete();
    })
    res.status(200).json({ message: "Categoria deletada com sucesso" });
  }catch(error){
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar a categoria" });
  }
    


}
module.exports = {
  criarCategoria,
  listarCategorias,
  buscarCategoriaPorId,
  buscarCategoriaPorNome,
  atualizarCategoria,
  deletarCategoria
};
