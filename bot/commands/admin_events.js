const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, inlineCode } = require('discord.js');
const { priviledgeCheck, arrayToString, getTimeLeft, refreshTimeout, setCooldown } = require('../Utils');
const logger = require('../../util/logger.js');

const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 10000;

class ArtEvent {
    constructor(id, name, type) {
        this._id = id;
        this._name = name;
        this.role;
        this.type = type;
        this._pre_startDate;
        this._pre_endDate;
        this._pub_startDate;
        this._pub_endDate;
    }

    get id() { return this._id; }
    set id(val) { if (typeof val === 'string') this._id = val; }

    get name() { return this.name; }
    set name(val) { if (typeof val === 'string') this._name = val; }

    get pre_startDate() { return this._pre_startDate; }
    set pre_startDate(val) { if (val) this._pre_startDate = val; }

    get pre_endDate() { return this._pre_endDate; }
    set pre_endDate(val) { if (val) this._pre_endDate = val; }

    get pub_startDate() { return this._pub_startDate; }
    set pub_startDate(val) { if (val) this._pub_startDate = val; }

    get pub_endDate() { return this._pub_endDate; }
    set pub_endDate(val) { if (val) this._pub_endDate = val; }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-events')
        .setDescription('Add, edit, or remove events'),

    async execute(interaction) {

        if (interaction.client.cooldowns.has(interaction.user.id)) {
            const userTimeout = interaction.client.cooldowns.get(interaction.user.id);
            await interaction.reply({ content: "You've used this command recently. Try again after `" + getTimeLeft(userTimeout.timeout, userTimeout.startTime) + " seconds`.", ephemeral: true });
        }
        else {
            const priviledge = await priviledgeCheck(interaction, permittedRoles);

            if (priviledge.has(interaction.user.id)) {
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

                    const rowEdit = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('selectedit')
                                .setPlaceholder('Select all you want to change')
                                // .setMinValues(5)
                                .setMaxValues(5)
                                .addOptions([
                                    { label: 'Id', description: 'Change event Id', value: 'id' },
                                    { label: 'Name', description: 'Change event\'s vanity name', value: 'name' },
                                    { label: 'Role', description: 'Change event\'s role', value: 'role' },
                                    { label: 'Pre-registration dates', description: 'Change Pre-Registration date range', value: 'preregistration' },
                                    { label: 'Public registration dates', description: 'Change Public Registration date range', value: 'publicregistration' },
                                ])
                        );

                    const modal = new ModalBuilder()
                        .setCustomId('modalnameinput')
                        .setTitle('Type in name of event')
                            .addComponents(
                                new ActionRowBuilder()
                                    .addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('textinputname')
                                            .setLabel('Event Name (ie: dsse2022)')
                                            .setStyle(TextInputStyle.Short)
                                            .setMinLength(1)
                                            .setMaxLength(20)
                                            .setRequired(true)
                                    )
                            );

                const testEvent = new ArtEvent('dsse2022', 'Destiny Secret Santa Event 2022');
                interaction.client._tempEvents.set(testEvent.id, testEvent);

                const filter = intr => intr.user.id === interaction.user.id;

                await interaction.reply({ content: arrayToString(permittedRoles) + ' permitted.\n**Create**, **Edit** or **Delete** an event.', ephemeral: true, components: [rowMain] });

                const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('mainCommand', err); });

                if (mainCommand) {

                    refreshTimeout(interaction, timeout);
                    logger.info(interaction.user.username + 'COLLECTED mainCommand ' + mainCommand.customId);

/**
 * btncreate - User chooses to Create an event
 * TODO: Actually use database. EVERYTHING too.
 */

                    if (mainCommand.customId === 'btncreate') {

                        await mainCommand.update({ content: 'Before you start, make sure an event-specific **role** has been created first. You\'ll also need a `start date` and `end date` for both **pre-registrations**, and **public registrations**; `month`, `day`, `hour`, `minute`, `GMT-Offset`.\nDo you wish to continue?', ephemeral: true, components: [rowVerify] });

                        const btnConfirmCreate = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('command', err); });

                        if (btnConfirmCreate) {

                            refreshTimeout(interaction, timeout);
                            logger.info(interaction.user.username + 'COLLECTED btnConfirmCreate ' + btnConfirmCreate.customId);

                            if (btnConfirmCreate.customId === 'btnconfirm') {
                                // START EVENT CREATION
                                btnConfirmCreate.update({ content: 'Begin Event creation.', components: [] });
                            }
                            else if (btnConfirmCreate.customId === 'btnreject') {
                                // BOOT USER
                                btnConfirmCreate.update({ content: 'You can dismiss this message.', components: [] });
                            }
                        }
                        else {
                            logger.info(`${interaction.user.username} NO PRESS btnConfirmCreate!`);
                            await mainCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                        }
                    }

