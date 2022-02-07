const AWS = require('aws-sdk')
const client = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const crypto = require('crypto')
const sha256 = value => crypto.createHash('sha256').update(value).digest().toString('base64')


exports.handler = async (event, context) => {
    try {
        if (event.body) {
            const payload = JSON.parse(event.body)

            if (!payload.instanceId) {
                throw new Error("Invalid request")
            }

            let callingIP = "unknown"
            if (event.requestContext && event.requestContext.http)  {
                callingIP =  sha256(event.requestContext.http.sourceIp)
            }
            const params = {
                TableName:'flowforge-ping-data',
                Item: {
                    instanceId: payload.instanceId || "unknown",
                    createdAt: (new Date()).toISOString(),
                    ip: callingIP,
                    env: payload.env,
                    platform: payload.platform
                }
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

            // instanceId: <instanceId>
            // createdAt: <Date.ISOString>
            // ip: <hash of calling IP>
            // env:
            //    nodejs: `process.version`
            //    flowforge: <version>
            //    os:
            //      type: `os.type()`
            //      release: `os.release()`
            //      arch:  `os.arch()`
            // platform:
            //    ...
            //
        }
    } catch(err) {
        console.error(err)
        return err
    }

    return response
}
