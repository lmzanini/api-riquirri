const knexConfig = require("../knexfile");
const env = process.env.NODE_ENV || "development";
const config = knexConfig[env];
const knex = require("knex");
const db = knex(config);
const Joi = require("joi");

async function criarProduto(req, res) {
  let {
    nome,
    especificacao,
    descricao,
    descricao_curta,
    valor,
    desconto,
    quantidade,
    categorias,
    ativo,
    destaque,
    oferta,
  } = req.body;

  // Converter string para booleano
  ativo = ativo === "true";
  destaque = destaque === "true";
  oferta = oferta === "true";

  // Converter booleanos para números
  ativo = ativo ? 1 : 0;
  destaque = destaque ? 1 : 0;
  oferta = oferta ? 1 : 0;

  console.log(typeof req.body.ativo);

  const categoriasArray = categorias
    .split(",")
    .map((categoriaId) => parseInt(categoriaId.trim()));

  const imagens = req.files.map((file) => ({
    imagem: file.filename,
  }));

  const schema = Joi.object({
    nome: Joi.string().required(),
    especificacao: Joi.string().required(),
    descricao: Joi.string().required(),
    descricao_curta: Joi.string().required(),
    valor: Joi.number().required(),
    desconto: Joi.number().required(),
    quantidade: Joi.number().required(),
    categorias: Joi.array().items(Joi.number().required()).required(),
    ativo: Joi.number().min(0).max(1),
    destaque: Joi.number().min(0).max(1),
    oferta: Joi.number().min(0).max(1),
    imagens: Joi.array()
      .items(
        Joi.object({
          imagem: Joi.string().required(),
        })
      )
      .required(),
  });

  try {
    await schema.validateAsync({
      nome,
      especificacao,
      descricao,
      descricao_curta,
      valor,
      desconto,
      quantidade,
      categorias: categoriasArray,
      ativo,
      destaque,
      oferta,
      imagens,
    });

    const [produtoId] = await db("produtos").insert({
      nome,
      especificacao,
      descricao,
      descricao_curta,
      valor,
      desconto,
      valor_atual: valor - desconto,
      quantidade,
      ativo,
      destaque,
      oferta,
    });

    const categoriasProduto = categoriasArray.map((categoriaId) => ({
      produtos_id_produtos: produtoId,
      categorias_id_categorias: categoriaId,
    }));
    await db("produtos_categoria").insert(categoriasProduto);

    const imagensIds = [];
    for (const imagem of imagens) {
      const [imagemId] = await db("imagem_produto").insert(imagem);
      imagensIds.push(imagemId);
    }

    const produtosImagemProduto = imagensIds.map((imagemId) => ({
      imagem_produto_id_imagem_produto: imagemId,
      produtos_id_produtos: produtoId,
    }));
    await db("produtos_imagem_produto").insert(produtosImagemProduto);

    return res.status(201).json({ id: produtoId });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ message: "Ocorreu um erro ao criar o produto" });
  }
}

