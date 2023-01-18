const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, UserSelectMenuBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const logger = require('../../util/logger.js');

const cooldownTimer = 10000;

const Months = {
    '1': { id: '1', name: 'January', days: 31 },
    '2': { id: '2', name: 'February', days: 29 },
    '3': { id: '3', name: 'March', days: 31 },
    '4': { id: '4', name: 'April', days: 30 },
    '5': { id: '5', name: 'May', days: 31 },
    '6': { id: '6', name: 'June', days: 30 },
    '7': { id: '7', name: 'July', days: 31 },
    '8': { id: '8', name: 'August', days: 31 },
    '9': { id: '9', name: 'September', days: 30 },
    '10': { id: '10', name: 'October', days: 31 },
    '11': { id: '11', name: 'November', days: 30 },
    '12': { id: '12', name: 'December', days: 31 }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Add or Manage your birthday.'),

    async execute(interaction) {

        if (interaction.client.cooldowns.has(interaction.user.id)) {
            const userTimeout = interaction.client.cooldowns.get(interaction.user.id);
            await interaction.reply({ content: "You've used this command recently. Try again after `" + getTimeLeft(userTimeout.timeout, userTimeout.startTime) + " seconds`.", ephemeral: true });
        }
        else {
            logger.info('SETTING COOLDOWN');
            const timeout = setTimeout(() => {
                interaction.client.cooldowns.delete(interaction.user.id);
                logger.info('COOLDOWN DELETED IN TIMEOUT: ' + interaction.client.cooldowns);
            }, cooldownTimer);
            interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });

            const rowMain = new ActionRowBuilder();

            const addBirthday = new ButtonBuilder()
                    .setCustomId('btnaddbirthday')
                    .setLabel('Add Birthday')
                    .setStyle(ButtonStyle.Success);

            const removeBirthday = new ButtonBuilder()
                    .setCustomId('btnremovebirthday')
                    .setLabel('Remove Birthday')
                    .setStyle(ButtonStyle.Danger);

            const viewUpcoming = new ButtonBuilder()
                    .setCustomId('btnviewupcoming')
                    .setLabel('Upcoming Birthdays')
                    .setStyle(ButtonStyle.Primary);

            const lookupUser = new ButtonBuilder()
                    .setCustomId('btnviewuser')
                    .setLabel('Lookup User')
                    .setStyle(ButtonStyle.Primary);

            const modal = new ModalBuilder()
                    .setCustomId('birthdaymodal')
                    .setTitle('Register your birthday')
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('textinputmonth')
                                    .setLabel('Input month (Numerical value)')
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(1)
                                    .setMaxLength(2)
                                    .setRequired(true)
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('textinputday')
                                    .setLabel('Input day')
                                    .setStyle(TextInputStyle.Short)
                                    .setMinLength(1)
                                    .setMaxLength(2)
                                    .setRequired(true)
                            ));

            const rowViewUser = new ActionRowBuilder()
            .addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('userselect')
                    .setPlaceholder('name#0000')
                    .setMaxValues(1)
                    .setMinValues(1)
            );

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

            logger.info('COMPONENTS CREATED');

            // API DB QUERY GET ENTRY, CHECK IF OBJ EXISTS FOR BOOL
            const hasBirthday = interaction.client._tempBirthdays.has(interaction.user.id);
            hasBirthday ? rowMain.addComponents(removeBirthday, viewUpcoming, lookupUser) : rowMain.addComponents(addBirthday, viewUpcoming, lookupUser);
            const filter = intr => intr.user.id === interaction.user.id;

            await interaction.reply({ content: 'Select an action to perform.', ephemeral: true, components: [rowMain] });

            const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('command', err); });

            if (mainCommand) {

                refreshTimeout(interaction, timeout);
                logger.info(interaction.user.username + ' COLLECTED mainCommand ' + mainCommand.customId);

                if (mainCommand.customId === 'btnaddbirthday') {
                    await mainCommand.showModal(modal);
                    await mainCommand.editReply({ content: 'Waiting for reply.', components: [] });

                    const modalSubmit = await interaction.awaitModalSubmit({ time: 10000, filter }).catch(err => { logger.error('modal', err); });

                    if (modalSubmit) {
                        refreshTimeout(interaction, timeout);
                        logger.info(`${interaction.user.username} COLLECTED modalSubmit`);
                        let birthMonth;
                        let birthDay;
                        birthMonth = modalSubmit.fields.getTextInputValue('textinputmonth');
                        birthDay = modalSubmit.fields.getTextInputValue('textinputday');

                        const validDate = validateDate(birthMonth, birthDay);

                        if (validDate.valid) {
                            birthMonth = validDate.m;
                            birthDay = validDate.d;
                            await modalSubmit.reply({ content: "You entered `" + Months[birthMonth].name + ' ' + birthDay + "`. Is this correct?", ephemeral: true, components: [rowVerify] });
                            mainCommand.deleteReply();

                            const btnPressConfirmAdd = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('modal submit', err); });

                            if (btnPressConfirmAdd) {
                                refreshTimeout(interaction, timeout);
                                logger.info(`${interaction.user.username} COLLECTED btnPressConfirmAdd ` + btnPressConfirmAdd.customId);

                                if (btnPressConfirmAdd.customId === 'btnconfirm') {
                                    // API DB QUERY ADD ENTRY
                                    interaction.client._tempBirthdays.set(interaction.user.id, { month: birthMonth, day: birthDay });

                                    await btnPressConfirmAdd.update({ content: "`" + btnPressConfirmAdd.user.username + "`'s birthday successfully recorded. You may dismiss this message.", components: [] })
                                        .then((btnPress_del_i) => { setTimeout(() => { btnPress_del_i.interaction.deleteReply();}, 3000); });
                                    await btnPressConfirmAdd.followUp({ content: btnPressConfirmAdd.user.toString() + " registered their birthday!", ephemeral: false });
                                }
                                else if (btnPressConfirmAdd.customId === 'btnreject') {
                                    await btnPressConfirmAdd.update({ content: "Use the `/Birthday` command to try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                                }
                            }
                            else {
                                logger.info(`${interaction.user.username} NO PRESS btnPressConfirmAdd!`);
                                await modalSubmit.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                            }
                        }
                        else {

                            if (validDate.error.code === 0) {
                                await modalSubmit.reply({ content: "The month entered, `" + birthMonth + "` is not valid. Remember to use a numerical value (ie: 1 or 01 for January).", ephemeral: true });
                                interaction.deleteReply();
                            }
                            else if (validDate.error.code === 1) {
                                birthMonth = validDate.m;
                                await modalSubmit.reply({ content: "The day entered, `" + birthDay + "` is not valid for the month of  `" + Months[birthMonth].name + "`. Remember to only use numerical values.", ephemeral: true });
                                interaction.deleteReply();
                            }
                        }
                    }
                    else {
                        logger.info(`${interaction.user.username} NO SUBMIT modalSubmit!`);
                        await mainCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", ephemeral: true });
                    }
                }
                else if (mainCommand.customId === 'btnremovebirthday') {
                    await mainCommand.update({ content: 'Are you sure you want to remove your birthday?', ephemeral: true, components: [rowVerify] });

                    const btnPressConfirmRemove = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('command remove', err); });

                    if (btnPressConfirmRemove) {
                        refreshTimeout(interaction, timeout);
                        logger.info(`${interaction.user.username} COLLETED btnPressConfirmRemove `, btnPressConfirmRemove.customId);

                        if (btnPressConfirmRemove.customId === 'btnconfirm') {
                            // API DB QUERY DELETE ENTRY
                            interaction.client._tempBirthdays.delete(interaction.user.id);

                            await btnPressConfirmRemove.update({ content: "`" + btnPressConfirmRemove.user.username + "`'s birthday successfully removed. You may dismiss this message.", components: [] })
                                .then((btnPressConfirmRemove_i) => { setTimeout(() => { btnPressConfirmRemove_i.interaction.deleteReply(); }, 3000); });
                            await btnPressConfirmRemove.followUp({ content: btnPressConfirmRemove.user.toString() + " removed their birthday.", ephemeral: false });
                        }
                        else if (btnPressConfirmRemove.customId === 'btnreject') {
                            await btnPressConfirmRemove.update({ content: "No action was taken. You can use the `/Birthday` command to try something else after `" + cooldownTimer / 1000 + " seconds`.", ephemeral: true, components: [] });
                        }
                    }
                    else {
                        logger.info(`${interaction.user.username} NO PRESS btnPressConfirmRemove`);
                        await mainCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                    }
                }
                else if (mainCommand.customId === 'btnviewupcoming') {
                    // grab current date
                    // Somehow grab date 2 weeks from now
                    // compartmentalize it for ease and speed by grabbing current month and next month, and only checking users WITHIN THOSE MONTHS!
                    // Something-something... filter...find? all registered birthdays that land within timeframe by creating dates for each entry to compare with?
                }
                else if (mainCommand.customId === 'btnviewuser') {
                    await mainCommand.reply({ content: 'Select a member', ephemeral: true, components: [rowViewUser] });
                    interaction.deleteReply();

                    const userSelect = await mainCommand.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.UserSelect }).catch(err => { logger.error(err); });

                    if (userSelect) {
                        refreshTimeout(interaction, timeout);
                        logger.info(`${interaction.user.username} COLLECTED userSelect`);
                        // API DB QUERY GET ENTRY
                        const birthdayPerson = interaction.client._tempBirthdays.get(userSelect.users.first().id);

                        if (birthdayPerson) {
                            await mainCommand.editReply({ content: "`" + userSelect.users.first().username + "`'s birthday is on `" + Months[birthdayPerson.month].name + ' ' + birthdayPerson.day + "`", components: [] });
                        }
                        else {
                            await mainCommand.editReply({ content: "`" + userSelect.users.first().username + "` has not registered their birthday.", components: [] });
                        }
                    }
                    else {
                        logger.info(`${interaction.user.username} NO SELECT userSelect`);
                        await mainCommand.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
                    }
                }
            }
            else {
                logger.info(`${interaction.user.username} NO PRESS mainCommand`);
                await interaction.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", components: [] });
            }
            logger.info('FINAL REFRESH COOLDOWN');
            refreshTimeout(interaction, timeout);
        // cooldown
        }
    // execute
    }
};

