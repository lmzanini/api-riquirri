module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: "localhost",
      user: "root",
      password: "root",
      database: "riquirri",
      // host: "127.0.0.1",
      // user: "root",
      // password: "root",
      // database: "riquirri",
      port: 3306,
      multipleStatements: true,
      flags: ['-–sql-mode=ONLY_FULL_GROUP_BY'],
    },
    pool: {
      min: 2,
      max: 10
    },
  },
  production: {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'seu-banco-de-dados'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
  
};
