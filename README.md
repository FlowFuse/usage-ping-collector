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


## Database connection security

The collector connects to a database over TLS and verifies the server certificate
against Amazon's RDS root CA chain, including a hostname check.

The CA chain is **not** in Node's default trust store, so it is vendored into
this repo as `src/rds-ca-bundle.pem` - AWS's
[global-bundle.pem](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem),
which covers every commercial AWS Region. It lives in `src/` so the existing 
deploy step picks it up with no extra steps.

If the bundle is missing or corrupt the function fails to start rather than
falling back to an unverified connection. There is deliberately no code path
that silently downgrades to plaintext.

Two requirements follow from the hostname check:

 - `PG_URL` must be the **real RDS instance endpoint**. The server certificate's
   Common Name is that endpoint, so a CNAME or vanity DNS name will fail to
   connect. If `PG_URL` is a bare IP address, the chain is still verified but the
   hostname cannot be, which is weaker - use the endpoint.
 - The instance's CA must be one of `rds-ca-rsa2048-g1`, `rds-ca-rsa4096-g1` or
   `rds-ca-ecc384-g1` (all three are in the bundle). Check with:

```bash
aws rds describe-db-instances \
    --query 'DBInstances[].[DBInstanceIdentifier,CACertificateIdentifier,Endpoint.Address]'
```

### Refreshing the CA bundle

AWS occasionally adds new root CAs. To refresh:

```bash
curl -o src/rds-ca-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
npm run test
```

Only root CAs belong in this file. Do not add intermediate CAs as it breaks
RDS automatic server-certificate rotation.

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

## Testing the collector

The tests in this repo can be used to verify the behaviour of the collector against
a *local* Postgres database.

### Running postgres locally

The following will run postgress locally using Docker, with the default configuration
used by the tests.

You can use a different port/username/password/db, but will need to set some
environment variables to tell the tests where to find postgres.

```
docker pull postgres
docker run --name pingCollectorPostgres \
    -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=secret \
    -e POSTGRES_DB=pings_test \
    -d \
    postgres
```

To later stop the container

```
docker stop pingCollectorPostgres
```

### Running the tests

The tests expect the database to be running on `localhost:5432` with a username/password
of `postgres`/`secret` and to use a database called `pings_test`.

The following env vars can be set to change any of those properties:

 - `PG_URL`
 - `PG_PORT`
 - `PG_DB`
 - `PG_USER`
 - `PG_PW`

The local Postgres above serves no TLS, so the tests set `PGSSLMODE=disable` to
opt out of certificate verification (see `test/lib/db.js`). That is a
test-only escape hatch - never set it on the deployed function.

Finally, to run the tests:

```
npm run test
```