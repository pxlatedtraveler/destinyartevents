const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Add or Manage your birthday.'),
    async execute(interaction) {
        await interaction.reply('OK!');
    },
};