async function listarProdutos(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;
 
    const [count] = await db("produtos").count();
    const totalProdutos = count["count(*)"];
    const totalPages = Math.ceil(totalProdutos / limit);

    const produtos = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos_categoria.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos_imagem_produto.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .groupBy("produtos.id_produtos")
      .limit(limit)
      .offset((page - 1) * limit);

    if (!produtos || produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" }); 
    }

    const produtosFormatados = produtos.map(produto => {
      const categorias = produto.categorias_id ? produto.categorias_id.split(",") : [];
      const categorias_nome = produto.categorias_nome ? produto.categorias_nome.split(",") : [];
      const imagens = produto.imagens ? produto.imagens.split(",") : [];
      

      const produtoFormatado = {
        id: produto.id_produtos,
        nome: produto.nome,
        especificacao: produto.especificacao,
        descricao: produto.descricao,
        descricao_curta: produto.descricao_curta,
        valor: produto.valor,
        desconto: produto.desconto,
        valor_atual: produto.valor_atual,
        quantidade: produto.quantidade,
        ativo: produto.ativo,
        destaque: produto.destaque,
        oferta: produto.oferta,

        categorias: categorias.map((id, index) => ({
          id: id,
          nome: categorias_nome[index],
        })),

        imagens: [],
      };
      produtoFormatado.imagens = imagens.length ? imagens : [];
      return produtoFormatado;
    });

    return res.json({
      produtos: produtosFormatados,
      totalPages,
      totalProdutos,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o produto" });
  }
}

async function listarProdutosAtivos(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;
 
    const [count] = await db("produtos").where("ativo", 1).count();

    const totalProdutos = count["count(*)"];
    const totalPages = Math.ceil(totalProdutos / limit);

    const produtos = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos_categoria.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos_imagem_produto.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .where("produtos.ativo", "=", 1)
      .groupBy("produtos.id_produtos")
      .limit(limit)
      .offset((page - 1) * limit);

    if (!produtos || produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produtosFormatados = produtos.map(produto => {
      const categorias = produto.categorias_id ? produto.categorias_id.split(",") : [];
      const categorias_nome = produto.categorias_nome ? produto.categorias_nome.split(",") : [];
      const imagens = produto.imagens ? produto.imagens.split(",") : [];
      

      const produtoFormatado = {
        id: produto.id_produtos,
        nome: produto.nome,
        especificacao: produto.especificacao,
        descricao: produto.descricao,
        descricao_curta: produto.descricao_curta,
        valor: produto.valor,
        desconto: produto.desconto,
        valor_atual: produto.valor_atual,
        quantidade: produto.quantidade,
        ativo: produto.ativo,
        destaque: produto.destaque,
        oferta: produto.oferta,

        categorias: categorias.map((id, index) => ({
          id: id,
          nome: categorias_nome[index],
        })),

        imagens: [],
      };
      produtoFormatado.imagens = imagens.length ? imagens : [];
      return produtoFormatado;
    });

    return res.json({
      produtos: produtosFormatados,
      totalPages,
      totalProdutos,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o produto" });
  }
}

async function buscarProdutoPorId(req, res) {
  const { id } = req.params;

  try {
    const produto = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos_categoria.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos_imagem_produto.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .where("produtos.id_produtos", "=", id)
      .groupBy("produtos.id_produtos")
      .first();

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const categorias = produto.categorias_id.split(",");
    const categorias_nome = produto.categorias_nome.split(",");
    const imagens = produto.imagens.split(",");

    const produtoFormatado = {
      id: produto.id_produtos,
      nome: produto.nome,
      especificacao: produto.especificacao,
      descricao: produto.descricao,
      descricao_curta: produto.descricao_curta,
      valor: produto.valor,
      desconto: produto.desconto,
      valor_atual: produto.valor_atual,
      quantidade: produto.quantidade,
      ativo: produto.ativo,
      destaque: produto.destaque,
      oferta: produto.oferta,
      
      categorias: categorias.map((id, index) => ({
        id: id,
        nome: categorias_nome[index],
      })),

      imagens: [],
    };
    produtoFormatado.imagens = imagens.length ? imagens : [];

    return res.json(produtoFormatado);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o produto" });
  }
}

async function listarProdutosAtivosOferta(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;
 
    const [count] = await db("produtos").where("ativo", 1).andWhere("oferta", 1).count();

    const totalProdutos = count["count(*)"];
    const totalPages = Math.ceil(totalProdutos / limit);

    const produtos = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos_categoria.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos_imagem_produto.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .where("produtos.ativo", "=", 1)
      .andWhere("produtos.oferta", "=", 1)
      .groupBy("produtos.id_produtos")
      .limit(limit)
      .offset((page - 1) * limit);

    if (!produtos || produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produtosFormatados = produtos.map(produto => {
      const categorias = produto.categorias_id ? produto.categorias_id.split(",") : [];
      const categorias_nome = produto.categorias_nome ? produto.categorias_nome.split(",") : [];
      const imagens = produto.imagens ? produto.imagens.split(",") : [];
      

      const produtoFormatado = {
        id: produto.id_produtos,
        nome: produto.nome,
        especificacao: produto.especificacao,
        descricao: produto.descricao,
        descricao_curta: produto.descricao_curta,
        valor: produto.valor,
        desconto: produto.desconto,
        valor_atual: produto.valor_atual,
        quantidade: produto.quantidade,
        ativo: produto.ativo,
        destaque: produto.destaque,
        oferta: produto.oferta,

        categorias: categorias.map((id, index) => ({
          id: id,
          nome: categorias_nome[index],
        })),

        imagens: [],
      };
      produtoFormatado.imagens = imagens.length ? imagens : [];
      return produtoFormatado;
    });

    return res.json({
      produtos: produtosFormatados,
      totalPages,
      totalProdutos,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o produto" });
  }
}

async function listarProdutosAtivosDestaque(req, res) {
  try {
    const { page = 1, limit = 16 } = req.query;
 
    const [count] = await db("produtos").where("ativo", 1).andWhere("destaque", 1).count();

    const totalProdutos = count["count(*)"];
    const totalPages = Math.ceil(totalProdutos / limit);

    const produtos = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos_categoria.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos_imagem_produto.produtos_id_produtos",
        "=",
        "produtos.id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .where("produtos.ativo", "=", 1)
      .andWhere("produtos.destaque", "=", 1)
      .groupBy("produtos.id_produtos")
      .limit(limit)
      .offset((page - 1) * limit);

    if (!produtos || produtos.length === 0) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    const produtosFormatados = produtos.map(produto => {
      const categorias = produto.categorias_id ? produto.categorias_id.split(",") : [];
      const categorias_nome = produto.categorias_nome ? produto.categorias_nome.split(",") : [];
      const imagens = produto.imagens ? produto.imagens.split(",") : [];
      

      const produtoFormatado = {
        id: produto.id_produtos,
        nome: produto.nome,
        especificacao: produto.especificacao,
        descricao: produto.descricao,
        descricao_curta: produto.descricao_curta,
        valor: produto.valor,
        desconto: produto.desconto,
        valor_atual: produto.valor_atual,
        quantidade: produto.quantidade,
        ativo: produto.ativo,
        destaque: produto.destaque,
        oferta: produto.oferta,

        categorias: categorias.map((id, index) => ({
          id: id,
          nome: categorias_nome[index],
        })),

        imagens: [],
      };
      produtoFormatado.imagens = imagens.length ? imagens : [];
      return produtoFormatado;
    });

    return res.json({
      produtos: produtosFormatados,
      totalPages,
      totalProdutos,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar o produto" });
  }
}

const getProductByName = async (req, res) => {
  const { nome } = req.query;

  try {
    const produtos = await db("produtos")
      .select(
        "produtos.id_produtos",
        "produtos.nome",
        "produtos.especificacao",
        "produtos.descricao",
        "produtos.descricao_curta",
        "produtos.valor",
        "produtos.desconto",
        "produtos.valor_atual",
        "produtos.quantidade",
        "produtos.ativo",
        "produtos.destaque",
        "produtos.oferta",
        db.raw(
          "GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/',imagem_produto.imagem)) as imagens"
        ),
        db.raw(
          "GROUP_CONCAT(DISTINCT categorias.id_categorias) as categorias_id"
        ),
        db.raw("GROUP_CONCAT(DISTINCT categorias.nome) as categorias_nome")
      )
      .leftJoin(
        "produtos_categoria",
        "produtos.id_produtos",
        "=",
        "produtos_categoria.produtos_id_produtos"
      )
      .leftJoin(
        "categorias",
        "categorias.id_categorias",
        "=",
        "produtos_categoria.categorias_id_categorias"
      )
      .leftJoin(
        "produtos_imagem_produto",
        "produtos.id_produtos",
        "=",
        "produtos_imagem_produto.produtos_id_produtos"
      )
      .leftJoin(
        "imagem_produto",
        "imagem_produto.id_imagem_produto",
        "=",
        "produtos_imagem_produto.imagem_produto_id_imagem_produto"
      )
      .where("produtos.nome", "like", `%${nome}%`)
      .groupBy("produtos.id_produtos");

    const produtosFormatados = produtos.map((produto) => {
      const categorias = produto.categorias
        ? produto.categorias.split(",").map((categoria) => {
            const [id, nome] = categoria.split(":");
            return { id: id, nome: nome };
          })
        : [];

      const imagens = produto.imagens ? produto.imagens.split(",") : [];

      return { ...produto, categorias: categorias, imagens: imagens };
    });

    res.status(200).json(produtosFormatados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar o produto" });
  }
};

async function atualizarProduto(req, res) {
  let {
    nome,
    especificacao,
    descricao,
    descricao_curta,
    valor,
    desconto,
    quantidade,
    categorias,   
    ativo,
    destaque,
    oferta,
  } = req.body;

  // Converter string para booleano
  ativo = ativo === "true";
  destaque = destaque === "true";
  oferta = oferta === "true";

  // Converter booleanos para números
  ativo = ativo ? 1 : 0;
  destaque = destaque ? 1 : 0;
  oferta = oferta ? 1 : 0;

  const categoriasArray = categorias
    .split(",")
    .map((categoriaId) => parseInt(categoriaId.trim()));

  const imagens = req.files.map((file) => ({
    imagem: file.filename,
  }));

  const query = db("produtos").where({ id_produtos: req.params.id });

  const produto = await query.select().first();

  if (!produto) {
    return res.status(404).json({ message: "Produto não encontrado" });
  }

  const valor_atual = valor - desconto;

  try {
    await query.update({
      nome,
      especificacao,
      descricao,
      descricao_curta,
      valor,
      desconto,
      valor_atual,
      quantidade,
      ativo,
      destaque,
      oferta,
    });

    // Atualiza as categorias do produto
    await db("produtos_categoria")
      .where({ produtos_id_produtos: req.params.id })
      .del();
    const categoriasProduto = categoriasArray.map((categoriaId) => ({
      produtos_id_produtos: req.params.id,
      categorias_id_categorias: categoriaId,
    }));
    await db("produtos_categoria").insert(categoriasProduto);

    // Atualiza as imagens do produto
    await db("produtos_imagem_produto")
      .where({ produtos_id_produtos: req.params.id })
      .del();
    const imagensIds = [];
    for (const imagem of imagens) {
      const [imagemId] = await db("imagem_produto").insert(imagem);
      imagensIds.push(imagemId);
    }
    const produtosImagemProduto = imagensIds.map((imagemId) => ({
      imagem_produto_id_imagem_produto: imagemId,
      produtos_id_produtos: req.params.id,
    }));
    await db("produtos_imagem_produto").insert(produtosImagemProduto);

    return res.status(200).json({ id_produtos: req.params.id });
  } catch (error) {
    console.error(error); 
    return res
      .status(400)
      .json({ message: "Ocorreu um erro ao atualizar o produto" });
  }
}

async function buscarProdutosPorCategoria(req, res) {
  const { id } = req.params;
  const { page = 1, limit = 16 } = req.query;
 
  const [count] = await db("produtos")
  .count()
  .leftJoin(
    "produtos_categoria",
    "produtos_categoria.produtos_id_produtos",
    "=",
    "produtos.id_produtos"
  )
  .where("produtos_categoria.categorias_id_categorias", "=", id);

  const totalProdutos = count["count(*)"];
  const totalPages = Math.ceil(totalProdutos / limit);
 
  try {
    const produtos = await db("produtos")
  .select(
    "produtos.id_produtos",
    "produtos.nome",
    "produtos.especificacao",
    "produtos.descricao",
    "produtos.descricao_curta",
    "produtos.valor",
    "produtos.desconto",
    "produtos.valor_atual",
    "produtos.quantidade",
    "produtos.ativo",
    "produtos.destaque",
    "produtos.oferta",
    db.raw("(SELECT GROUP_CONCAT(CONCAT('https://api-riquirri.onrender.com/uploads/', imagem)) FROM produtos_imagem_produto INNER JOIN imagem_produto ON imagem_produto.id_imagem_produto = produtos_imagem_produto.imagem_produto_id_imagem_produto WHERE produtos_imagem_produto.produtos_id_produtos = produtos.id_produtos) as imagens"),
    db.raw("(SELECT GROUP_CONCAT(DISTINCT categorias.id_categorias) FROM produtos_categoria INNER JOIN categorias ON categorias.id_categorias = produtos_categoria.categorias_id_categorias WHERE produtos_categoria.produtos_id_produtos = produtos.id_produtos) as categorias_id"),
    db.raw("(SELECT GROUP_CONCAT(DISTINCT categorias.nome) FROM produtos_categoria INNER JOIN categorias ON categorias.id_categorias = produtos_categoria.categorias_id_categorias WHERE produtos_categoria.produtos_id_produtos = produtos.id_produtos) as categorias_nome")

  )
  .leftJoin(
    "produtos_categoria",
    "produtos_categoria.produtos_id_produtos",
    "=",
    "produtos.id_produtos"
  )
  .leftJoin(
    "categorias",
    "categorias.id_categorias",
    "=",
    "produtos_categoria.categorias_id_categorias"
  )
  .where("categorias.id_categorias", "=", id)
  .groupBy("produtos.id_produtos")
  .limit(limit)
  .offset((page - 1) * limit);



    if (!produtos.length) {
      return res.status(404).json({ message: "Nenhum produto encontrado para essa categoria" });
    }

    const produtosFormatados = produtos.map(produto => {
      const categorias = produto.categorias_id ? produto.categorias_id.split(",") : [];
      const categorias_nome = produto.categorias_nome ? produto.categorias_nome.split(",") : [];
      const imagens = produto.imagens ? produto.imagens.split(",") : [];

      const produtoFormatado = {
        id: produto.id_produtos,
        nome: produto.nome,
        especificacao: produto.especificacao,
        descricao: produto.descricao,
        descricao_curta: produto.descricao_curta,
        valor: produto.valor,
        desconto: produto.desconto,
        valor_atual: produto.valor_atual,
        quantidade: produto.quantidade,
        ativo: produto.ativo,
        destaque: produto.destaque,
        oferta: produto.oferta,

        categorias: categorias.map((id, index) => ({
          id: id,
          nome: categorias_nome[index],
        })),

        imagens: [],
      };

      produtoFormatado.imagens = imagens.length ? imagens : [];
      return produtoFormatado;
    });

    return res.json({
      produtos: produtosFormatados,
      totalPages,
      totalProdutos,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Ocorreu um erro ao buscar os produtos" });
  }
}

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await db.transaction(async (trx) => {
      // remove as associações entre o produto e suas imagens na tabela "produtos_imagem_produto"
      await trx("produtos_imagem_produto")
        .where({ produtos_id_produtos: id })
        .del();

      // remove as associações entre o produto e suas categorias na tabela "produtos_categoria"
      await trx("produtos_categoria").where({ produtos_id_produtos: id }).del();

      // remove o produto da tabela "produtos"
      await trx("produtos").where({ id_produtos: id }).del();
    });

    res.status(200).json({ message: "Produto deletado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar o produto" });
  }
};

module.exports = {
  criarProduto,
  listarProdutos,
  listarProdutosAtivos,
  buscarProdutoPorId,
  getProductByName,
  atualizarProduto,
  deleteProduct,
  buscarProdutosPorCategoria,
  listarProdutosAtivosOferta,
  listarProdutosAtivosDestaque
};
