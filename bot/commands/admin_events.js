const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, ComponentType, ModalBuilder, Role, RoleSelectMenuBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { priviledgeCheck, arrayToString, getTimeLeft, isDaylightSavings, refreshTimeout, setCooldown, validateDate } = require('../Utils');
const logger = require('../../util/logger.js');

const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 10000;

const EventType = new Collection()
    .set('OPEN', { name: 'Open', value: 0 })
    .set('CLOSED', { name: 'Closed', value: 1 })
    .set('PUBLIC', { name: 'Public', value: 2 })
    .set('LIMITED', { name: 'Limited', value: 3 });

class ArtEvent {
    constructor(type, id, name, role) {
        this._type;
        this._id;
        this._name;
        this._role = role;
        this._dueDate;
        this._discord_startDate;
        this._discord_endDate;
        this._public_startDate;
        this._public_endDate;

        this.type = type;
        this.id = id;
        this.name = name;
    }

    get type() { return this._type; }
    set type(val) {

        if (EventType.has(val)) {
            this._type = EventType.get(val);
            logger.info('ARTEVENT: type SET to ' + this._type);
        }
        else {
            this._type = EventType.get('LIMITED');
            logger.warn('ARTEVENT: type SET val ' + val + ' not EventType or NULL. Setting to "LIMITED"');
        }
    }

    get id() { return this._id; }
    set id(val) {
        if (typeof val === 'string') {
            this._id = val;
            logger.info('ARTEVENT: id SET to ' + this._id);
        }
        else {
            logger.error('ARTEVENT: id SET val not String');
        }
    }

    get name() { return this._name; }
    set name(val) {
        if (typeof val === 'string') {
            this._name = val;
            logger.info('ARTEVENT: name SET to ' + this._name);
        }
        else {
            logger.error('ARTEVENT: name SET val not String');
        }
    }

    get role() { return this._role; }
    set role(val) {

        if (this.type === EventType.get('OPEN') || this.type === EventType.get('CLOSED') || this.type === EventType.get('PUBLIC')) {
            if (val instanceof Role) {
                this._role = val;
                logger.info('ARTEVENT role SET to ' + this._role);
            }
            else {
                logger.error('ARTEVENT: role SET val not instanceof Role');
            }
        }
        else {
            logger.warn(`ARTEVENT: Set Event type to "OPEN", "CLOSED" or "PUBLIC" to set a role. Current role: ${this.role}`);
        }
    }

    get signupDate() { return this._discord_startDate; }
    set signupDate(val) {

        if (this.type === EventType.get('OPEN') || this.type === EventType.get('CLOSED')) {
            if (val instanceof Date) {
                const day = 8.64e+7;
                const hour = isDaylightSavings(val) ? 10 : 9;
                this._discord_startDate = val;
                this._discord_startDate.setHours(hour, 0, 0, 0);
                this._discord_endDate = new Date(this._discord_startDate.getTime() + (day * 5));
                if (this.type === EventType.get('OPEN')) {
                    this._public_startDate = new Date(this._discord_endDate.getTime());
                    this._public_endDate = new Date(this._public_startDate.getTime() + (day * 2));
                    this._public_endDate.setHours(hour - 1, 59, 59);
                }
                this._discord_endDate.setHours(hour - 1, 59, 59);

                logger.info('DATE DISCORD START SET to ' + this._discord_startDate.toString());
                logger.info('DATE DISCORD END SET to ' + this._discord_endDate.toString());
                logger.info('DATE PUBLIC START SET to ' + this._public_startDate.toString());
                logger.info('DATE PUBLIC END SET to ' + this._public_endDate.toString());
            }
            else {
                logger.error('ARTEVENT: signupDate SET val not instanceof Date');
            }
        }
        else {
            logger.warn(`ARTEVENT: Set Event type to "OPEN" or "CLOSED" to set signup dates. Current role: ${this.role}`);
        }
    }

