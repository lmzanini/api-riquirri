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
      host: process.env.DATABASE_URL,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
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
    }
  } 
};
