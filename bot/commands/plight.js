const { SlashCommandBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plight')
        .setDescription('Replies with OK!'),

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

        const command = await interaction.channel.awaitMessageComponent({ time: 8000, ComponentType: ComponentType.Button }).catch(err => console.log(err));

        if (command) {
            console.log('Button pressed!');
            await command.showModal(modal);
            await interaction.editReply({ content: 'Button Pressed!', components: [] });
        }
        else {
            console.log('No Press!');
            await interaction.editReply({ content: 'No press!', components: [] });
        }

        // Cleanly chaining commands with the equivalent for modal interaction


        const modalSubmit = await interaction.awaitModalSubmit({ time: 5000 }).catch(error => { console.log(error); });

        if (modalSubmit) {
            await modalSubmit.reply('Got Submit!');
        }
        else {
            console.log('No submit!');
            await interaction.followUp({ content: 'No submit...' }).catch(err => console.log(err));
        }
    },
};
