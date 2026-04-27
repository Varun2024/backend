require("dotenv/config"); // load environment variables from .env file
const db = require("./db");
const { userTable } = require("./drizzle/schema");


async function getAllUsers() {
  const users = await db.select().from(userTable); // this will return all the users from the user table in the database. It will return an array of objects where each object represents a user. The keys of the object will be the column names of the user table and the values will be the corresponding values for each user.
  console.log(`All users: ${JSON.stringify(users)}`);
  return users;
}

async function createUser({ id, name, email }) {
  await db.insert(userTable).values({ id, name, email }); // insert new user
}

getAllUsers();
