const { readFile, readdir } = require('node:fs/promises')

const path = require('node:path')
const { Client } = require('pg')
const MIGRATIONS_DIR = path.resolve(path.join(__dirname, '..', '..', 'migrations'))

process.env.PG_DB = process.env.PG_DB || 'pings_test'
process.env.PG_URL = process.env.PG_URL || 'localhost'
process.env.PG_PORT = process.env.PG_PORT || '5432'
process.env.PG_USER = process.env.PG_USER || 'postgres'
process.env.PG_PW = process.env.PG_PW || 'secret'

const PG_OPTS = {
    host: process.env.PG_URL,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PW
}

// Lets be very careful about what we run against
if (/amazonaws.com/.test(process.env.PG_URL)) {
    console.log('It looks like you are running against the live database.')
    console.log('Do not do that. Setup a local PG instance')
    process.exit(1)
}

async function createDatabase () {
    const client = new Client(PG_OPTS)
    await client.connect()
    try {
        await client.query(`DROP DATABASE ${process.env.PG_DB}`)
    } catch (err) {
        // Don't mind if it doesn't exist
    }
    await client.query(`CREATE DATABASE ${process.env.PG_DB}`)
    await client.end()
    await createTable()
}

async function query(queryFunction) {
    const client = new Client({
        ...PG_OPTS,
        database: process.env.PG_DB
    })
    await client.connect()
    try {
        return await queryFunction(client)
    } catch (err) {
        console.log(err)
        throw err
    } finally {
        client.end()
    }
}


async function createTable () {
    let migrationFiles = await readdir(MIGRATIONS_DIR)
    migrationFiles = migrationFiles.filter(name => /^\d\d\d\d\d\d\d\d-.+\.sql$/.test(name))
    migrationFiles.sort()
    
    for (const filename of migrationFiles) {
        await query(async (client) => {
            const schema = await readFile(path.join(MIGRATIONS_DIR, filename), 'utf-8')
            await client.query(schema)
        })
    }
}

async function getPings () {
    return query(async (client) => {
        const result = await client.query('SELECT * from pings')
        return result.rows
    })
}

module.exports = {
    createDatabase,
    query,
    getPings
}