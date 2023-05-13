const fs = require('fs');

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: "123",
      user: "123",
      password: "123",
      database: "123",
      port: 3306,
      ssl: {
        rejectUnauthorized: true,
      },
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
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    },
    pool: {
      min: 2,
      max: 10
    }
  } 
};
