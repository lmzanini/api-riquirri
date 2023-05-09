const knexConfig = require("../knexfile");
const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");
const db = knex(config);
const Joi = require("joi");

async function criarCupom(req, res) {
  try {
    const { codigo, valor_desconto, data_validade, ativo } = req.body;

    // Verifica se o código já existe na tabela
    const cupomExistente = await db("cupons")
      .select("*")
      .where({ codigo })
      .first();

    if (cupomExistente) {
      return res.status(400).json({ message: "Código de cupom já existe" });
    }

    // Insere o novo cupom na tabela
    const [id_cupons] = await db("cupons").insert({
      codigo,
      valor_desconto,
      data_validade,
      ativo,
    });

    return res.json({ id_cupons });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao criar o cupom" });
  }
}

async function listarCupons(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;

    const [count] = await db("cupons").count();
    const totalCupons = count["count(*)"];
    const totalPages = Math.ceil(totalCupons / limit);

    const cupons = await db("cupons")
      .select("*")
      .limit(limit)
      .offset((page - 1) * limit);

    return res.json({
      cupons: cupons,
      totalPages: totalPages,
      totalCupons: totalCupons,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar os cupons" });
  }
}

async function listarCuponsAtivos(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;

    const [count] = await db("cupons").where("ativo", 1).count();
    const totalCupons = count["count(*)"];
    const totalPages = Math.ceil(totalCupons / limit);

    const cupons = await db("cupons")
      .select("*")
      .where("ativo", 1)
      .limit(limit)
      .offset((page - 1) * limit);

    return res.json({
      cupons: cupons,
      totalPages: totalPages,
      totalCupons: totalCupons,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar os cupons ativos" });
  }
}

async function getCupomById(req, res) {
  try {
    const { id } = req.params;

    const cupom = await db("cupons")
      .select("*")
      .where({ id_cupons: id })
      .first();

    if (!cupom) {
      return res.status(404).json({ message: "Cupom não encontrado" });
    }

    return res.json({ cupom });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o cupom" });
  }
}

async function getCupomByNome(req, res) {
  try {
    const { nome, page = 1, limit = 16 } = req.query;

    const [count] = await db("cupons")
      .count()
      .where("codigo", "like", `%${nome}%`);
    const totalCupons = count["count(*)"];
    const totalPages = Math.ceil(totalCupons / limit);

    const cupons = await db("cupons")
      .select("*")
      .limit(limit)
      .offset((page - 1) * limit)
      .where("codigo", "like", `%${nome}%`);

    if (!cupons || cupons.length === 0) {
      return res.status(404).json({ message: "Cupons não encontrados" });
    }

    return res.json({
      cupons: cupons,
      totalPages: totalPages,
      totalCupons: totalCupons,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar os cupons" });
  }
}

async function deletarCupom(req, res) {
  try {
    const { id } = req.params;

    const cupomDeletado = await db("cupons").where({ id_cupons: id }).del();

    if (!cupomDeletado) {
      return res.status(404).json({ message: "Cupom não encontrado" });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao deletar o cupom" });
  }
}

module.exports = {
  criarCupom,
  listarCupons,
  listarCuponsAtivos,
  getCupomById,
  getCupomByNome,
  deletarCupom,
};
