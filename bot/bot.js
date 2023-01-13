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
// --Discord Specific
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, Partials } = require('discord.js');
const token = process.env.BOTTOKEN;
// --Bot Specific
// const Roles = require('./roles.json');
// const GuildEvent = require('./GuildEvent.js');
const Member = require('./Members.js');
// const Utils = require('./Utils');

// --Bot Specific Modules
// const roles = Roles.roles;
// const guildEvent = GuildEvent.GuildEvent;
const member = Member.Member;
// const utils = Utils.utils;

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });
client.commands = new Collection();
client.cooldowns = new Collection();
client.cooldownTime = 10000;

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

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.ShardError, error => {
	console.error('A websocket connection encountered an error:', error);
});

client.on('error', (err) => {
    console.log(err.message);
 });

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

client.login(token);

// --Bot Specific for testing
const fakeDiscordObj = { id: '001', username: 'pxl', discriminator: '#0007', tag: 'pxl#0007' };
const firstMember = new member(fakeDiscordObj);

console.log(firstMember);