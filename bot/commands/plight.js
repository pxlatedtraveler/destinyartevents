const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plight')
        .setDescription('Replies with OK!'),
    async execute(interaction) {
        await interaction.reply('OK!');
    },
};