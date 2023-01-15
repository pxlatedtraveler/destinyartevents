const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const logger = require('../../util/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ifelse')
        .setDescription('Uses if-else formatting for testing'),

    async execute(interaction) {
        const rowMain = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('btn')
            .setLabel('Press Me')
            .setStyle(ButtonStyle.Success)
        );

        const rowInput = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('txt')
                    .setLabel('The thing')
                    .setStyle(TextInputStyle.Short)
            );

        const modal = new ModalBuilder()
            .setCustomId('modal')
            .setTitle('Type something!')
            .addComponents(rowInput);

        await interaction.reply({ content: 'Test Button Interaction', ephemeral: true, components: [rowMain] });

        const command = await interaction.channel.awaitMessageComponent({ time: 5000, ComponentType: ComponentType.Button }).catch(err => logger.info('No Press!', err));

        if (command) {
            logger.info('Button pressed!');
            await command.showModal(modal);
            await interaction.editReply({ content: 'Button Pressed!', components: [] });

            // Cleanly chaining commands with the equivalent for modal interaction

            const modalSubmit = await interaction.awaitModalSubmit({ time: 5000 }).catch(err => logger.info('No submit...', err));

            if (modalSubmit) {
                await modalSubmit.reply({ content: 'Got Submit!', ephemeral: true });
            }
            else {
                await interaction.followUp({ content: 'No submit...', ephemeral: true });
            }
        }
        else {
            await interaction.editReply({ content: 'No press!', components: [] });
        }
    }
};