const knexConfig = require("../knexfile");
const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");
const db = knex(config);

async function criarEspecificacao(req, res) {
  try {
    const { nome, descricao } = req.body;
    const especificacao = await db("especificacoes").insert({
      nome,
      descricao,
    });
    return res
      .status(201)
      .json({ mensagem: "Especificação criada com sucesso." });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível criar a especificação." });
  }
}

async function listarEspecificacoes(req, res) {
  try {
    const especificacoes = await db("especificacoes").select("*");
    return res.json(especificacoes);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível listar as especificações." });
  }
}

async function buscarEspecificacaoPorId(req, res) {
  try {
    const { id } = req.params;
    const especificacao = await db("especificacoes")
      .select("*")
      .where({ id_especificacoes: id })
      .first();

    if (!especificacao) {
      return res
        .status(404)
        .json({ mensagem: "Especificação não encontrada." });
    }

    return res.json(especificacao);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível buscar a especificação." });
  }
}

async function buscarEspecificacaoPorNomeOuDescricao(req, res) {
  try {
    const { tipo, valor } = req.query;
    let especificacao;

    if (tipo === "nome") {
      especificacao = await db("especificacoes")
        .select("*")
        .where("nome", "like", `%${valor}%`)
        .first();
    } else if (tipo === "descricao") {
      especificacao = await db("especificacoes")
        .select("*")
        .where("descricao", "like", `%${valor}%`)
        .first();
    } else {
      return res.status(400).json({ mensagem: "Tipo de busca inválido." });
    }

    if (!especificacao) {
      return res
        .status(404)
        .json({ mensagem: "Especificação não encontrada." });
    }

    return res.json(especificacao);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível buscar a especificação." });
  }
}

async function atualizarEspecificacao(req, res) {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  try {
    // Verifica se a especificação existe
    const especificacao = await db("especificacoes")
      .where({ id_especificacoes: id })
      .first();
    if (!especificacao) {
      return res
        .status(404)
        .json({ mensagem: "Especificação não encontrada." });
    }

    // Atualiza a especificação
    await db("especificacoes")
      .where({ id_especificacoes: id })
      .update({ nome, descricao });

    // Busca a especificação atualizada
    const especificacaoAtualizada = await db("especificacoes")
      .where({ id_especificacoes: id })
      .first();

    return res.json(especificacaoAtualizada);
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível atualizar a especificação." });
  }
}

async function deletarEspecificacao(req, res) {
  const { id } = req.params;

  try {
    // Verifica se a especificação existe
    const especificacao = await db("especificacoes").where({ id_especificacoes: id }).first();
    if (!especificacao) {
      return res
        .status(404)
        .json({ mensagem: "Especificação não encontrada." });
    }

    // Deleta a especificação
    await db("especificacoes").where({ id_especificacoes: id }).del();

    return res.json({ mensagem: "Especificação removida com sucesso." });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ mensagem: "Não foi possível deletar a especificação." });
  }
}
module.exports = {
  criarEspecificacao,
  listarEspecificacoes,
  buscarEspecificacaoPorId,
  buscarEspecificacaoPorNomeOuDescricao,
  atualizarEspecificacao,
  deletarEspecificacao
};
