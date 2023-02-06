const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, inlineCode } = require('discord.js');
const { priviledgeCheck, arrayToString, getTimeLeft, isDaylightSavings, refreshTimeout, setCooldown } = require('../Utils');
const logger = require('../../util/logger.js');

const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 10000;

const EventType = new Collection()
    .set('EXCHANGE', { type: 'exchange', value: 0 })
    .set('OPEN', { type: 'open', value: 1 })
    .set('LIMITED', { type: 'limited', value: 2 });

class ArtEvent {
    constructor(id, name, role, type) {
        this.type = type;
        this._id = id;
        this._name = name;
        this._role = role;
        this._dueDate;
        this._discord_startDate;
        this._discord_endDate;
        this._public_startDate;
        this._public_endDate;
    }

    get type() { return this._type; }
    set type(val) { EventType.has(val) ? this._type = val : logger.error('ARTEVENT: type SET val not EventType'); }

    get id() { return this._id; }
    set id(val) { typeof val === 'string' ? this._id = val : logger.error('ARTEVENT: id SET val not String'); }

    get name() { return this.name; }
    set name(val) { typeof val === 'string' ? this._name = val : logger.error('ARTEVENT: name SET val not String'); }

    // getset role
    // getset dueDate

    get registrationtDate() { return this._discord_startDate; }
    set registrationtDate(val) {
        if (val instanceof Date) {
            const day = 8.64e+7;
            const hour = isDaylightSavings(val) ? 10 : 9;
            this._discord_startDate = val;
            this._discord_startDate.setHours(hour, 0, 0, 0);
            this._discord_endDate = new Date(this._discord_startDate.getTime() + (day * 5));
            this._public_startDate = new Date(this._discord_endDate.getTime());
            this._public_endDate = new Date(this._public_endDate.getTime() + (day * 2));
            this._discord_endDate.setHours(hour - 1, 59, 59);
            this._public_endDate.setHours(hour - 1, 59, 59);
        }
    }
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

                const modalId = new ModalBuilder()
                    .setCustomId('modalnameinput')
                    .setTitle('Type in name of event')
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('textinputname')
                                        .setLabel('Event Id (ie: dsse2022)')
                                        .setStyle(TextInputStyle.Short)
                                        .setMinLength(1)
                                        .setMaxLength(20)
                                        .setRequired(true)
                                )
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

                    const rowEditSelect = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('selectedit')
                                .setPlaceholder('Select all you want to change')
                                // .setMinValues(5)
                                .setMaxValues(6)
                                .addOptions([
                                    { label: 'Id', description: 'Change event Id', value: 'id' },
                                    { label: 'Name', description: 'Change event\'s vanity name', value: 'name' },
                                    { label: 'Role', description: 'Change event\'s role', value: 'role' },
                                    { label: 'Due date', description: 'Change event\'s due date', value: 'date' },
                                    { label: 'Discord signup dates', description: 'Change Discord signup date range', value: 'discordsignup' },
                                    { label: 'Public signup dates', description: 'Change Public signup date range', value: 'publicsignup' },
                                ])
                        );

                    // Event Edit and Creation components
                    // Name types

                    const modalNames = new ModalBuilder()
                        .setCustomId('modaleditnames')
                        .setTitle('Set new values');

                    const rowEventId = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editid')
                                .setLabel('Input new event id (ie: dsse2022)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(20).setRequired(true));

                    const rowEventName = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editname')
                                .setLabel('Input new event name (ie: Secret Santa)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(35).setRequired(true));

                    // Date types

                    const modalDates = ModalBuilder()
                        .setCustomId('modaleditdates')
                        .setTitle('Set new values');

                    const rowDueDateMonth = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editduedatemonth')
                                .setLabel('Input new event due month (numerical month)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    const rowDueDateDay = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editduedateday')
                                .setLabel('Input new event due day')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    // Discord Registration Date

                    const rowPreRegStartMonth = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editpreregstartmonth')
                                .setLabel('Input new start month (numerical month)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    const rowPreRegStartDay = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editpreregstartday')
                                .setLabel('Input new start day')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    // Public Registration Date

                    const rowPubRegStartMonth = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editpubregstartmonth')
                                .setLabel('Input new start month')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    const rowPubRegStartDay = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('editpubregstartday')
                                .setLabel('Input new start day')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

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

                                // First should be "Type" from SelectMenu with 3 Type options.
                                // Then id and name which are both in a modal
                                // Then pick a role (previously created) from a roleSelect SelectMenu TODO: getter setter that checks instance of role (if it is a class)
                                // Then insert a Due Date... TODO: getter setter that also checks if instance of Date
                                // For later: date is set by data from user input. There will be 4 but all are handled in event class setter.
                                // If Date checks out with the Util method, then create date object as below.
                                const date = new Date();
                                // ArtEvent instance.registrationDate = date;
                                // if (ArtEvent.registrationDate) returns true, continue to next question...
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
                        await mainCommand.showModal(modalId);
                        await mainCommand.editReply({ content: 'Type in the name of the event you want to edit. The most recent events include: ' + arrayToString(pastEvents), components: [] });

                        const modalSubmitEdit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('modalSubmitEdit', err); });

                        if (modalSubmitEdit) {
                            refreshTimeout(interaction, timeout);
                            logger.info(interaction.user.username + 'COLLECTED modalSubmitEdit');
                            const eventName = modalSubmitEdit.fields.getTextInputValue('textinputname');
                            // QUERY DB FOR EVENT WITH ID FROM INPUT
                            const artEvent = interaction.client._tempEvents.get(eventName);
                            if (artEvent) {
                                await modalSubmitEdit.update({ content: 'What do you want to edit? -TODO', components: [rowEditSelect] });

                                const stringSelectEdit = await interaction.channel.awaitMessageComponent({ time: 30000, filter, ComponentType: ComponentType.StringSelect });

                                if (stringSelectEdit) {
                                    refreshTimeout(interaction, timeout);
                                    logger.info(interaction.user.username + 'COLLECTED stringSelectEdit');
                                    const changeValues = stringSelectEdit.values;

                                    if (changeValues) {
                                        await stringSelectEdit.update({ content: `You selected ${inlineCode(changeValues)}`, components: [] });

                                        // For later: date is set by data from user input. There will be 4.
                                        const date = new Date();
                                        const hour = isDaylightSavings() ? 10 : 9;
                                        date.setHours(hour);
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
                            await mainCommand.showModal(modalId);
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