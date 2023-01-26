/**
 * Requires 27017 open via security group
 * Simple code, logs name of current dbs
 */

process.traceDeprecation = true;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const token = process.env.ATLASADMIN;

const uri = `mongodb+srv://admin:${token}@destinyartevents.zgz8ewh.mongodb.net/dce?retryWrites=true&w=majority?directConnection=true`;

main();

async function main() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        await listDatabases(client);
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
}

async function listDatabases(client) {
    const databaseList = await client.db().admin().listDatabases();

    databaseList.databases.forEach(db => console.log(db.name));
}