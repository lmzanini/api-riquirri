module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: "localhost",
      user: "root",
      password: "root",
      database: "riquirri",
      port: 3306,
      ssl: {
        ca: '/path/to/ca.pem',
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
      },
      rejectUnauthorized: false,
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
      database: 'riquirri',
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,
        },
      },
      define: {
        timestamps: false,
      },
      // ssl: {
      //   ca: '/etc/secrets/ca.pem',
      //   cert: '/etc/secrets/cert.pem',
      //   key: '/etc/secrets/key.pem',
      // },

    },
    pool: {
      min: 2,
      max: 10
    }
  }
  
};
const sequelize = new Sequelize(
  "DATABASE_NAME",
  "USERNAME",
  "PASSWORD",
  {
    host: "HOST",
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
      },
    },
    define: {
      timestamps: false,
    },
  }
);