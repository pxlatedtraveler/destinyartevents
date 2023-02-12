const { SlashCommandBuilder, ActionRowBuilder, ComponentType, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getMessageComponentById, getMessageFirstComponent } = require('../Utils');
const logger = require('../../util/logger.js');

const cooldownTimer = 5000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case_embeds')
        .setDescription('Working example of sending embeds'),

        async execute(interaction) {
            const btnEphemeral = new ButtonBuilder()
                .setCustomId('ephemeral')
                .setLabel('Ephemeral')
                .setStyle(ButtonStyle.Primary);

            const btnNotEphemeral = new ButtonBuilder()
                .setCustomId('notephemeral')
                .setLabel('Not Ephemeral')
                .setStyle(ButtonStyle.Primary);

            const row1 = new ActionRowBuilder()
                .addComponents(btnEphemeral);

            const row2 = new ActionRowBuilder()
                .addComponents(btnNotEphemeral);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('An Embed')
                .setDescription('Just an Embed');

            const filter = intr => intr.user.id === interaction.user.id;
            await interaction.reply({ content: 'Choose!', components: [row1, row2] });
            const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error(err); });

            if (mainCommand) {
                if (mainCommand.customId === 'ephemeral') {
                    btnEphemeral.setDisabled(true);
                    btnNotEphemeral.setDisabled(true);

                    console.log('DID IT WORK: ', getMessageComponentById(mainCommand, 'notephemeral'));
                    console.log('How about this: ', getMessageFirstComponent(mainCommand));

                    embed.setFields({ name: 'Ephemeral Embed', value: 'Only you can see this. You can dismiss this.' });
                    await mainCommand.reply({ embeds: [embed], components: [], ephemeral: true });
                    await interaction.editReply({ content: 'Chosen!', components: [row1, row2] });
                }
                else if (mainCommand.customId === 'notephemeral') {
                    btnEphemeral.setDisabled(true);
                    btnNotEphemeral.setDisabled(true);
                    embed.setFields({ name: 'Not Ephemeral Embed', value: 'Everyone can see this. No one except mods can delete this.' });
                    await mainCommand.reply({ embeds: [embed], components: [], ephemeral: false });
                    await interaction.editReply({ components: [row1, row2] });
                }
            }
            else {
                logger.info('USER NO SELECT mainCommand');
                await interaction.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", ephemeral: true, components: [] });

            }
        },
};