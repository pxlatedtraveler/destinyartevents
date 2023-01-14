const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thencatch')
        .setDescription('Uses then-catch formatting for testing'),

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

        await interaction.channel.awaitMessageComponent({ time: 5000, ComponentType: ComponentType.Button }).catch(async err => { console.log('No Press!', err); })
        .then(async command => {
            if (command) {
                console.log('Button Pressed!');
                await command.showModal(modal);
                await interaction.editReply({ content: 'Button Pressed!', components: [] });

                // Not so bad cleanly chaining commands for modal interaction

                await command.awaitModalSubmit({ time: 5000 }).catch(err => console.log('No submit...', err))
                .then(async m => {
                    if (m) {
                        await m.reply({ content: 'Got Submit!', ephemeral: true });
                    }
                    else {
                        await interaction.followUp({ content: 'No submit...', ephemeral: true });
                    }
                });
            }
            else {
                await interaction.editReply({ content: 'No press!', components: [] });
            }
        });
    }
};