    get dueDate() { return this._dueDate; }
    set dueDate(val) {
        if (this.type === EventType.get('OPEN') || this.type === EventType.get('CLOSED') || this.type === EventType.get('PUBLIC')) {
            if (val instanceof Date) {
                if (this.signupDate) {
                    if (val > this.signupDate) {
                        const hour = isDaylightSavings(val) ? 10 : 9;
                        this._dueDate = val;
                        this._dueDate.setHours(hour, 0, 0, 0);
                        logger.info('ARTEVENT dueDate SET to ' + this._dueDate.toString());
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
        else {
            logger.warn('ARTEVENT: Set Event type to "OPEN", "CLOSED" or "PUBLIC" to set a due date.');
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

                const rowNext = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btnnext')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('btncancel')
                            .setLabel('Cancel')
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

                const editOptions = {
                    type: { label: 'Type', description: 'Edit event Type', value: 'type' },
                    id: { label: 'Id', description: 'Edit event Id', value: 'id' },
                    name: { label: 'Name', description: 'Edit event Name', value: 'name' },
                    role: { label: 'Role', description: 'Edit event Role', value: 'role' },
                    signupDate: { label: 'Signup dates', description: 'Edit Discord Dignup Date', value: 'discordsignup' },
                    dueDate: { label: 'Due date', description: 'Edit event Due Date', value: 'date' }
                };

                const rowEditSelect = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('selectedit')
                            .setPlaceholder('Select all to edit')
                    );

                // Event Edit and Creation components
                // Type select

                const embedConfirm = new EmbedBuilder()
                    .setAuthor({ name: interaction.user.username + ': ' + interaction.user.id })
                    .setColor(0x0099FF)
                    .setTitle('Review Changes')
                    .setDescription('Valid changes and errors');

                const rowSelectType = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('selecttype')
                            .setPlaceholder('Select the event type')
                            .setMaxValues(1)
                            .addOptions([
                                { label: 'Open', description: 'Open events are discord-only, and allow new participants.', value: 'OPEN' },
                                { label: 'Closed', description: 'Closed events are discord-only, with no new participants.', value: 'CLOSED' },
                                { label: 'Public', description: 'Public events welcome all, and have little moderation.', value: 'PUBLIC' }
                            ])
                    );

                // Name types

                const modalNames = new ModalBuilder()
                    .setCustomId('modalnames')
                    .setTitle('Set new values');

                const rowEventId = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('rowid')
                            .setLabel('Id (dsse2022)')
                            .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(20).setRequired(true));

                const rowEventName = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('rowname')
                            .setLabel('Name (Secret Santa)')
                            .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(35).setRequired(true));

                // Role select

                const rowSelectRole = new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                            .setCustomId('selectrole')
                            .setPlaceholder('Select event role')
                            .setMaxValues(1)
                            .setMinValues(1)
                    );

                // Date types

                const modalDates = new ModalBuilder()
                    .setCustomId('modaleditdates')
                    .setTitle('Set new values')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('year')
                                    .setLabel('Input new start year (leave blank if current)')
                                    .setStyle(TextInputStyle.Short).setMinLength(4).setMaxLength(4).setRequired(false)),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('month')
                                    .setLabel('Input new start month (numerical month)')
                                    .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true)),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('signupstartday')
                                    .setLabel('Input new start day')
                                    .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(2).setRequired(true))
                    );

                const testEvent = new ArtEvent('OPEN', 'dsse2022', 'Destiny Secret Santa Event 2022', null);
                interaction.client._tempEvents.set(testEvent.id, testEvent);

                const filter = intr => intr.user.id === interaction.user.id;

                await interaction.reply({ content: arrayToString(permittedRoles, true, ' ') + ' permitted.\n**Create**, **Edit** or **Delete** an event.', ephemeral: true, components: [rowMain] });

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
                        await mainCommand.editReply({ content: 'Type in the name of the event you want to edit. The most recent events include: ' + arrayToString(pastEvents, true, ' '), components: [] });

                        const modalSubmitEdit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('modalSubmitEdit', err); });

                        if (modalSubmitEdit) {
                            refreshTimeout(interaction, timeout);
                            logger.info(interaction.user.username + 'COLLECTED modalSubmitEdit');
                            const eventName = modalSubmitEdit.fields.getTextInputValue('textinputname');
                            // QUERY DB FOR EVENT WITH ID FROM INPUT
                            const artEvent = interaction.client._tempEvents.get(eventName);

                            if (artEvent) {

                                if (artEvent.type === EventType.get('OPEN') || artEvent.type === EventType.get('CLOSED')) {
                                    rowEditSelect.components[0].setMaxValues(6);
                                    rowEditSelect.components[0].addOptions([
                                        editOptions.type,
                                        editOptions.id,
                                        editOptions.name,
                                        editOptions.role,
                                        editOptions.signupDate,
                                        editOptions.dueDate
                                    ]);
                                }
                                else if (artEvent.type === EventType.get('PUBLIC')) {
                                    rowEditSelect.components[0].setMaxValues(5);
                                    rowEditSelect.components[0].addOptions([
                                        editOptions.type,
                                        editOptions.id,
                                        editOptions.name,
                                        editOptions.role,
                                        editOptions.dueDate
                                    ]);
                                }
                                else if (artEvent.type === EventType.get('LIMITED')) {
                                    rowEditSelect.components[0].setMaxValues(3);
                                    rowEditSelect.components[0].addOptions([
                                        editOptions.type,
                                        editOptions.id,
                                        editOptions.name
                                    ]);
                                }
                                else {
                                    artEvent.type = 'LIMITED';
                                    logger.error('event has no type. Assigning LIMITED');
                                }

                                await modalSubmitEdit.update({ content: 'What do you want to edit? -TODO', components: [rowEditSelect] });

                                const stringSelectEdit = await interaction.channel.awaitMessageComponent({ time: 30000, filter, ComponentType: ComponentType.StringSelect });

                                if (stringSelectEdit) {
                                    refreshTimeout(interaction, timeout);
                                    logger.info(interaction.user.username + 'COLLECTED stringSelectEdit');

                                    const changeValues = stringSelectEdit.values;
                                    // Change condition to if (changeValues.length > 0)
                                    if (changeValues) {
                                        let sendTypeSelect = false;
                                        let sendNameModal_id = false;
                                        let sendNameModal_name = false;
                                        let sendRoleSelect = false;
                                        let sendDateModal_signup = false;
                                        let sendDateModal_due = false;
                                        const editCommands = [];
                                        const nextCommands = [];
                                        let nextCounter = 0;

                                        const editData = { errors: [], currentValues: [], newValues: [], type: null, id: null, name: null, role: null, signupDate: null, dueDate: null };

                                        if (changeValues.includes('type')) {
                                            sendTypeSelect = true;
                                            nextCounter++;
                                            const string = artEvent.type.name ? artEvent.type.name : null;
                                            editData.currentValues.push('**TYPE:** ' + string);
                                            logger.warn('using type');
                                        }
                                        if (changeValues.includes('id')) {
                                            sendNameModal_id = true;
                                            modalNames.addComponents(rowEventId);
                                            nextCounter++;
                                            const string = artEvent.id ? artEvent.id : null;
                                            editData.currentValues.push('**ID:** ' + string);
                                            logger.warn('using id');
                                        }
                                        if (changeValues.includes('name')) {
                                            sendNameModal_name = true;
                                            modalNames.addComponents(rowEventName);
                                            if (!sendNameModal_id) nextCounter++;
                                            const string = artEvent.name ? artEvent.name : 'Null';
                                            editData.currentValues.push('**NAME:** ' + string);
                                            logger.warn('using name');
                                        }
                                        if (changeValues.includes('role')) {
                                            sendRoleSelect = true;
                                            nextCounter++;
                                            const string = artEvent.role ? artEvent.role : 'Null';
                                            editData.currentValues.push('**ROLE:** ' + string);
                                            logger.warn('using role');
                                        }
                                        if (changeValues.includes('discordsignup')) {
                                            sendDateModal_signup = true;
                                            nextCounter++;
                                            const string = artEvent.signupDate ? artEvent.signupDate.getMonth() + 1 + ' ' + artEvent.signupDate.getDate() + ' ' + artEvent.signupDate.getFullYear() : 'Null';
                                            editData.currentValues.push('**SIGNUP DATE:** ' + string);
                                            logger.warn('using signup date');
                                        }
                                        if (changeValues.includes('date')) {
                                            sendDateModal_due = true;
                                            nextCounter++;
                                            const string = artEvent.dueDate ? artEvent.dueDate.getMonth() + 1 + ' ' + artEvent.dueDate.getDate() + ' ' + artEvent.dueDate.getFullYear() : 'Null';
                                            editData.currentValues.push('**DUE DATE:** ' + string);
                                            logger.warn('using duedate');
                                        }

                                        if (sendTypeSelect) {
                                            await stringSelectEdit.update({ content: 'Select event Type', components: [rowSelectType] });
                                            const typeCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.StringSelect }).catch(err => { logger.error('typeCommand', err); });
                                            if (typeCommand) {
                                                editCommands.push(typeCommand);
                                                // SETTING EVENT TYPE
                                                const typeToSet = EventType.get(typeCommand.values[0]);
                                                editData.type = typeToSet;
                                                editData.newValues.push(typeToSet.name);


                                                if (nextCounter > editCommands.length) {
                                                    await typeCommand.update({ content: 'Click `Next` to continue, or `Cancel` to exit with no changes', components: [rowNext] });
                                                    const nextCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('nextCommand', err); });
                                                    if (nextCommand) {

                                                        if (nextCommand.customId === 'btnnext') {
                                                            nextCommands.push(nextCommand);
                                                        }
                                                        else if (nextCommand.customId === 'btncancel') {
                                                            await nextCommand.update({ content: 'You selected `Cancel`. You can dismiss this message.', components: [] });
                                                            return;
                                                        }
                                                    }
                                                    else {
                                                        typeCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                                    }
                                                }


                                            }
                                            else {
                                                stringSelectEdit.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }

                                        if (sendNameModal_id || sendNameModal_name) {
                                            const lastInt = nextCommands[nextCommands.length - 1] ? nextCommands[nextCommands.length - 1] : stringSelectEdit;
                                            await lastInt.showModal(modalNames);
                                            await lastInt.editReply({ content: 'Update', components: [] });
                                            const nameModalSubmit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('nameModalSubmit', err); });
                                            if (nameModalSubmit) {
                                                editCommands.push(nameModalSubmit);

                                                if (sendNameModal_id) {
                                                    const idToSet = nameModalSubmit.fields.getTextInputValue('rowid');
                                                    editData.id = idToSet;
                                                    editData.newValues.push(idToSet);
                                                }
                                                if (sendNameModal_name) {
                                                    const nameToSet = nameModalSubmit.fields.getTextInputValue('rowname');
                                                    editData.name = nameToSet;
                                                    editData.newValues.push(nameToSet);
                                                }

                                                if (nextCounter > editCommands.length) {
                                                    await nameModalSubmit.update({ content: 'Click `Next` to continue, or `Cancel` to exit with no changes', components: [rowNext] });
                                                    const nextCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('nextCommand', err); });
                                                    if (nextCommand) {

                                                        if (nextCommand.customId === 'btnnext') {
                                                            nextCommands.push(nextCommand);
                                                        }
                                                        else if (nextCommand.customId === 'btncancel') {
                                                            await nextCommand.update({ content: 'You selected `Cancel`. You can dismiss this message.', components: [] });
                                                            return;
                                                        }
                                                    }
                                                    else {
                                                        nameModalSubmit.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                                    }
                                                }


                                            }
                                            else {
                                                lastInt.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        if (sendRoleSelect) {
                                            const lastInt = nextCommands[nextCommands.length - 1] ? nextCommands[nextCommands.length - 1] : stringSelectEdit;
                                            await lastInt.update({ content: 'Select new role to use', components: [rowSelectRole] });
                                            const roleCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.RoleSelect }).catch(err => { logger.error('roleCommand', err); });
                                            if (roleCommand) {
                                                editCommands.push(roleCommand);
                                                // SETTING EVENT ROLE
                                                const roleToSet = roleCommand.roles.first();
                                                if (roleToSet) {
                                                    editData.role = roleToSet;
                                                    editData.newValues.push(roleToSet.name);
                                                }
                                                else {
                                                    editData.errors.push(`ERROR: Failed to retreive Guild Role`);
                                                }


                                                if (nextCounter > editCommands.length) {
                                                    await roleCommand.update({ content: 'Click `Next` to continue, or `Cancel` to exit with no changes', components: [rowNext] });
                                                    const nextCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('nextCommand', err); });
                                                    if (nextCommand) {

                                                        if (nextCommand.customId === 'btnnext') {
                                                            nextCommands.push(nextCommand);
                                                        }
                                                        else if (nextCommand.customId === 'btncancel') {
                                                            await nextCommand.update({ content: 'You selected `Cancel`. You can dismiss this message.', components: [] });
                                                            return;
                                                        }
                                                    }
                                                    else {
                                                        roleCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                                    }
                                                }


                                            }
                                            else {
                                                lastInt.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        if (sendDateModal_signup) {
                                            const lastInt = nextCommands[nextCommands.length - 1] ? nextCommands[nextCommands.length - 1] : stringSelectEdit;
                                            await lastInt.showModal(modalDates);
                                            await lastInt.editReply({ content: 'Update Due Date', components: [] });
                                            const dateSignupModalSubmit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('dateSignupModalSubmit', err); });
                                            if (dateSignupModalSubmit) {
                                                editCommands.push(dateSignupModalSubmit);

                                                const signupYear = dateSignupModalSubmit.fields.getTextInputValue('year');
                                                const currentYear = new Date().getFullYear();
                                                if (signupYear < currentYear) {
                                                    editData.errors.push(`WARN: Year ${signupYear} is a past year`);
                                                }

                                                const signupMonth = dateSignupModalSubmit.fields.getTextInputValue('month');
                                                const signupDay = dateSignupModalSubmit.fields.getTextInputValue('signupstartday');
                                                const validDate = validateDate(signupMonth, signupDay);

                                                if (validDate.valid) {
                                                    // SUCCESS SIGNUPDATE
                                                    editData.signupDate = new Date(signupYear, validDate.m, validDate.d);
                                                    editData.newValues.push(editData.signupDate.getMonth() + 1 + ' ' + editData.signupDate.getDate() + ' ' + editData.signupDate.getFullYear());
                                                    const test = editData.signupDate.getMonth() + 1 + ' ' + editData.signupDate.getDate() + ' ' + editData.signupDate.getFullYear();
                                                    console.warn(test.toString());


                                                    if (nextCounter > editCommands.length) {
                                                        await dateSignupModalSubmit.update({ content: 'Click `Next` to continue, or `Cancel` to exit with no changes', components: [rowNext] });
                                                        const nextCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('nextCommand', err); });
                                                        if (nextCommand) {

                                                            if (nextCommand.customId === 'btnnext') {
                                                                nextCommands.push(nextCommand);
                                                            }
                                                            else if (nextCommand.customId === 'btncancel') {
                                                                await nextCommand.update({ content: 'You selected `Cancel`. You can dismiss this message.', components: [] });
                                                                return;
                                                            }
                                                        }
                                                        else {
                                                            dateSignupModalSubmit.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                                        }
                                                    }


                                                }
                                                else {
                                                    if (validDate.error.code === 0) {
                                                        editData.errors.push(`ERROR: Registration Month ${signupMonth} is not valid.`);
                                                    }
                                                    else if (validDate.error.code === 1) {
                                                        editData.errors.push(`ERROR: Registration Day ${signupDay} is not valid for month ${signupMonth}`);
                                                    }
                                                }
                                            }
                                            else {
                                                lastInt.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }
                                        if (sendDateModal_due) {
                                            const lastInt = nextCommands[nextCommands.length - 1] ? nextCommands[nextCommands.length - 1] : stringSelectEdit;
                                            await lastInt.showModal(modalDates);
                                            await lastInt.editReply({ content: 'Update', components: [] });
                                            const dateDueModalSubmit = await interaction.awaitModalSubmit({ time: 30000, filter }).catch(err => { logger.error('dateDueModalSubmit', err); });
                                            if (dateDueModalSubmit) {
                                                editCommands.push(dateDueModalSubmit);

                                                const dueYear = dateDueModalSubmit.fields.getTextInputValue('year');
                                                const currentYear = new Date().getFullYear();
                                                if (dueYear < currentYear) {
                                                    editData.errors.push(`WARN: Year ${dueYear} is a past year`);
                                                }

                                                const dueMonth = dateDueModalSubmit.fields.getTextInputValue('month');
                                                const dueDay = dateDueModalSubmit.fields.getTextInputValue('signupstartday');
                                                const validDate = validateDate(dueMonth, dueDay);

                                                if (validDate.valid) {


                                                    if (artEvent.type === EventType.get('OPEN') || artEvent.type === EventType.get('CLOSED')) {
                                                        const dateToCheck = editData.signupDate ? editData.signupDate : artEvent.signupDate;
                                                        if (dateToCheck) {
                                                            editData.dueDate = new Date(dueYear, validDate.m, validDate.d);
                                                            if (editData.dueDate > dateToCheck) {
                                                                // SUCCESS DUEDATE OPEN || CLOSED
                                                                editData.newValues.push(editData.dueDate.getMonth() + 1 + ' ' + editData.dueDate.getDate() + ' ' + editData.dueDate.getFullYear());
                                                                const test = editData.dueDate.getMonth() + 1 + ' ' + editData.dueDate.getDate() + ' ' + editData.dueDate.getFullYear();
                                                                console.warn(test.toString());
                                                            }
                                                            else {
                                                                editData.errors.push(`ERROR: Due Date ${editData.dueDate} should be later than Signup Start Date ${artEvent.signupDate}`);
                                                            }
                                                        }
                                                        else {
                                                            editData.errors.push(`ERROR: Set Signup Start Date before setting Due Date`);
                                                        }
                                                    }
                                                    else if (artEvent.type === EventType.get('PUBLIC')) {
                                                        // SUCCESS DUEDATE PUBLIC
                                                        editData.dueDate = new Date(dueYear, validDate.m, validDate.d);
                                                        editData.newValues.push(editData.dueDate.getMonth() + 1 + ' ' + editData.dueDate.getDate() + ' ' + editData.dueDate.getFullYear());
                                                        const test = editData.dueDate.getMonth() + 1 + ' ' + editData.dueDate.getDate() + ' ' + editData.dueDate.getFullYear();
                                                        console.warn(test.toString());
                                                    }


                                                }
                                                else {
                                                    if (validDate.error.code === 0) {
                                                        editData.errors.push(`ERROR: Due Month ${dueMonth} is not valid.`);
                                                    }
                                                    else if (validDate.error.code === 1) {
                                                        editData.errors.push(`ERROR: Due Day ${dueDay} is not valid for month ${dueMonth}`);
                                                    }
                                                }
                                            }
                                            else {
                                                lastInt.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                            }
                                        }

                                        const stringsToPublish = {};
                                        stringsToPublish.Errors = arrayToString(editData.errors, false, '\n');
                                        stringsToPublish.CurrentValues = arrayToString(editData.currentValues, false, '\n');
                                        stringsToPublish.EditValues = arrayToString(editData.newValues, false, '\n');

                                        embedConfirm.addFields({ name: 'Errors', value: stringsToPublish.Errors ? stringsToPublish.Errors : 'None', inline: false });
                                        embedConfirm.addFields({ name: '--------------------', value: ' ', inline: false });
                                        embedConfirm.addFields({ name: 'Current Values', value: stringsToPublish.CurrentValues ? stringsToPublish.CurrentValues : 'None', inline: true });
                                        embedConfirm.addFields({ name: 'New Values', value: stringsToPublish.EditValues ? stringsToPublish.EditValues : 'None', inline: true });

                                        const lastInt = editCommands[editCommands.length - 1] ? editCommands[editCommands.length - 1] : stringSelectEdit;
                                        await lastInt.update({ embeds: [embedConfirm], components: [rowVerify] });

                                        const verifyEditsCommand = await interaction.channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('verifyEditsCommand', err); });

                                        if (verifyEditsCommand) {
                                            // SET all ARTEVENT here
                                            // QUERY ALL HERE by grabbing ARTEVENT from above
                                            await verifyEditsCommand.update({ content: 'Changes applied successfully. You can dismiss this message.', components: [] });
                                        }
                                        else {
                                            logger.info(`${interaction.user.username} NO PRESS verifyEditsCommand!`);
                                            await mainCommand.editReply({ content: 'Interaction expired. Try again after `' + cooldownTimer / 1000 + ' seconds`.', components: [] });
                                        }
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
                            await mainCommand.editReply({ content: 'Type in the name of the event you want to edit. The most recent events include: ' + arrayToString(pastEvents, true, ' '), components: [] });

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

// TODO - Add proper instructions for each Next/Cancel interaction in Edit command
// TODO - Test errors in edit command to try and get "TypeError: Cannot read properties of null (reading 'toString')" to happen.
// I don't know what triggered the last one, but it happened before I separated the "const string" to the rest of the editables
// Revert all the non-date ones back to the big long string, just temporarily, to test.
// Add logs using toString within the logic blocks to see which one exactly had triggered the last one I saw.

// TODO - Timing issues with select menu. If you select none, cooldown resets sooner than timer period for command. Try adding "max: 1"
// When the above happens, if user uses command again, the cooldown wont be there to stop them. Bot errors out.
// Research that. See if there's a way to kill the connection. Like, see if you can find last interaction by user
// and compare the ID. If it's the same slash command, either don't allow them to continue OR somehow kill it?
// For Science: console log old interaction ID, and console log new interaction ID. See how the two objects compare in general.