const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const logger = require('../../util/logger.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plight')
        .setDescription('Used for testing snippets of code and techniques for when I find myself in trouble'),

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

        const command = await interaction.channel.awaitMessageComponent({ time: 8000, ComponentType: ComponentType.Button }).catch(err => logger.info(err));

        if (command) {
            logger.info('Button pressed!');
            await command.showModal(modal);
            await interaction.editReply({ content: 'Button Pressed!', components: [] });
        }
        else {
            logger.info('No Press!');
            await interaction.editReply({ content: 'No press!', components: [] });
        }

        // Cleanly chaining commands with the equivalent for modal interaction


        const modalSubmit = await interaction.awaitModalSubmit({ time: 5000 }).catch(error => { logger.info(error); });

        if (modalSubmit) {
            await modalSubmit.reply('Got Submit!');
        }
        else {
            logger.info('No submit!');
            await interaction.followUp({ content: 'No submit...' }).catch(err => console.log(err));
        }
    },
};
