const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const CPF = require("cpf");
const { phone } = require("phone");
const Joi = require("joi");
const knexConfig = require("../knexfile");

const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");

const db = knex(config);
const { sortByFullName } = require("../utils/sortFunctions");
const countUsers = require("../utils/count");
const countProdutos = require("../utils/count");

const schema = Joi.object({
  id: Joi.number(),
  email: Joi.string().email().min(5).max(100),
  telefone: Joi.string().max(11),
  senha: Joi.string().min(8),
  nome_completo: Joi.string().min(3).max(200),
  cpf: Joi.string().length(11),
  admin: Joi.number(),
  id_endereco_atual: Joi.number().integer().min(1),
  pergunta_secreta: Joi.string().required(),
  resposta_secreta: Joi.string().required(),
}).min(1);

async function getAllUsers(req, res) {
  try {
    const {
      page = 1, 
      limit = 16,
      orderBy = "nome_completo",
      orderDirection = "asc",
    } = req.query;

    // Realiza a validação dos parâmetros da query utilizando Joi
    const schema = Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1),
      orderBy: Joi.string().valid(
        "id_usuarios",
        "email",
        "telefone",
        "nome_completo",
        "cpf",
        "admin"
      ),
      orderDirection: Joi.string().valid("asc", "desc"),
    });
    await schema.validateAsync(req.query);

    // Realiza a contagem total de usuários para a paginação
    const totalUsers = await countProdutos(db);

    // Realiza a consulta dos usuários utilizando Knex e realiza a ordenação
    const usuarios = await db
      .select(
        "usuarios.id_usuarios",
        "usuarios.email",
        "usuarios.telefone",
        "usuarios.nome_completo",
        "usuarios.cpf",
        "usuarios.senha",
        "usuarios.admin",
        "usuarios.pergunta_secreta",
        "usuarios.resposta_secreta",
        "usuarios_endereco.id_usuarios_endereco",
        "usuarios_endereco.id_endereco_atual",
        "endereco_atual.*"
      )  
      .from("usuarios")
      .leftJoin(
        "usuarios_endereco",
        "usuarios.id_usuarios",
        "=",
        "usuarios_endereco.id_usuarios"
      )
      .leftJoin(
        "endereco_atual",
        "usuarios_endereco.id_endereco_atual",
        "=",
        "endereco_atual.id_endereco_atual"
      )
      .orderBy(orderBy, orderDirection)
      .limit(limit)
      .offset((page - 1) * limit);

    const totalPages = Math.ceil(totalUsers / limit);

    if (page > totalPages) {
      return res.status(400).json({ message: "Página inválida." });
    }

    const usuariosOrdenados = usuarios.sort(sortByFullName);

    // Retorna a resposta com os usuários e as informações de paginação
    res.status(200).json({
      data: usuariosOrdenados,
      totalUsers,
      totalPages,
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ocorreu um erro ao buscar os usuários." });
  }
}

