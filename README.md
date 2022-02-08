# FlowForge Telemetry Ping App

This repo contains the code for the FlowForge Telemetry Ping App. This
is a very simple HTTPS end point that is used to collect usage information
from instances of FlowForge that have opted-in to sharing the information.

The received data is stored in a DynamoDB table.

This service does not store any identifying information that can be used
to identify individual users. The data is augmented with a hash of the sending IP address so that separate requests can be correlated - but the
actual IP address is not stored.

## Collected data

```
instanceId: <instanceId>
createdAt: <Date.ISOString>
ip: <hash of calling IP>
env:
    nodejs: `process.version`
    flowforge: <version>
    os:
        type: `os.type()`
        release: `os.release()`
        arch:  `os.arch()`
    platform:
        ...
```

## Requirements

* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) installed and configured
* [AWS Serverless Application Model](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) (AWS SAM) installed
* Manually configured Custom Domain + Certificates

### Deploy

To deploy the template, run the following in the root director of the repo:

```
sam deploy --guided
```

Once deployed, manually create an API Mapping for your custom domain via the [AWS Console](https://eu-west-1.console.aws.amazon.com/apigateway/main/publish/domain-names):
 - API Gateway -> Custom domain names -> API mappings

### Danger Zone

To delete the stack, **which includes the database table, so all data will be lost**:

1. Remove the API Mapping via the AWS Console
2. `aws cloudformation delete-stack --stack-name ff-ping-app`

You can use the following to montior the delete progress

```
aws cloudformation list-stacks --query "StackSummaries[?contains(StackName,'ff-ping-app')].StackStatus"
```
