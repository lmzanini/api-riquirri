const cepPromise = require("cep-promise");
const estados = require("../utils/estados");

async function validarCep(cep) {
  try {
    const endereco = await cepPromise(cep);
    return endereco.cep;
  } catch (error) {
    throw new Error("CEP inválido.");
  }
}

function obterSiglaEstado(nomeEstado) {
  return estados[nomeEstado] || "";
}

async function formatarEndereco(cep) {
  const endereco = await cepPromise(cep);
  return {
    cep: endereco.cep,
    pais: "Brasil",
    estado: obterSiglaEstado(endereco.state),
    cidade: endereco.city,
    bairro: endereco.neighborhood,
    tipo_logradouro: endereco.street ? endereco.street_type : "",
    logradouro: endereco.street,
  };
}

module.exports = { formatarEndereco, validarCep, obterSiglaEstado };