async function getUser(req, res) {
  // const db = req.app.get('db');
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
    const user = await db("usuarios")
      .leftJoin(
        "usuarios_endereco",
        "usuarios.id_usuarios",
        "usuarios_endereco.id_usuarios"
      )
      .leftJoin(
        "endereco_atual",
        "usuarios_endereco.id_endereco_atual",
        "endereco_atual.id_endereco_atual"
      )
      .where("usuarios.id_usuarios", id)
      .orWhere("usuarios.cpf", id)
      .orWhere("usuarios.email", id)
      .orWhere("usuarios.telefone", id)
      .orWhere("usuarios.nome_completo", "like", `%${id}%`)
      .select(
        "usuarios.id_usuarios",
        "usuarios.email",
        "usuarios.telefone",
        "usuarios.nome_completo",
        "usuarios.cpf",
        "usuarios.senha",
        "usuarios.admin",
        "usuarios.pergunta_secreta",
        "usuarios.resposta_secreta",
        "usuarios_endereco.id_usuarios_endereco",
        "usuarios_endereco.id_endereco_atual",
        "endereco_atual.*"
      )
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json( user );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function cadastrarUsuario(req, res) {
  try {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((item) => item.message);
      console.log(messages)
      return res.status(400).json({ messages });
    }

    const { email, telefone, senha, nome_completo, cpf, pergunta_secreta, resposta_secreta } = value;

    // Verifica se o CPF é válido
    if (!CPF.isValid(cpf)) {
      return res.status(400).json({ message: "CPF inválido" });
    }

    // Verifica se o número de telefone celular é válido
    const cel = phone(telefone, { country: "BRA" });
    if (cel.isValid === false) {
      return res
        .status(400)
        .json({ message: "Número de telefone celular inválido" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const usuario = {
      email,
      telefone,
      senha: hashedPassword,
      nome_completo,
      cpf,
      pergunta_secreta,
      resposta_secreta
    };

    // Insere o usuário no banco de dados
    const [id_usuarios] = await db("usuarios").insert(usuario);

    // Retorna o usuário cadastrado
    usuario.id_usuarios = id_usuarios;
    delete usuario.senha;
    res.status(201).json(usuario);
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    console.log(error)
    res.status(500).send("Erro interno no servidor");
  }
}

async function cadastrarAdmin(req, res) {
  try {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const messages = error.details.map((item) => item.message);
      console.log("testando o erro");
      return res.status(400).json({ mensagem: "A senha deve ter no mínimo 8 caracteres." });
    }
    const {
      email,
      telefone,
      senha,
      nome_completo,
      cpf,
      admin = 0,
      pergunta_secreta,
      resposta_secreta,
    } = value;

    if (!CPF.isValid(cpf)) {
      return res.status(400).json({ message: "CPF inválido" });
    }

    // Verifica se o número de telefone celular é válido
    const cel = phone(telefone, { country: "BRA" });
    if (cel.isValid === false) {
      return res
        .status(400)
        .json({ message: "Número de telefone celular inválido" });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const adminValue = admin ? 1 : 0;

    const usuario = {
      email,
      telefone,
      senha: hashedPassword,
      nome_completo,
      cpf,
      admin: adminValue,
      pergunta_secreta,
      resposta_secreta,
    };

    // Insere o usuário no banco de dados
    const [id_usuarios] = await db("usuarios").insert(usuario);

    // Retorna o usuário cadastrado
    usuario.id_usuarios = id_usuarios;
    delete usuario.senha;
    res.status(201).json(usuario);
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    let message = "Erro interno no servidor";
    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage.includes("email_UNIQUE")) {
        message = "Já existe um usuário com este email";
      } else if (error.sqlMessage.includes("cpf_UNIQUE")) {
        message = "Já existe um usuário com este CPF";
      } else if (error.sqlMessage.includes("telefone_UNIQUE")) {
        message = "Já existe um usuário com este telefone";
      } else {
        message = "Entrada duplicada";
      }
    }

    if (error === '[ValidationError]: "senha" length must be at least 8 characters long]') {

        message = "senha errada";


    }
    res.status(500).json({ mensagem: message });
  }
}

async function login(req, res) {
  const { email, senha } = req.body;

  try {
    const usuario = await db("usuarios").where({ email }).first();

    if (!usuario) {
      res.status(401).send("Usuário não encontrado");
      return;
    }

    const match = await bcrypt.compare(senha, usuario.senha);

    if (!match) {
      res.status(401).send("Senha incorreta");
      return;
    }

    const token = jwt.sign(
      {
        id_usuarios: usuario.id_usuarios,
        nome: usuario.nome_completo,
        email: usuario.email,
        admin: usuario.admin
      },
      // process.env.JWT_KEY,
      "Requirri@183791",
      { expiresIn: "1h" } // tempo de expiração do token
    );

    // Removendo o campo "senha" do objeto de usuário retornado
    const { senha: _, ...usuarioWithoutSenha } = usuario;

    res.json({ usuario: usuarioWithoutSenha, token }); // Adicionando a linha de retorno do token
  } catch (err) {
    console.log("Erro ao buscar usuário:", err);
    res.status(500).send("Erro interno no servidor");
  }
}

async function atualizarUsuario(req, res) {
  const { id } = req.params;
  const { email, telefone, nome_completo, cpf, pergunta_secreta, resposta_secreta, } = req.body;

  try {
    // Validando os dados de entrada
    const { error } = schema.validate(req.body);
  
    if (error) {   
      console.log(error);
      return res.status(400).send(error.details[0].message);
    }

    // Busca as informações atuais do registro 
    const [rows] = await db
      .select("*")
      .from("usuarios")
      .where("id_usuarios", id);

    if (rows.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    const usuario = rows[0];

    // Atualiza apenas os campos especificados em req.body
    const updateValues = {};

    if (email !== undefined) {
      updateValues.email = email;
    } else if (usuario && usuario.email) {
      updateValues.email = usuario.email;
    }

    if (telefone !== undefined) {
      updateValues.telefone = telefone;
    } else if (usuario && usuario.telefone) {
      updateValues.telefone = usuario.telefone;
    }

    if (nome_completo !== undefined) {
      updateValues.nome_completo = nome_completo;
    } else if (usuario && usuario.nome_completo) {
      updateValues.nome_completo = usuario.nome_completo;
    }

    if (cpf !== undefined) {
      updateValues.cpf = cpf;
    } else if (usuario && usuario.cpf) {
      updateValues.cpf = usuario.cpf;
    }

    if (pergunta_secreta !== undefined) {
      updateValues.pergunta_secreta = pergunta_secreta;
    } else if (usuario && usuario.pergunta_secreta) {
      updateValues.pergunta_secreta = usuario.pergunta_secreta;
    }

    if (resposta_secreta !== undefined) {
      updateValues.resposta_secreta = resposta_secreta;
    } else if (usuario && usuario.resposta_secreta) {
      updateValues.resposta_secreta = usuario.resposta_secreta;
    }

    await db("usuarios").where("id_usuarios", id).update(updateValues);

    const response = {
      mensagem: "Usuario atualizado com sucesso",
      usuarioAtualizado: {
        id_usuarios: id,
        email: updateValues.email,
        telefone: updateValues.telefone,
        nome_completo: updateValues.nome_completo,
        cpf: updateValues.cpf,
        pergunta_Secreta: updateValues.pergunta_Secreta,
        resposta_secreta: updateValues.resposta_secreta
      },
    };
    return res.status(202).send(response);
  } catch (err) {
    console.log("Erro ao atualizar usuário:", err);
    res.status(500).send("Erro interno no servidor");
  }
}

async function atualizarAdmin(req, res) {
  const { id } = req.params;
  const { email, telefone, nome_completo, cpf, admin, pergunta_secreta, resposta_secreta } = req.body;

  try {
    // Validando os dados de entrada
    // const { error } = schema.validate(req.body);

    // if (error) {
    //   console.log(error);
    //   return res.status(400).send(error.details[0].message);
    // }

    // Busca as informações atuais do registro
    const [rows] = await db
      .select("*")
      .from("usuarios")
      .where("id_usuarios", id);

    if (rows.length === 0) {
      return res.status(404).send("Usuário não encontrado");
    }

    const usuario = rows[0];

    // Atualiza apenas os campos especificados em req.body
    const updateValues = {};

    if (email !== undefined) {
      updateValues.email = email;
    } else if (usuario && usuario.email) {
      updateValues.email = usuario.email;
    }

    if (telefone !== undefined) {
      updateValues.telefone = telefone;
    } else if (usuario && usuario.telefone) {
      updateValues.telefone = usuario.telefone;
    }

    if (nome_completo !== undefined) {
      updateValues.nome_completo = nome_completo;
    } else if (usuario && usuario.nome_completo) {
      updateValues.nome_completo = usuario.nome_completo;
    }

    if (cpf !== undefined) {
      updateValues.cpf = cpf;
    } else if (usuario && usuario.cpf) {
      updateValues.cpf = usuario.cpf;
    }

    if (admin !== undefined) {
      updateValues.admin = admin;
    } else if (usuario && usuario.admin) {
      updateValues.admin = usuario.admin;
    }

    if (pergunta_secreta !== undefined) {
      updateValues.pergunta_secreta = pergunta_secreta;
    } else if (usuario && usuario.pergunta_secreta) {
      updateValues.pergunta_secreta = usuario.pergunta_secreta;
    }

    if (resposta_secreta !== undefined) {
      updateValues.resposta_secreta = resposta_secreta;
    } else if (usuario && usuario.resposta_secreta) {
      updateValues.resposta_secreta = usuario.resposta_secreta;
    }

    await db("usuarios").where("id_usuarios", id).update(updateValues);

    const response = {
      mensagem: "Usuario atualizado com sucesso",
      usuarioAtualizado: {
        id_usuarios: id,
        email: updateValues.email,
        telefone: updateValues.telefone,
        nome_completo: updateValues.nome_completo,
        cpf: updateValues.cpf,
        admin: updateValues.admin,
        pergunta_secreta: updateValues.pergunta_secreta,
        resposta_secreta: updateValues.resposta_secreta
      },
    };
    return res.status(202).send(response);
  } catch (error) {
    console.log("Erro ao atualizar usuário:", error);
    let message = "Erro interno no servidor";
    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage.includes("email_UNIQUE")) {
        message = "Já existe um usuário com este email";
      } else if (error.sqlMessage.includes("cpf_UNIQUE")) {
        message = "Já existe um usuário com este CPF";
      } else if (error.sqlMessage.includes("telefone_UNIQUE")) {
        message = "Já existe um usuário com este telefone";
      } else {
        message = "Entrada duplicada";
      }
    }
    res.status(500).json({ mensagem: message });
  }
  
  
  
}

