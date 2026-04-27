const { drizzle } = require('drizzle-orm/node-postgres');


//postgres://username:password@host:port/database
const db = drizzle(process.env.DATABASE_URL); // create a database instance using the connection string from the environment variable. This will allow us to perform database operations using the drizzle ORM. The connection string should be in the format "postgres://username:password@host:port/database". 

// this file is used for database operations in the application. It imports the schema and exports the database instance for use in other parts of the application.
// currently no use
module.exports = db;