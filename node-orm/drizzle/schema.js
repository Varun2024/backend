const {pgTable,integer,varchar} = require('drizzle-orm/pg-core');

const userTable =pgTable('users', {
    'id':integer('id').primaryKey(),
    'name':varchar('name', {length:255}).notNull(),
    'email':varchar('email', {length:255}).notNull(),  
});

module.exports = {
    userTable
}