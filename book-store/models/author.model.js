const {pgTable,uuid,varchar,text} = require('drizzle-orm/pg-core');

const authorsTable = pgTable("authors",{
    id:uuid().primaryKey().defaultRandom(),
    firstName:varchar({length:100}).notNull(),
    lastName:varchar({length:100}),
    email:varchar({length:255}).notNull().unique(),
})

module.exports = {
    authorsTable
}