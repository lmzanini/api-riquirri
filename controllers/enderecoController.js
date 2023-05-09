const {
  formatarEndereco,
  validarCep,
  obterSiglaEstado,
} = require("../utils/endereco");
const countEnderecos = require("../utils/count");
const Joi = require("joi");
const knexConfig = require("../knexfile");

const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");

const db = knex(config);

async function criarEndereco(req, res) {
  try {
    if (!req.user || !req.user.id_usuarios) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const schema = Joi.object({
      cep: Joi.string().required(),
      pais: Joi.string().required(),
      estado: Joi.string().required(),
      cidade: Joi.string().required(),
      bairro: Joi.string().required(),
      logradouro: Joi.string().required(),
      numero: Joi.string().required(),
      complemento: Joi.string().allow("").optional(),
      ponto_referencia: Joi.string().allow("").optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log(error);
      return res.status(400).json({ message: error.details[0].message });
    }

    const { cep } = req.body;
    const enderecoFormatado = await formatarEndereco(cep);
    const { estado } = enderecoFormatado;
    const siglaEstado = obterSiglaEstado(estado);

    await validarCep(cep);

    const endereco = await db("endereco_atual").insert({
      cep: enderecoFormatado.cep,
      pais: enderecoFormatado.pais,
      estado: siglaEstado,
      cidade: enderecoFormatado.cidade,
      bairro: enderecoFormatado.bairro,
      logradouro: enderecoFormatado.logradouro,
      numero: req.body.numero,
      complemento: req.body.complemento || "",
      ponto_referencia: req.body.ponto_referencia || "",
    });

    const id_endereco = endereco[0];

    await db("usuarios_endereco").insert({
      id_usuarios: req.user.id_usuarios, 
      id_endereco_atual: id_endereco,
    });

    await db("historico_endereco").insert({
      id_usuarios: req.user.id_usuarios,
      id_endereco_atual: id_endereco,
      data_inicio: new Date(),
    });

    return res.status(201).json({ message: "Endereço criado com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error.message });
  }
}

async function listarEnderecos(req, res) {
  try {
    const {
      page = 1,
      limit = 5,
      orderBy = "id_endereco_atual",
      orderDirection = "asc",
    } = req.query;

    // Realiza a validação dos parâmetros da query utilizando Joi
    const schema = Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1),
      orderBy: Joi.string().valid(
        "id_endereco_atual",
        "cep",
        "pais",
        "estado",
        "cidade",
        "bairro",
        "logradouro",
        "numero",
        "complemento",
        "ponto_referencia"
      ),
      orderDirection: Joi.string().valid("asc", "desc"),
    });
    await schema.validateAsync(req.query);

    // Realiza a contagem total de endereços para a paginação
    const totalEnderecos = await countEnderecos(db);

    // Realiza a consulta dos endereços utilizando Knex e realiza a ordenação
    const enderecos = await db
      .select("*")
      .from("endereco_atual")
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset((page - 1) * limit);

    const totalPages = Math.ceil(totalEnderecos / limit);

    if (page > totalPages) {
      return res.status(400).json({ message: "Página inválida." });
    }

    // Retorna a resposta com os endereços e as informações de paginação
    res.status(200).json({
      data: enderecos,
      totalEnderecos,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar os endereços." });
  }
}

// async function getEndereco(req, res) {
//   const { id } = req.params;

//   const schema = Joi.object({
//     id: Joi.string().trim().required(),
//   });

//   try {
//     await schema.validateAsync({ id });
//   } catch (error) {
//     return res.status(400).json({ message: "Invalid request", error });
//   }

//   try {
//     const endereco = await db("endereco_atual")
//       .where("id_endereco_atual", id)
//       .orWhere("cep", id)
//       .orWhere("estado", "like", `%${id}%`)
//       .orWhere("cidade", "like", `%${id}%`)
//       .orWhere("logradouro", "like", `%${id}%`)
//       .select();

//     if (!endereco.length) {
//       return res.status(404).json({ message: "Endereço não encontrado" });
//     }

//     return res.json({ endereco });
//   } catch (error) {
//     console.error("Erro ao buscar endereço:", error);
//     return res.status(500).json({ message: "Erro interno no servidor" });
//   }
// }

async function getEndereco(req, res) {
  const { id } = req.params;

  const schema = Joi.object({
    id: Joi.string().trim().required(),
  });

  try {
    await schema.validateAsync({ id });
  } catch (error) {
    return res.status(400).json({ message: "Invalid request", error });
  }

  try {
    const endereco = await db("endereco_atual")
      .join("usuarios_endereco", "endereco_atual.id_endereco_atual", "=", "usuarios_endereco.id_endereco_atual")
      .join("usuarios", "usuarios.id_usuarios", "=", "usuarios_endereco.id_usuarios")
      .where("usuarios.id_usuarios", id)
      .select("endereco_atual.*");

    if (!endereco.length) {
      return res.status(404).json({ message: "Endereço não encontrado" });
    }

    return res.json( endereco );
  } catch (error) {
    console.error("Erro ao buscar endereço:", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  } 
}
  

async function atualizarEndereco(req, res) {
  const { id: id_endereco } = req.params;

  const { error: validationError, value } = Joi.object({
    cep: Joi.string(),
    pais: Joi.string(),
    estado: Joi.string(),
    cidade: Joi.string(),
    bairro: Joi.string(),
    logradouro: Joi.string(),
    numero: Joi.string(),
    complemento: Joi.string(),
    ponto_referencia: Joi.string(),
    id_usuarios: Joi.number().integer(),
  }).options({ allowUnknown: true }).validate(req.body, { abortEarly: false });
  
  
 
  if (validationError) {
    console.log(validationError);
    res.status(400).send(validationError.details[0].message);
    return;
  }

  try {
    const [endereco] = await db("endereco_atual")
      .where("id_endereco_atual", id_endereco) 
      .select();

    if (!endereco) {
      res.status(404).send("Endereço não encontrado");
      return;
    }

    const cep = value.cep || endereco.cep;
    const pais = value.pais || endereco.pais;
    const estado = value.estado || endereco.estado;
    const cidade = value.cidade || endereco.cidade;
    const bairro = value.bairro || endereco.bairro;
    const logradouro = value.logradouro || endereco.logradouro;
    const numero = value.numero || endereco.numero;
    const complemento = value.complemento || endereco.complemento;
    const pontoReferencia = value.ponto_referencia || endereco.ponto_referencia;
    const idUsuarios = value.id_usuarios || endereco.id_usuarios;

    if (cep !== endereco.cep) {
      const enderecoCompleto = await cepPromise(cep);
      pais = enderecoCompleto.country;
      estado = enderecoCompleto.state;
      cidade = enderecoCompleto.city;
      bairro = enderecoCompleto.neighborhood;
      logradouro = enderecoCompleto.street;
    }

    await db("endereco_atual").where("id_endereco_atual", id_endereco).update({
      cep,
      pais,
      estado,
      cidade,
      bairro,
      logradouro,
      numero,
      complemento,
      ponto_referencia: pontoReferencia,
      id_usuarios: idUsuarios,
    });

    res.status(200).json("Endereço atualizado com sucesso");
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    res.status(500).json("Erro interno no servidor");
  }
} 

async function deletarEndereco(req, res) {
  const { id } = req.params;

  // Validação do id
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  const { error } = schema.validate({ id });
  if (error) {
    res.status(400).send(error.details[0].message);
    return;
  }

  try {
    const result = await db("endereco_atual")
      .where("id_endereco_atual", id)
      .del();

    if (result === 0) {
      res.status(404).send("Endereço não encontrado");
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.log("Erro ao deletar endereço:", error);
    res.status(500).send("Erro interno no servidor");
  }
}
   

module.exports = {
  criarEndereco,
  listarEnderecos,
  atualizarEndereco,
  deletarEndereco,
  getEndereco
};