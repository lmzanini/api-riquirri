async function countUsers(db) {
  const [count] = await db('produtos').count();

  return count['count(*)'];
};

async function countProdutos(db) {
  const [countP] = await db('produtos');


  return countP['count(*)'];
};

async function countEnderecos(db) {
  const result = await db("endereco_atual").count("* as count");
  return result[0].count;
};


module.exports = countUsers, countEnderecos, countProdutos;
