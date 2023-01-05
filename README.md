# FlowForge Telemetry Ping App

This repo contains the code for the FlowForge Telemetry Ping App. This
is a very simple HTTPS end point that is used to collect usage information
from instances of FlowForge that have opted-in to sharing the information.

The received data is stored in an RDS (Postgres) table.

This service does not store any identifying information that can be used
to identify individual users. The data is augmented with a hash of the sending
IP address so that separate requests can be correlated - but the actual IP
address is not stored.

## Collected data

The collector does some very simple validation of the data posted to it - and
only stores properties it knows about.

The code contains two arrays:

 - `requiredProperties` - a list of property names that must exist for the post
   to be accepted
 - `optionalProperties` - a list of property names that may exist.

The property names are written in dot-notation, for example `env.nodejs`. This means
it expects the post to have a top level property called `env` which is an object
that contains a property called `nodejs`.

The collector will *only* store properties in that list to the database. That
means if new properties are added to the FlowForge code that sends the pings,
they must also be added to the collector for them to be handled. This includes
updating the database table structure to accept the new values.

This may prove to be overly restrictive - but as we don't anticipate a high
level of churn in the metrics we gather, it should be manageable. This approach
also ensures proper consideration and discussion is applied to any metric added
to the data gathering process.


## Updating the live collector code

### Requirements

* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) installed and configured

### Update script

```bash
cd src
npm install
zip -r ../function.zip .
cd ..
aws lambda update-function-code --function-name telemetryPingToRDS --zip-file fileb://function.zip
```

If the update adds any additional properties, the database table structure must
be updated to accepted the new values *before* the code is deployed.

This is currently done be running the appropriate `ALTER TABLE` commands on the
database. The `database-schema.sql` file should also be updated as a record of
the expected schema.

