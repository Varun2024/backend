// drizzle orm is different from drizzle kit in terms of configuration. Drizzle kit is used for generating types and migrations, while drizzle orm is used for database operations in the application.
const { defineConfig } = require("drizzle-kit");
require("dotenv/config"); // load environment variables from .env file


// this file tells the postgres that we are using drizzle orm and where to find the schema and where to output the generated types. It also provides the database credentials for connecting to the database.
const config = defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./drizzle/schema.js",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
// run "npm drizzle-kit push" to push the schema to the database. This will create the tables in the database based on the schema defined in the schema.js file. i.e for migrations

// after this , run "npx drizzle-kit generate" to generate the types in the drizzle folder. This will create a file called index.d.ts which contains the types for the database tables defined in the schema.js file.

// drizzle kit gives a UI known as drizzle kit studio which can be used to visualize the database schema and run queries against the database. To start the drizzle kit studio, run "npx drizzle-kit studio" in the terminal. This will open a web browser with the drizzle kit studio interface.

module.exports = config;
