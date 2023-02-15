const { SlashCommandBuilder, ActionRowBuilder, ComponentType, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const { arrayToString } = require('../Utils');
const logger = require('../../util/logger.js');

// const cooldownTimer = 5000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case_multimodals')
        .setDescription('Working example of multiple editable modals'),

            async execute(interaction) {
                const rowVerify = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btnconfirm')
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('btnreject')
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger)
                    );

                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('q1')
                            .setLabel('q 1')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(50)
                            .setRequired(true)
                    );

                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('q2')
                            .setLabel('q 2')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(50)
                            .setRequired(true)
                    );

                const row3 = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('q3')
                            .setLabel('q3')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(50)
                            .setRequired(true)
                    );

                const modal = new ModalBuilder()
                    .setCustomId('modal1')
                    .setTitle('Page 1')
                    .addComponents(row1, row2, row3);

                const filter = intr => intr.user.id === interaction.user.id;
                await interaction.reply({ content: 'Choose!', components: [rowVerify] });
                const buttonReply = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error(err); });

                if (buttonReply) {
                    if (buttonReply.customId === 'btnconfirm') {

                        await buttonReply.showModal(modal);

                        const modalReply = await buttonReply.awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('modalReply', err); });

                        if (modalReply) {

                            const answers = modalReply.fields.fields.map(e => e.value);
                            console.log(answers);
                            await modalReply.update({ content: 'Submitted!', components: [] });
                        }
                        else {
                            await buttonReply.editReply({ content: 'No modal submitted on time.', ephemeral: true, components: [] });
                        }

                    }
                    else if (buttonReply.customId === 'btnreject') {
                        buttonReply.update({ content: 'Rejected. Dissmiss message', components: [] });
                    }
                }
                else {
                    await interaction.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });

                }
            },
};
