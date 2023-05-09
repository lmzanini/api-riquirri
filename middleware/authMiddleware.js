// const jwt = require('jsonwebtoken');
// const db = require('../db');

// function adminMiddleware(req, res, next) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).send('Token de autenticação não fornecido');
//   }

//   const [, token] = authHeader.split(' ');

//   jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
//     if (err) {
//       console.log('Erro ao verificar token de autenticação:', err);
//       return res.status(401).send('Token de autenticação inválido');
//     }

//     const { id_usuarios, admin } = decoded;

//     if (!admin) {
//       return res.status(403).send('Usuário não tem permissão para acessar este recurso');
//     }

//     const { id } = req.params;

//     db.query('SELECT * FROM usuarios WHERE id_usuarios = ?', [id], (err, results) => {
//       if (err) {
//         console.log('Erro ao buscar usuário:', err);
//         return res.status(500).send('Erro interno no servidor');
//       }

//       if (results.length === 0) {
//         return res.status(404).send('Usuário não encontrado');
//       }

//       const usuario = results[0];

//       if (usuario.admin) {
//         return res.status(403).send('Não é permitido alterar usuários com permissão de admin');
//       }

//       req.usuario = usuario;
//       next();
//     });
//   });
// }

// module.exports = adminMiddleware;
