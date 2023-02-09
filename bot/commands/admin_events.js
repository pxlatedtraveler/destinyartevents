const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, ModalBuilder, Role, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { priviledgeCheck, arrayToString, getTimeLeft, isDaylightSavings, refreshTimeout, setCooldown, validateDate } = require('../Utils');
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
        this._dueDate;
        this._role = role;
        this._discord_startDate;
        this._discord_endDate;
        this._public_startDate;
        this._public_endDate;
    }

    get type() { return this._type; }
    set type(val) {
        if (EventType.has(val)) {
            this._type = val;
        }
        else {
            this._type = EventType.get('LIMITED');
            logger.warn('ARTEVENT: type SET val not EventType or NULL. Setting to "LIMITED"');
        }
    }

    get id() { return this._id; }
    set id(val) { typeof val === 'string' ? this._id = val : logger.error('ARTEVENT: id SET val not String'); }

    get name() { return this._name; }
    set name(val) { typeof val === 'string' ? this._name = val : logger.error('ARTEVENT: name SET val not String'); }

    get dueDate() { return this._duedate; }
    set dueDate(val) {
        if (val instanceof Date) {
            if (this.signupDate) {
                if (val > this.signupDate) {
                    const hour = isDaylightSavings(val) ? 10 : 9;
                    this._dueDate = val;
                    this._dueDate.setHours(hour, 0, 0, 0);
                    console.log('DATE DUE SET: ', this._dueDate.toString());
                }
                else {
                    logger.error('ARTEVENT: dueDate SET val should be greated than signupDate');
                }
            }
            else {
                logger.error('ARTEVENT: singupDate should be created before dueDate');
            }
        }
        else {
            logger.error('ARTEVENT: dueDate SET val not instanceof Date');
        }
    }

    get role() { return this._role; }
    set role(val) {
        if (val instanceof Role) {
            this._role = val;
            console.log('ROLE SET: ', this._role);
        }
        else {
            logger.error('ARTEVENT: role SET val not instanceof Role');
        }
    }

    get signupDate() { return this._discord_startDate; }
    set signupDate(val) {

        if (val instanceof Date) {
            const day = 8.64e+7;
            const hour = isDaylightSavings(val) ? 10 : 9;
            this._discord_startDate = val;
            this._discord_startDate.setHours(hour, 0, 0, 0);
            this._discord_endDate = new Date(this._discord_startDate.getTime() + (day * 5));
            this._public_startDate = new Date(this._discord_endDate.getTime());
            this._public_endDate = new Date(this._public_startDate.getTime() + (day * 2));
            this._discord_endDate.setHours(hour - 1, 59, 59);
            this._public_endDate.setHours(hour - 1, 59, 59);
            console.log('DATE DISCORD START SET: ', this._discord_startDate.toString());
            console.log('DATE DISCORD END SET: ', this._discord_endDate.toString());
            console.log('DATE PUBLIC START SET: ', this._public_startDate.toString());
            console.log('DATE PUBLIC END SET: ', this._public_endDate.toString());
        }
        else {
            logger.error('ARTEVENT: signupDate SET val not instanceof Date');
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
                                .setMaxValues(5)
                                .addOptions([
                                    { label: 'Id', description: 'Change event Id', value: 'id' },
                                    { label: 'Name', description: 'Change event\'s vanity name', value: 'name' },
                                    { label: 'Role', description: 'Change event\'s role', value: 'role' },
                                    { label: 'Discord signup dates', description: 'Change Discord signup date', value: 'discordsignup' },
                                    { label: 'Due date', description: 'Change event\'s due date', value: 'date' }
                                ])
                        );

                    // Event Edit and Creation components
                    // Type

                    const rowSelectType = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('selecttype')
                                .setPlaceholder('Select the event type')
                                .setMaxValues(1)
                                .addOptions([
                                    { label: 'Exchange', description: 'Exchange events are discord-only, and allow exchange or solo participation.', value: 'exchange' },
                                    { label: 'Open', description: 'Open events are open to all, and have little moderation.', value: 'open' }
                                ])
                        );

                    // Role selet

                    const rowSelectRole = new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId('selectrole')
                                .setPlaceholder('Select event role')
                                .setMaxValues(1)
                                .setMinValues(1)
                        );

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

                    const modalDates = new ModalBuilder()
                        .setCustomId('modaleditdates')
                        .setTitle('Set new values');

                    const rowDueDateMonth = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('duedatemonth')
                                .setLabel('Input new event due month (numerical month)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    const rowDueDateDay = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('duedateday')
                                .setLabel('Input new event due day')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    // Discord Registration Date

                    const rowSignupYear = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('startyear')
                                .setLabel('Input new start year (leave blank if current)')
                                .setStyle(TextInputStyle.Short).setMinLength(4).setMaxLength(4).setRequired(false));

                    const rowSignupStartMonth = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('signupstartmonth')
                                .setLabel('Input new start month (numerical month)')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));

                    const rowSignupStartDay = new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('signupstartday')
                                .setLabel('Input new start day')
                                .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true));


                const testEvent = new ArtEvent('dsse2022', 'Destiny Secret Santa Event 2022', null);
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
                                // const date = new Date();
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
                                        let sendNameModal_id = false;
                                        let sendNameModal_name = false;
                                        let sendRoleSelect = false;
                                        let sendDateModal_signup = false;
                                        let sendDateModal_due = false;
                                        const editCommands = [];

                                        const dateData = { errors: [] };

                                        if (changeValues.includes('id')) {
                                            sendNameModal_id = true;
                                            modalNames.addComponents(rowEventId);
                                            logger.warn('using id');
                                        }
                                        if (changeValues.includes('name')) {
                                            sendNameModal_name = true;
                                            modalNames.addComponents(rowEventName);
                                            logger.warn('using name');
                                        }
                                        if (changeValues.includes('role')) {
                                            sendRoleSelect = true;
                                            logger.warn('using role');
                                        }
                                        if (changeValues.includes('date')) {
                                            sendDateModal_due = true;
                                            modalDates.addComponents(rowDueDateMonth, rowDueDateDay);
                                            logger.warn('using duedate');
                                        }
                                        if (changeValues.includes('discordsignup')) {
                                            sendDateModal_signup = true;
                                            modalDates.addComponents(rowSignupYear, rowSignupStartMonth, rowSignupStartDay);
                                            logger.warn('using regi date');
                                        }

                                        if (sendNameModal_id || sendNameModal_name) {
                                            await stringSelectEdit.showModal(modalNames);
                                            await stringSelectEdit.editReply({ content: 'Update', components: [] });
                                            const nameModalSubmit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('nameModalSubmit', err); });
                                            if (nameModalSubmit) {
                                                editCommands.push(nameModalSubmit);
                                                // Validate user input. Store if valid, boot if false (the else below)
                                            }
                                            else {
                                                nameModalSubmit.update({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        if (sendRoleSelect) {
                                            const lastInt = editCommands[editCommands.length - 1] ? editCommands[editCommands.length - 1] : stringSelectEdit;
                                            await lastInt.update({ content: 'Select new role to use', components: [rowSelectRole] });
                                            const roleCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.RoleSelect }).catch(err => { logger.error('roleCommand', err); });
                                            if (roleCommand) {
                                                editCommands.push(roleCommand);
                                                artEvent.role = roleCommand.roles.first();
                                            }
                                            else {
                                                lastInt.update({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        if (sendDateModal_due || sendDateModal_signup) {
                                            const lastInt = editCommands[editCommands.length - 1] ? editCommands[editCommands.length - 1] : stringSelectEdit;
                                            await lastInt.showModal(modalDates);
                                            await lastInt.editReply({ content: 'Update', components: [rowSelectRole] });
                                            const dateModalSubmit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('dateModalSubmit', err); });
                                            if (dateModalSubmit) {
                                                editCommands.push(dateModalSubmit);

                                                dateData.year = dateModalSubmit.fields.getTextInputValue('startyear');
                                                const currentYear = new Date().getFullYear();
                                                if (dateData.year < currentYear) {
                                                    console.log('YEAR VAL NOT VALID. Swapping to CURRENT');
                                                    dateData.errors.push(`Year ${dateData.year} was invalid or empty; changed to ${currentYear}`);
                                                    dateData.year = currentYear;
                                                }
                                                else {
                                                    console.log('YEAR IS A VALID YEAR VALUE');
                                                }

                                                if (sendDateModal_signup) {
                                                    dateData.signupMonth = dateModalSubmit.fields.getTextInputValue('signupstartmonth');
                                                    dateData.signupDay = dateModalSubmit.fields.getTextInputValue('signupstartday');
                                                    const validDate = validateDate(dateData.signupMonth, dateData.signupDay);
                                                    if (validDate.valid) {
                                                        dateData.signupDate = new Date(dateData.year, validDate.m, validDate.d);
                                                        // SUCCESS SIGNUPDATE
                                                        artEvent.signupDate = dateData.signupDate;
                                                    }
                                                    else {
                                                        if (validDate.error.code === 0) {
                                                            dateData.errors.push(`Registration Month ${dateData.signupMonth} is not valid.`);
                                                        }
                                                        else if (validDate.error.code === 1) {
                                                            dateData.errors.push(`Registration Day ${dateData.signupDay} is not valid for month ${dateData.dueMonth}`);
                                                        }
                                                    }
                                                }

                                                if (sendDateModal_due) {
                                                    dateData.dueMonth = dateModalSubmit.fields.getTextInputValue('duedatemonth');
                                                    dateData.dueDay = dateModalSubmit.fields.getTextInputValue('duedateday');
                                                    const validDate = validateDate(dateData.dueMonth, dateData.dueDay);
                                                    if (validDate.valid) {
                                                            // REWORK THIS CODE... SPLIT DATE MODALS, CREATE YEAR INPUT UNIQUE TO DUE DATE...or see if the set of 3 actionrows can be reused.
/*                                                         if (dateData.signupDate) {
                                                            dateData.dueDate = new Date(dateData.signupDate.getFullYear(), validDate.m, validDate.d);
                                                            if (dateData.dueDate > dateData.signupDate) {
                                                                // SUCCESS DUEDATE
                                                                artEvent.dueDate = dateData.dueDate;
                                                            }
                                                            else {
                                                                dateData.errors.push(`Due Date ${dateData.dueDate} should be later than Signup Start Date ${dateData.signupDate}`);
                                                            }
                                                        }
                                                        else {
                                                            if (artEvent.signupDate) {
                                                                if (dateData.dueDate > artEvent.signupDate) {
                                                                // SUCCESS DUEDATE
                                                                artEvent.dueDate = dateData.dueDate;
                                                                }
                                                                else {
                                                                    dateData.errors.push(`Due Date ${dateData.dueDate} should be later than Signup Start Date ${dateData.signupDate}`);
                                                                }
                                                            }
                                                            else {
                                                                dateData.errors.push(`Set Signup Start Date before Due Date`);
                                                            }
                                                        } */
                                                    }
                                                    else {
                                                        if (validDate.error.code === 0) {
                                                            dateData.errors.push(`Due Month ${dateData.dueMonth} is not valid.`);
                                                        }
                                                        else if (validDate.error.code === 1) {
                                                            dateData.errors.push(`Due Day ${dateData.dueDay} is not valid for month ${dateData.dueMonth}`);
                                                        }
                                                    }
                                                }
                                            }
                                            else {
                                                lastInt.update({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        // QUERY ALL HERE by grabbing ARTEVENT from above
                                        const lastInt = editCommands[editCommands.length - 1] ? editCommands[editCommands.length - 1] : stringSelectEdit;
                                        await lastInt.update({ content: 'That was a lot... TODO, grab ALL replies using array.', components: [] });
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