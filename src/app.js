const { Client } = require("pg");

// NOTE: any changes to required/optional props will require the database table
// to be updated first. DO NOT DEPLOY changes to these lists without having
// updated the database otherwise pings will be dropped
const requiredProperties = [
    'instanceId'
]

const optionalProperties = [
    'os.type',
    'os.release',
    'os.arch',
    'env.nodejs',
    'env.flowforge',
    'platform.counts.users',
    'platform.counts.teams',
    'platform.counts.projects',
    'platform.counts.projectsByState.suspended',
    'platform.counts.devices',
    'platform.counts.projectSnapshots',
    'platform.counts.projectTemplates',
    'platform.counts.projectStacks',
    'platform.config.driver',
    'platform.config.broker.enabled',
    'platform.config.fileStore.enabled',
    'platform.config.email.enabled',
    'platform.counts.libraryEntries',
    'platform.counts.sharedLibraryEntries',
    'platform.license.id',
    'platform.license.type'
]

const dbColumns = [
    'ip',
    ...requiredProperties,
    ...optionalProperties
]

const columnList = `"${dbColumns.join('","')}"`
const columnValues = dbColumns.map((v,index) => {
	return '$'+(index+1)
}).join(",")

function getProperty(payload, key) {
    const keyParts = key.split('.')
    let value = payload
    const found = keyParts.every(part => {
        if (value[part] === undefined) {
            return false
        }
        value = value[part]
        return true
    })
    if (!found) {
        return undefined
    } else {
        return value
    }
}

function setProperty(object, key, value) {
    const keyParts = key.split('.')
    let pointer = object
    keyParts.forEach((part, index) => {
        if (index < keyParts.length - 1) {
            if (!pointer[part]) {
                pointer[part] = {}
            }
            pointer = pointer[part]
        } else {
            pointer[part] = value
        }
    })
}

exports.handler = async (event, context) => {
    const response = {
        'statusCode': 200
    }
    try {
        if (event.body) {
            const payload = JSON.parse(event.body)
            const item =  {}

            requiredProperties.forEach(key => {
                const value = getProperty(payload, key)
                if (value !== undefined) {
                    setProperty(item, key, value)
                } else {
                    throw new Error(`Missing required property: ${key}`)
                }
            })

            item.ip = (event.requestContext && event.requestContext.http)
                ? event.requestContext.http.sourceIp
                : 'unknown'

            optionalProperties.forEach(key => {
                const value = getProperty(payload, key)
                if (value !== undefined) {
                    setProperty(item, key, value)
                }
            })

            const dbConfig = {
                host: process.env.PG_URL,
                port: process.env.PG_PORT || '5432',
                user: process.env.PG_USER,
                password: process.env.PG_PW,
                database: process.env.PG_DB,
            }

            const client = new Client(dbConfig);

            try {
                await client.connect();

                const values = dbColumns.map(v => {
                    const value = getProperty(item, v)
                    if (value !== undefined) {
                        return value
                    }
                    return null
                })

                const query = {
                    text: `INSERT INTO pings(${columnList}) VALUES(${columnValues})`,
                    values
                }
                   
                // callback
                await client.query(query)
                response.body = JSON.stringify({ status: 'success' })
                await client.end();
            } catch (err) {
                await client.end();
                response.statusCode = 400
                response.body = JSON.stringify({ status: 'error', error: err.toString() })
            }
        } else {
            response.statusCode = 400
            response.body = JSON.stringify({ status: 'error', error: 'Missing request body' })
        }
    } catch(err) {
        response.statusCode = 400
        response.body = JSON.stringify({ status: 'error', error: err.toString() })
    }

    return response
}
