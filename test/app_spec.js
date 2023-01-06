const assert = require('node:assert').strict

const db = require('./lib/db')

const pingHandler = require('../src/app')

async function sendPing (payload, toJSON = true) {
    const event = {
        requestContext: {
            http: {
                sourceIp: '192.168.0.1'
            }
        }
    }
    if (payload) {
        event.body = toJSON ? JSON.stringify(payload) : payload
    }
    const result = await pingHandler.handler(event)
    result.body = JSON.parse(result.body)
    return result
}


describe('Ping Collector', async function () {
    beforeEach(async function () {
        return db.createDatabase()
    })
    it('connects to the db', async function () {
        const pings = await db.getPings()
        assert.equal(pings.length, 0)
    })

    it('rejects a ping missing a body', async function () {
        const result = await sendPing()
        assert.equal(result.statusCode, 400)
        assert.deepEqual(result.body, {"status":"error","error":"Missing request body"})
    })

    it('rejects a ping missing an instanceId', async function () {
        const result = await sendPing({})
        assert.equal(result.statusCode, 400)
        assert.deepEqual(result.body, {"status":"error","error":"Error: Missing required property: instanceId"})
    })

    it('rejects non-json payload', async function () {
        const result = await sendPing('this is not json', false)
        assert.equal(result.statusCode, 400)
        assert.match(result.body.error, /SyntaxError/)
    })

    it('writes ping to table', async function () {
        const result = await sendPing({
            instanceId: 'test-instance'
        })
        assert.equal(result.statusCode, 200)
        assert.deepEqual(result.body, {"status": "success"})
        const pings = await db.getPings()
        assert.equal(pings.length, 1)
        const ping = pings[0]
        assert.equal(ping.instanceId, 'test-instance')
        assert.ok(ping.ip)
        assert.notEqual(ping.ip, '192.168.0.1')
        // Check createdAt is within last 500ms
        assert.ok(Date.now() - ping.createdAt.getTime() < 500)

    })

})