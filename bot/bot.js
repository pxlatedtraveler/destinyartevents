/**
 * DiscordJS v14
 * Bot built to handle internal functions for Destiny Art Events server
 * Refs:
 * To handle specific errors in commands: https://discordjs.guide/popular-topics/errors.html#code (require RESTJSONErrorCodes from 'discord.js')
 * To handle websocket and network errors: https://discordjs.guide/popular-topics/errors.html#websocket-and-network-errors
 * Do I need to require DiscordAPIError ?
 */

process.traceDeprecation = true;
require('dotenv').config();
const mysql = require('mysql2');
const logger = require('../util/logger.js');
// --Discord Specific
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, Partials } = require('discord.js');
const token = process.env.BOTTOKEN;
// --Bot Specific
const Member = require('./Members.js');
// const Utils = require('./Utils');
const member = Member.Member;
// const utils = Utils.utils;

const mysql_host = process.env.MYSQL_HOST;
const mysql_user = process.env.MYSQL_USER;
const mysql_auth = process.env.MYSQL_AUTH;
const mysql_db = process.env.MYSQL_DATABASE;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers], partials: [Partials.Channel] });
client.commands = new Collection();
client.cooldowns = new Collection();
client._tempBirthdays = new Collection();
client._tempEvents = new Collection();

(async () => {
    client.db = mysql.createPool({
    connectionLimit: 10,
	host: mysql_host,
	user: mysql_user,
	password: mysql_auth,
	database: mysql_db,
	queueLimit: 0,
	charset: 'utf8mb4_general_ci',
    });
    logger.info('CONNECTED');
})();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.once(Events.ClientReady, async c => {
    logger.info(`Ready! Logged in as ${c.user.tag}`);
    client.db.getConnection(function(poolerr, connection) {
        logger.info('CONNECTING');
        if (poolerr) console.log(poolerr);
        connection.query(`SHOW TABLES`, function(err, results) {
            if (err) console.log(err);
            console.log('Database Tables: ', results);
            connection.release();
        });
    });
});

client.on(Events.ShardError, error => {
	logger.error('A websocket connection encountered an error:', error);
});

client.on('error', (err) => {
    logger.info(err.message);
 });

process.on('unhandledRejection', error => {
	logger.error('Unhandled promise rejection:', error);
});

client.login(token);

// --Bot Specific for testing
const fakeDiscordObj = { id: '001', username: 'pxl', discriminator: '#0007', tag: 'pxl#0007' };
const firstMember = new member(fakeDiscordObj);

logger.info(firstMember);

/* const blockedUsers = ['id1', 'id2'];
client.on(Events.InteractionCreate, interaction => {
	if (blockedUsers.includes(interaction.user.id)) return;
}); */