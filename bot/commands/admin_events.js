const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { Months, priviledgeCheck, getTimeLeft, refreshTimeout, setCooldown, validateDate } = require('../Utils');
const logger = require('../../util/logger.js');

// const cooldownTimer = 15000;
const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 10000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-events')
        .setDescription('Add, edit, or remove events'),

    async execute(interaction) {

        const priviledge = await priviledgeCheck(interaction, permittedRoles);

        if (priviledge.has(interaction.user.id)) {

            if (interaction.client.cooldowns.has(interaction.user.id)) {
                const userTimeout = interaction.client.cooldowns.get(interaction.user.id);
                await interaction.reply({ content: "You've used this command recently. Try again after `" + getTimeLeft(userTimeout.timeout, userTimeout.startTime) + " seconds`.", ephemeral: true });

            }
            else {
                const timeout = setCooldown(interaction, cooldownTimer);

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

                const rowMain = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btncreate')
                            .setLabel('Create')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('btnedit')
                            .setLabel('Edit')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('btndelete')
                            .setLabel('Delete')
                            .setStyle(ButtonStyle.Danger)
                    );

                const filter = intr => intr.user.id === interaction.user.id;

                await interaction.reply({ content: '`' + permittedRoles.toString() + '` permitted.\n`Create`, `Edit` or `Remove` an event.', ephemeral: true, components: [rowMain] });

                const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('mainCommand', err) });

                if (mainCommand) {

                    refreshTimeout(interaction, timeout);
                    logger.info(interaction.user.usename + 'COLLECTED mainCommand ' + mainCommand.customId);

/**
 * btncreate - User chooses to Create an event
 * TODO: Actually use database. EVERYTHING too. Structure. Using correct message components to edit or update!
 */

                    if (mainCommand.customId === 'btncreate') {

                        await mainCommand.reply({ content: 'Before you start, make sure an event-specific **role** has been created first. You\'ll also need a `start date` and `end date` for both **pre-registrations**, and **public registrations**; `month`, `day`, `hour`, `minute`, `GMT-Offset`.\nDo you wish to continue?', ephemeral: true, components: [rowVerify] });

                        const btnConfirmCreate = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('command', err); });

                        if (btnConfirmCreate) {

                            refreshTimeout(interaction, timeout);
                            logger.info(interaction.user.usename + 'COLLECTED statCommand ' + btnConfirmCreate.customId);
        
                            if (btnConfirmCreate.customId === 'btnconfirm') {
                                // START EVENT CREATION
                                btnConfirmCreate.update({content: 'Begin Event creation.', components: [] });
                            }
                            else if (btnConfirmCreate.customId === 'btnreject') {
                                // BOOT USER
                                btnConfirmCreate.update({content: `Try again after the ${cooldownTimer / 1000} second cooldown.`, components: [] });
                            }
                        }
                        else {
                            logger.info(`${interaction.user.username} NO PRESS btnConfirmCreate!`);
                            await btnConfirmCreate.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                        }
                    }
                }
            }

        }
        else {
            await interaction.reply('NOT ADMIN');
        }
    }
};