async function deletarUsuario(req, res) {
  try {
    const id = req.params.id;

    const schema = Joi.number().positive().required();
    await schema.validateAsync(id);

    await db.transaction(async (trx) => {
      await trx("usuarios_endereco").where({ id_usuarios: id }).del();
      const result = await trx("usuarios").where({ id_usuarios: id }).del();

      if (result === 0) {
        res.status(404).send("Usuário não encontrado");
        return;
      }

      res.status(204).send("Usuário deletado com sucesso");
      console.log("Usuário deletado com sucesso");
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).send("Erro interno no servidor");
  }
}

async function trocarSenha(req, res) {
  // Define o schema do Joi para validar a requisição
  const schema = Joi.object({
    email: Joi.string().email().required(),
    senhaNova: Joi.string().min(8).required(),
    pergunta_secreta: Joi.string().required(),
    resposta_secreta: Joi.string().required()
  });

  // Valida a requisição com o Joi
  const { error, value } = schema.validate(req.body);

  // Se houver erro de validação, retorna um erro 400 (Bad Request)
  if (error) {
    console.log(error ); 
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, senhaNova, pergunta_secreta, resposta_secreta } = value;

  try {
    // Busca o usuário no banco de dados
    const usuario = await db("usuarios")
      .where({ email })
      .select("id_usuarios", "pergunta_secreta", "resposta_secreta", "senha")
      .first();

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Verifica se a pergunta secreta e resposta secreta estão corretas
    if (usuario.pergunta_secreta !== pergunta_secreta || usuario.resposta_secreta !== resposta_secreta) {
      console.log("Pergunta secreta ou resposta secreta incorreta");
      return res.status(401).json({ message: "Pergunta secreta ou resposta secreta incorreta" });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(senhaNova, 10);

    // Atualiza a senha do usuário no banco de dados
    await db("usuarios")
      .where({ id_usuarios: usuario.id_usuarios }) 
      .update({ senha: hashedPassword });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function getUserByName(req, res) {
  const { nome } = req.query;

  const schema = Joi.object({
    nome: Joi.string().trim().required(),
  });

  try {
    await schema.validateAsync( {nome} );
  } catch (error) {
    return res.status(400).json({ message: "Invalid request", error });
  }

  try {
    const user = await db("usuarios")
    .leftJoin(
      "usuarios_endereco",
      "usuarios.id_usuarios",
      "usuarios_endereco.id_usuarios"
    )
    .leftJoin(
      "endereco_atual",
      "usuarios_endereco.id_endereco_atual",
      "endereco_atual.id_endereco_atual"
    )
    .where("usuarios.nome_completo", "like", `%${nome}%`)
    .select(
      "usuarios.id_usuarios",
      "usuarios.email",
      "usuarios.telefone",
      "usuarios.nome_completo",
      "usuarios.cpf",
      "usuarios.senha",
      "usuarios.admin",
      "usuarios.pergunta_secreta",
      "usuarios.resposta_secreta",
      "usuarios_endereco.id_usuarios_endereco",
      "usuarios_endereco.id_endereco_atual",
      "endereco_atual.*"
    )
  
  console.log(user);
  

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({user});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

const getCurrentUser = async (req, res) => {
  const userId = req.user.id_usuarios; // ID do usuário armazenado no token
// console.log(userId);
  try {
    const user = await db("usuarios")
      .leftJoin(
        "usuarios_endereco",
        "usuarios.id_usuarios",
        "usuarios_endereco.id_usuarios"
      )
      .leftJoin(
        "endereco_atual",
        "usuarios_endereco.id_endereco_atual",
        "endereco_atual.id_endereco_atual"
      ) 
      .where("usuarios.id_usuarios", userId)
      .select(
        "usuarios.id_usuarios",
        "usuarios.email",
        "usuarios.telefone",
        "usuarios.nome_completo",
        "usuarios.cpf",
        "usuarios.senha",
        "usuarios.admin",
        "usuarios.pergunta_secreta",
        "usuarios.resposta_secreta",
        "usuarios_endereco.id_usuarios_endereco",
        "usuarios_endereco.id_endereco_atual",
        "endereco_atual.*"
      )
      .first();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remova as informações sensíveis do usuário, como a senha
    delete user.senha;

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 


module.exports = {
  cadastrarUsuario,
  login,
  atualizarUsuario,
  deletarUsuario,
  getAllUsers,
  trocarSenha,
  cadastrarAdmin,
  atualizarAdmin,
  getUser,
  getUserByName,
  getCurrentUser
};
