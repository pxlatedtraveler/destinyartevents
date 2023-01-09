const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const Months = {
    '01': { id: '01', name: 'January', days: 31 },
    '02': { id: '02', name: 'February', days: 29 },
    '03': { id: '03', name: 'March', days: 31 },
    '04': { id: '04', name: 'April', days: 30 },
    '05': { id: '05', name: 'May', days: 31 },
    '06': { id: '06', name: 'June', days: 30 },
    '07': { id: '07', name: 'July', days: 31 },
    '08': { id: '08', name: 'August', days: 31 },
    '09': { id: '09', name: 'September', days: 30 },
    '10': { id: '10', name: 'October', days: 31 },
    '11': { id: '11', name: 'November', days: 30 },
    '12': { id: '12', name: 'December', days: 31 }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Add or Manage your birthday.'),

    async execute(interaction) {

        /*         if (interaction.options.getSubCommand() === 'setbirthday') {
            // refer to https://discordjs.guide/slash-commands/parsing-options.html#subcommands
        }
        else if (interaction.options.getSubCommand() === 'getbirthday') {

        }
        else if (interaction.options.getSubCommand() === 'removebirthday') {

        } */
        console.log('CREATING COMPONENTS');

        const modal = new ModalBuilder()
        .setCustomId('birthdaymodal')
        .setTitle('Register your birthday');

            const rowMonth = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('textinputmonth')
                    .setLabel('Input month (ex: 01)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(2)
                    .setRequired(true)
            );
            const rowDay = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('textinputday')
                    .setLabel('Input day (ex: 09)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(2)
                    .setRequired(true)
            );

            modal.addComponents(rowMonth, rowDay);

            const rowVerify = new ActionRowBuilder()
                .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btnconfirm')
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('btnreject')
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger)
                );

        await interaction.showModal(modal);

        const filter = intr => intr.user.id === interaction.user.id;
        const modalSubmit = await interaction.awaitModalSubmit({ time: 10000, filter })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });

        if (modalSubmit) {
            let birthMonth;
            let birthDay;
            // let valid = false;
            console.log(`Collected Modal: ${modalSubmit.user.username}`);
            for (const [key, value] of modalSubmit.fields.fields) {
                if (key === 'textinputmonth') birthMonth = value.value;
                else if (key === 'textinputday') birthDay = value.value;
            }
            const validDate = validateDate(birthMonth, birthDay);
            if (validDate.valid) {
                // valid = true;
                await modalSubmit.reply({ content: `You entered ${Months[birthMonth].name} ${birthDay}. Is this correct?`, ephemeral: true, components: [rowVerify] })
                .catch(error => {
                    console.log(error);
                    return null;
                });
            }
            else {
                if (validDate.error.code === 1) {
                    await modalSubmit.reply({ content: `The month entered, ${birthMonth} is not valid.`, ephemeral: true })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });
                }
                else if (validDate.error.code === 2) {
                    await modalSubmit.reply({ content: `The day entered, ${birthDay} is invalid for the month of ${Months[birthMonth].name}.`, ephemeral: true })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });
                }
            }
            console.log('Waiting for Collector');
            const btnPress = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.Button })
            .catch(error => {
                console.log(error);
                return null;
            });

            if (btnPress) {
                console.log('Collected Verify', btnPress.customId);
                if (btnPress.customId === 'btnconfirm') {
                    // submit data to database and defer reply cause API may take longer.
                    await btnPress.update({ content: `${btnPress.user.username}'s birthday successfully recorded. You may dismiss this message.`, components: [] })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });
                    await btnPress.followUp({ content: `User ${btnPress.user.username} registered their birthday!`, ephemeral: false })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });
                }
                else if (btnPress.customId === 'btnreject') {
                    await btnPress.update({ content: 'Use Birthday command to try again.', ephemeral: true, components: [] })
                    .catch(error => {
                        console.log(error);
                        return null;
                    });
                }
            }
            else {
                console.log('User No Press!');
            }
        }
    // execute
    }
};

function validateDate(month, day) {
    const data = { valid: false, error: { code: 1, msg:`Month entry ${Months[month]} is invalid.` } };
    if (Months[month]) {
        data.error.code = 2;
        data.error.msg = `Month entry ${Months[month]} (${Months[month].name}) is valid month. Date ${day} is invalid for that month.`;
        if (day <= Months[month].days) {
            data.valid = true;
            data.error.code = 0;
            data.error.msg = '';
            return data;
        }
    }
    return data;
}

// Add slash command cooldown.
// Add code block text formatting to input and user elements in messages sent. Will have to reformat messages to use double quotes.
// Either utilize subcommands, OR create another button menu to split Birthday commands to "Register Birthday", "View Birthdays", and "Remove Birthday".
// Just realized, View Birthdays would have subcommands too, such as "specific user" so use a userOptions builder, and view all birthdays for specific month.