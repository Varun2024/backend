const {pgTable,uuid,varchar,text} = require('drizzle-orm/pg-core');
const {authorTable} = require('./author.model');


const booksTable = pgTable("books",{
    id:uuid().primaryKey().defaultRandom(),
    title:varchar({length:100}).notNull(),
    description:text(),
    // foreign key to authors table, in mongodb not possible to enforce foreign key constraints, but we can still reference the author id
    authorId:uuid().references(() => authorTable.id).notNull(),
})

module.exports = {
    booksTable
}