function validateDate(month, day) {
    if (month < 10 && month.length > 1) month = month.slice(1);
    if (day < 10 && day.length > 1) day = day.slice(1);
    const data = { m: month, d: day, valid: false, error: { code: 0, msg: `Month entry ${Months[month]} is invalid.` } };
    if (Months[month]) {
        data.error.code = 1;
        data.error.msg = `Date entry ${day} is invalid for the month of ${Months[month].name}.`;
        if (day <= Months[month].days && day > 0) {
            data.valid = true;
            data.error.code = null;
            data.error.msg = '';
            return data;
        }
    }
    return data;
}

function refreshTimeout(interaction, timeout) {
    interaction.client.cooldowns.delete(interaction.user.id);
    timeout.refresh();
    interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });
}

function getTimeLeft(timeout, startTime) {
    return Math.ceil((timeout._idleTimeout / 1000) - (Date.now() - startTime) / 1000);
}
// All is working.
// Need to re-phrase all logs and maybe delete some? (using pino).
// Then just add if statements for Upcoming Birthdays and Lookup Users.
// Will need stress-testing of multiple timeout object creations.
// For Specific user, use userOption builder.
// For Upcoming Birthdays, add another button option action row: By month (then reply with down menu [then reply with results]), by fortnite (then reply with results).
// Just realized, View Birthdays would have subcommands too, such as "specific user" so use a userOptions builder, and view all birthdays for specific month.

// Add another property to user timeout object, for hits. How many hits = how many times a user has used slash command. If they are spamming, then ban temporarily for longer period.