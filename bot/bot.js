process.traceDeprecation = true;
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const token = process.env.BOTTOKEN;
const Roles = require('./roles.json');
const GuildEvent = require('./GuildEvent.js');
const Utils = require('./Utils');

const roles = Roles.roles;
const guildEvent = GuildEvent.GuildEvent;
const utils = Utils.utils;

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName } = interaction;

	if (commandName === 'ping') {
        console.log(roles.Admin.name);
        if (await utils.checkRolePriviledge(interaction, roles.Admin.id)) {
            await interaction.reply(`You have ${roles.Admin.name} priviledges!`);
        }
        else {
            await interaction.reply(`You DO NOT have ${roles.Admin.name} priviledges!`);
        }
	}
    else if (commandName === 'server') {
		await interaction.reply(`Server name: ${interaction.guild.name}\nTotal members: ${interaction.guild.memberCount}`);
	}
    else if (commandName === 'user') {
        console.log(interaction.guild.roles.guild.roles);
		await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
	}
});

client.login(token);

const events = [];
const firstEvent = new guildEvent(events, { name: 'First Event Yo', startDate: { day: 27, month: 4 } });

console.log(firstEvent);