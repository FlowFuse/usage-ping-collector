const AWS = require('aws-sdk')
const client = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const crypto = require('crypto')
const sha256 = value => crypto.createHash('sha256').update(value).digest().toString('base64')

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
    'platform.counts.devices',
    'platform.counts.projectSnapshots',
    'platform.counts.projectTemplates',
    'platform.counts.projectStacks',
    'platform.config.driver'
]

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

function padNum(v) {
    return ((v < 10)?'0':'')+v
}

function getMondayOfWeek(date) {
    const deltaDays = (date.getDay()+6)%7
    const monday = new Date(date.getTime() - (deltaDays*1000*60*60*24))
    return `${monday.getFullYear()}-${padNum(monday.getMonth()+1)}-${padNum(monday.getDate())}`
}

exports.handler = async (event, context) => {
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
            const createdAt = new Date()
            item.createdAt = createdAt.toISOString()
            item.weekStartDate = getMondayOfWeek(createdAt)
            
            item.ip = (event.requestContext && event.requestContext.http)
                ? sha256(event.requestContext.http.sourceIp)
                : 'unknown'

            optionalProperties.forEach(key => {
                const value = getProperty(payload, key)
                if (value !== undefined) {
                    setProperty(item, key, value)
                }
            })

            const params = {
                TableName: 'flowforge-ping-data',
                Item: item
            }

            var msg;
            try{
                await client.put(params).promise();
                msg = 'okay';
            } catch(err){
                msg = err;
            }
            var response = {
                'statusCode': 200,
                'body': JSON.stringify({
                    status: msg
                })
            }
        }
    } catch(err) {
        console.error(err)
        return err
    }

    return response
}
