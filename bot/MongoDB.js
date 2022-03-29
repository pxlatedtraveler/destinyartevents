process.traceDeprecation = true;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const token = process.env.ATLASADMIN;

const uri = `mongodb+srv://admin:${token}@dce.dmkhr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const dbClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
dbClient.connect(err => {
    if (err) console.log(err);
    const collection = dbClient.db('test').collection('devices');
    // perform actions on the collection object
    console.log(collection);
    dbClient.close();
});