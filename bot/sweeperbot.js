process.traceDeprecation = true;
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const token = process.env.BOTTOKEN;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	}
    else if (commandName === 'server') {
		await interaction.reply('Server info.');
	}
    else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});

client.login(token);