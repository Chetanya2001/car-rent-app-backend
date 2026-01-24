require("dotenv").config();

module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASS,
  DB: process.env.DB_NAME,
  dialect: process.env.DB_DIALECT,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

// require("dotenv").config();

// module.exports = {
//   development: {
//     USER: process.env.DB_USER,
//     PASSWORD: process.env.DB_PASS,
//     DB: process.env.DB_NAME,
//     HOST: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT,
//     port: 3306,
//   },
//   production: {
//     username: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT,
//     port: 3306,
//     pool: {
//       max: 5,
//       min: 0,
//       acquire: 30000,
//       idle: 10000,
//     },
//   },
// };
