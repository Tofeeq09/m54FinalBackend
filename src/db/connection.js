// Path: src/db/connection.js

// Had to import dotenv here i don't know why but i had to even though i had already imported it in the server.js file
// require("dotenv").config();

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
});

const pool = new pg.Pool(config);

pool.on("connect", () => {
  const params = url.parse(process.env.POSTGRES_URI);
  console.log(`Connected to the PostgreSQL database: ${params.pathname.substring(1)}`);
});

// UUID stands for Universally Unique Identifier. It's a 128-bit number used to uniquely identify some object or entity. Because the ID is unique and hard to guess, it's often used for primary keys in database tables where you need a high level of uniqueness.
// BIGSERIAL is an auto-incrementing 8-byte integer that starts from 1 and increases by 1 with each new row. It's often used for primary keys where you need unique, non-null values.
const createTables = () => {
  const userTable = `
    CREATE TABLE IF NOT EXISTS users(
      id UUID PRIMARY KEY,
      username VARCHAR(128) UNIQUE NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      password VARCHAR(128) NOT NULL,
      profile_photo VARCHAR(512),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`;

  const groupTable = `
    CREATE TABLE IF NOT EXISTS groups(
      id UUID PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      tags VARCHAR(128)[],
      admin_id UUID REFERENCES users(id),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`;

  // On PostgreSQL DATE is stored in the format YYYY-MM-DD, and TIME is stored in the format HH:MI:SS.
  const eventTable = `
    CREATE TABLE IF NOT EXISTS events(
      id UUID PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      date DATE,
      time TIME,
      location TEXT,
      group_id UUID REFERENCES groups(id),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`;

  const postTable = `
    CREATE TABLE IF NOT EXISTS posts(
      id UUID PRIMARY KEY,
      content TEXT NOT NULL,
      author_id UUID REFERENCES users(id),
      group_id UUID REFERENCES groups(id),
      event_id UUID REFERENCES events(id),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`;

  const commentTable = `
    CREATE TABLE IF NOT EXISTS comments(
      id UUID PRIMARY KEY,
      content TEXT NOT NULL,
      author_id UUID REFERENCES users(id),
      post_id UUID REFERENCES posts(id),
      created_at TIMESTAMP,
      updated_at TIMESTAMP
    )`;

  const groupUserTable = `
    CREATE TABLE IF NOT EXISTS group_user(
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      group_id UUID REFERENCES groups(id)
    )`;

  const eventUserTable = `
  CREATE TABLE IF NOT EXISTS event_user(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id)
    )`;

  const tables = [userTable, groupTable, eventTable, postTable, commentTable, groupUserTable, eventUserTable];

  const createAllTablesQuery = tables.join(";");
  return new Promise((resolve, reject) => {
    pool
      .query(createAllTablesQuery)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
};

// Event handler for when a client is removed from the connection pool.
// This typically happens when the client has been idle in the pool for too long and is automatically closed.
pool.on("remove", () => {
  console.log("client removed");
  process.exit(0);
});

module.exports = {
  createTables,
  pool,
};

module.exports = sequelize;

// script: npm run create
require("make-runnable");