/**
 * btnedit - User chooses to Edit an event
 * TODO: Actually use database. EVERYTHING too.
 */

                    else if (mainCommand.customId === 'btnedit') {
                        const pastEvents = ['dotl2022', 'dsse2022', 'crimsondays2023'];
                        await mainCommand.showModal(modal);
                        await mainCommand.editReply({ content: 'Type in the name of the event you want to edit. The most recent events include: ' + arrayToString(pastEvents), components: [] });

                        const modalSubmitEdit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('modalSubmitEdit', err); });

                        if (modalSubmitEdit) {
                            refreshTimeout(interaction, timeout);
                            logger.info(interaction.user.username + 'COLLECTED modalSubmitEdit');
                            const eventName = modalSubmitEdit.fields.getTextInputValue('textinputname');
                            // QUERY DB FOR EVENT WITH ID FROM INPUT
                            const artEvent = interaction.client._tempEvents.get(eventName);
                            if (artEvent) {
                                await modalSubmitEdit.update({ content: 'What do you want to edit? -TODO', components: [rowEdit] });

                                const stringSelectEdit = await interaction.channel.awaitMessageComponent({ time: 30000, filter, ComponentType: ComponentType.StringSelect });

                                if (stringSelectEdit) {
                                    refreshTimeout(interaction, timeout);
                                    logger.info(interaction.user.username + 'COLLECTED stringSelectEdit');
                                    const changeValues = stringSelectEdit.values;

                                    if (changeValues) {
                                        await stringSelectEdit.update({ content: `You selected ${inlineCode(changeValues)}`, components: [] });
                                    }
                                    else {
                                        logger.info(`${interaction.user.username} NO SELECT stringSelectEdit!`);
                                        await mainCommand.editReply({ content: 'Interaction expired. Try again after `' + cooldownTimer / 1000 + ' seconds`.', components: [] });
                                    }

                                }
                            }
                            else {
                                await modalSubmitEdit.update({ content: 'Response doesn\'t match an existing event name.' });
                            }
                        }
                        else {
                            logger.info(`${interaction.user.username} NO SUBMIT modalSubmitEdit!`);
                            await mainCommand.editReply({ content: 'Interaction expired. Try again after `' + cooldownTimer / 1000 + ' seconds`.', components: [] });
                        }
                    }

/**
 * btndelete - User chooses to Delete an event
 * TODO: Actually use database. EVERYTHING too.
 */

                    else if (mainCommand.customId === 'btndelete') {
                        const pastEvents = ['dotl2022', 'dsse2022', 'crimsondays2023'];
                        const adminPriviledge = await priviledgeCheck(interaction, ['Admin']);
                        if (adminPriviledge.has(interaction.user.id)) {
                            await mainCommand.showModal(modal);
                            await mainCommand.editReply({ content: 'Type in the name of the event you want to edit. The most recent events include: ' + arrayToString(pastEvents), components: [] });

                            const modalSubmitDelete = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('modalSubmitDelete', err); });

                            if (modalSubmitDelete) {
                                refreshTimeout(interaction, timeout);
                                logger.info(interaction.user.username + 'COLLECTED modalSubmitDelete');
                                const eventName = modalSubmitDelete.fields.getTextInputValue('textinputname');
                                const artEvent = interaction.client._tempEvents.get(eventName);
                                if (artEvent) {
                                    await modalSubmitDelete.update({ content: `Are you sure you want to delete ${artEvent.name}?`, components: [rowVerify] });

                                    const btnConfirmDelete = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button });

                                    if (btnConfirmDelete) {
                                        refreshTimeout(interaction, timeout);
                                        logger.info(`${interaction.user.username} COLLECTED btnConfirmDelete ` + btnConfirmDelete.customId);

                                        if (btnConfirmDelete.customId === 'btnconfirm') {
                                            // API DB QUERY DELETE EVENT ENTRY
                                            interaction.client._tempEvents.delete(artEvent.id);

                                            await btnConfirmDelete.update({ content: '`' + artEvent.name + '`' + ' successfully removed. You may dismiss this message.', components: [] });
                                            await btnConfirmDelete.followUp({ content: interaction.user.toString() + ' deleted event ' + '`' + artEvent.name + '`', ephemeral: false });
                                        }
                                        else if (btnConfirmDelete.customId === 'btnreject') {
                                            btnConfirmDelete.update({ content: 'You can dismiss this message.', components: [] });
                                        }
                                    }
                                    else {
                                        logger.info(`${interaction.user.username} NO PRESS btnConfirmDelete!`);
                                        await modalSubmitDelete.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });

                                    }
                                }
                                else {
                                    await modalSubmitDelete.update({ content: 'Response doesn\'t match an existing event name.' });
                                }
                            }
                            else {
                                logger.info(`${interaction.user.username} NO SUBMIT modalSubmitDelete!`);
                                await mainCommand.editReply({ content: 'Interaction' });
                            }
                        }
                        else {
                            await mainCommand.update({ content: 'Admin role is needed to perform this task.' });
                        }
                    }
                }
                else {
                    logger.info(`${interaction.user.username} NO PRESS mainCommand`);
                    await interaction.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                }
            }
            else {
                await interaction.reply('NOT ADMIN OR MOD');
            }
        // cooldown
        }
    // execute
    }
};

// TODO - For creating or editing date, have user type it in such as 'August 10, 2023'
// And therefore, we'll only need 2 input boxes for start and end date, so we can validate range.
// Basically, 1 - Date for start (as formatted above), 2 - Time (ask for military), 3 - Date for end, 4 - Time, 5 - Timezone
// TODO - FIGURE OUT HOW TO HANDLE DST vs STANDARD TIME
// TODO - Timing issues with select menu. If you select none, cooldown resets sooner than timer period for command.
// When the above happens, if user uses command again, the cooldown wont be there to stop them. Bot errors out.
// Research that. See if there's a way to kill the connection. Like, see if you can find last interaction by user
// and compare the ID. If it's the same slash command, either don't allow them to continue OR somehow kill it?
// For Science: console log old interaction ID, and console log new interaction ID. See how the two objects compare in general.