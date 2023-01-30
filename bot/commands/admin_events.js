const { SlashCommandBuilder } = require('discord.js');
const { priviledgeCheck } = require('../Utils');
// const logger = require('../../util/logger.js');

// const cooldownTimer = 15000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-events')
        .setDescription('Add, edit, or remove events'),

    async execute(interaction) {

        const priviledge = await priviledgeCheck(interaction, ['Admin', 'Mod']);

        if (priviledge.has(interaction.user.id)) {
            await interaction.reply('You are an Admin or Mod');
        }
        else {
            await interaction.reply('NOT ADMIN');
        }
    }
};