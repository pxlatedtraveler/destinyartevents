const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

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
            console.log('SETTING COOLDOWN');
            const timeout = setTimeout(() => {
                interaction.client.cooldowns.delete(interaction.user.id);
                console.log('COOLDOWN DELETED IN TIMEOUT: ', interaction.client.cooldowns);
            }, interaction.client.cooldownTime);
            interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });

            console.log('CREATING COMPONENTS');

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

            const filter = intr => intr.user.id === interaction.user.id;
            const test = false;
            test ? rowMain.addComponents(removeBirthday, viewUpcoming, lookupUser) : rowMain.addComponents(addBirthday, viewUpcoming, lookupUser);

            await interaction.reply({ content: 'Select an action to perform.', ephemeral: true, components: [rowMain] });
            await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button })
                .then(async (command) => {
                    refreshTimeout(interaction, timeout);
                    console.log(interaction.user.username, ' Collected Command', command.customId);
                    if (command.customId === 'btnaddbirthday') {
                        await command.showModal(modal);
                        await command.editReply({ content: 'Waiting for reply.', components: [] });
                        const modalSubmit = await interaction.awaitModalSubmit({ time: 10000, filter });
                        if (modalSubmit) {
                            refreshTimeout(interaction, timeout);
                            let birthMonth;
                            let birthDay;
                            console.log(`Collected Modal: ${modalSubmit.user.username}`);
                            birthMonth = modalSubmit.fields.getTextInputValue('textinputmonth');
                            birthDay = modalSubmit.fields.getTextInputValue('textinputday');
                            const validDate = validateDate(birthMonth, birthDay);
                            if (validDate.valid) {
                                birthMonth = validDate.m;
                                birthDay = validDate.d;
                                await modalSubmit.reply({ content: "You entered `" + Months[birthMonth].name + ' ' + birthDay + "`. Is this correct?", ephemeral: true, components: [rowVerify] });
                                command.deleteReply();
                                console.log('Waiting for Collector btnPress');
                                await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button })
                                    .then(async (btnPress) => {
                                        refreshTimeout(interaction, timeout);
                                        console.log('Collected Verify', btnPress.customId);
                                        if (btnPress.customId === 'btnconfirm') {
                                            await btnPress.update({ content: "`" + btnPress.user.username + "`'s birthday successfully recorded. You may dismiss this message.", components: [] })
                                                .then((btnPress_del_i) => { setTimeout(() => { btnPress_del_i.interaction.deleteReply();}, 3000); });
                                            await btnPress.followUp({ content: btnPress.user.toString() + " registered their birthday!", ephemeral: false });
                                        }
                                        else if (btnPress.customId === 'btnreject') {
                                            await btnPress.update({ content: "Use the `/Birthday` command to try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                                        }
                                    })
                                    .catch(async err => {
                                        console.log('User No Press btnPress!', err);
                                        if (err.code === 'InteractionCollectorError') {
                                            await modalSubmit.editReply({ content: "Interaction expired. Try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                                        }
                                    });
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
                            console.log('User No Submit');
                            await command.editReply({ content: "Interaction expired. Try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true });
                        }
                    }
                    else if (command.customId === 'btnremovebirthday') {
                        await command.update({ content: 'Are you sure you want to remove your birthday?', ephemeral: true, components: [rowVerify] });
                        console.log('Waiting for Collector');
                        const btnPressConfirmRemove = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button });
                        if (btnPressConfirmRemove) {
                            refreshTimeout(interaction, timeout);
                            console.log('Collected Verify', btnPressConfirmRemove.customId);
                            if (btnPressConfirmRemove.customId === 'btnconfirm') {
                                await btnPressConfirmRemove.update({ content: "`" + btnPressConfirmRemove.user.username + "`'s birthday successfully removed. You may dismiss this message.", components: [] })
                                    .then((btnPressConfirmRemove_i) => { setTimeout(() => { btnPressConfirmRemove_i.interaction.deleteReply(); }, 3000); });
                                await btnPressConfirmRemove.followUp({ content: btnPressConfirmRemove.user.toString() + " removed their birthday.", ephemeral: false });
                            }
                            else if (btnPressConfirmRemove.customId === 'btnreject') {
                                await btnPressConfirmRemove.update({ content: "No action was taken. You can use the `/Birthday` command to try something else after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                            }
                        }
                        else {
                            console.log('User No Press btnPressConfirmRemove');
                            await command.editReply({ content: "Interaction expired. Try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                        }
                    }
                })
                .catch(async (err) => {
                    console.log('User No Press command', err);
                    if (err.code === 'InteractionCollectorError') {
                        await interaction.editReply({ content: "Interaction expired. Try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                    }
                    else {
                        console.log('Not a collection error:', err.code);
                        await interaction.editReply({ content: "An error occured. Try again after `" + interaction.client.cooldownTime / 1000 + " seconds`.", ephemeral: true, components: [] });
                    }

                });
            console.log('FINAL REFRESH COOLDOWN');
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
        if (day <= Months[month].days) {
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
    // console.log('COOLDOWN DELETED IN FUNCTION: ', interaction.client.cooldowns);
    interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });
    // console.log('ADDED IN FUNCTION: ', interaction.client.cooldowns);
}

function getTimeLeft(timeout, startTime) {
    return Math.ceil((timeout._idleTimeout / 1000) - (Date.now() - startTime) / 1000);
}
// Test all scenarios to view all messages.
// Will need stress-testing of multiple timeout object creations.
// Either utilize subcommands, OR create another button menu to split Birthday commands to "Register Birthday", "View Birthdays", and "Remove Birthday".
// Just realized, View Birthdays would have subcommands too, such as "specific user" so use a userOptions builder, and view all birthdays for specific month.