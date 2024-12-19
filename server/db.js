require("dotenv").config();

const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
/* TODO - create .env file with database connection
  "postgres://user:password@localhost/acme_talent_agency_db"
*/
const uuid = require("uuid");
const bcrypt = require("bcrypt");
// TODO - create secret - jsonwebtoken library is already installed

const createTables = async () => {
  const SQL = /* sql */ `
    DROP TABLE IF EXISTS user_skills;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS skills;

    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(20) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE skills(
      id UUID PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE
    );

    CREATE TABLE user_skills(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      skill_id UUID REFERENCES skills(id) NOT NULL,
      CONSTRAINT unique_user_id_skill_id UNIQUE (user_id, skill_id)
    );
  `;
  await client.query(SQL);
};

const createUser = async ({ username, password }) => {
  const SQL = /* sql */ `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 5),
  ]);
  return response.rows[0];
};

const createSkill = async ({ name }) => {
  const SQL = /* sql */ `
    INSERT INTO skills(id, name) VALUES ($1, $2) RETURNING * 
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const authenticate = async ({ username, password }) => {
  // TODO - add password in SELECT
  const SQL = /* sql */ `
    SELECT id
    FROM users
    WHERE username = $1
  `;
  const response = await client.query(SQL, [username]);
  // TODO - check for correct password with bcrypt.compare
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  // TODO - create token with jsonwebtoken and sign it with secret

  return { token: response.rows[0].id };
};

const createUserSkill = async ({ user_id, skill_id }) => {
  const SQL = /* sql */ `
    INSERT INTO user_skills(id, user_id, skill_id) VALUES ($1, $2, $3) RETURNING * 
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, skill_id]);
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `SELECT id, username FROM users`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchSkills = async () => {
  const SQL = `SELECT * FROM skills`;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchUserSkills = async (user_id) => {
  const SQL = /* sql */ `
    SELECT *
    FROM user_skills
    WHERE user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const deleteUserSkill = async ({ user_id, id }) => {
  const SQL = /* sql */ `
    DELETE
    FROM user_skills
    WHERE user_id = $1 AND id = $2
  `;
  await client.query(SQL, [user_id, id]);
};

const findUserByToken = async (token) => {
  // TODO - validate the passed token and use the id in the payload to find user

  const SQL = /* sql */ `
    SELECT id, username
    FROM users
    WHERE id = $1
  `;

  // TODO - use id instead of token to find user
  const response = await client.query(SQL, [token]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

module.exports = {
  client,
  createTables,
  createUser,
  createSkill,
  fetchUsers,
  fetchSkills,
  createUserSkill,
  fetchUserSkills,
  deleteUserSkill,
  authenticate,
  findUserByToken,
};
