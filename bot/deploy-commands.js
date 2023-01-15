process.traceDeprecation = true;
require('dotenv').config();
const logger = require('../util/logger.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');

const clientId = process.env.CLIENTID;
const guildId = process.env.DEVGUILDID;
const token = process.env.BOTTOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        logger.info(`Successfully reloaded ${data.length} applications (/) commands.`);
    }
    catch (error) {
        console.error(error);
    }
})();

// USE Routes.applicationCommands(clientId) in line 24 for put method for GLOBAL COMMANDS.