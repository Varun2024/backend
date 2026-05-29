const {pgTable,uuid,varchar,text,index} = require('drizzle-orm/pg-core');
const {authorsTable} = require('./author.model');
const { sql } = require('drizzle-orm');


const booksTable = pgTable("books",{
    id:uuid().primaryKey().defaultRandom(),
    title:varchar({length:100}).notNull(),
    description:text(),
    // foreign key to authors table, in mongodb not possible to enforce foreign key constraints, but we can still reference the author id
    authorId:uuid().references(() => authorsTable.id).notNull(),
},(table)=>({
    searchIndex: index("title_index").using("gin",sql`to_tsvector('english', ${table.title})`)
}))

module.exports = {
    booksTable
}

