module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: "sql302.epizy.com",
      user: "epiz_34139231",
      password: "SBqdwfsHDyvmiY",
      database: "epiz_34139231_riquirri",
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
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  }
};
