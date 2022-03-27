process.traceDeprecation = true;
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const token = process.env.BOTTOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});



client.login(token);