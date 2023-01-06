const { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, InteractionCollector, ComponentType } = require('discord.js');

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

let birthMonth;
let birthDay;

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
                    .setLabel('Input month')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(2)
                    .setMaxLength(2)
                    .setRequired(true)
            );
            const rowDay = new ActionRowBuilder()
            .addComponents(
                new TextInputBuilder()
                    .setCustomId('textinputday')
                    .setLabel('Input day')
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
        const modalCollector = new InteractionCollector(interaction.client, { filter, componentType: ComponentType.ModalSubmit, time: 10000, max: 1 });
        modalCollector.on('collect', (i) => {
            console.log('Collected Modal');
            for (const [key, value] of i.fields.fields) {
                if (key === 'textinputmonth') birthMonth = value.value;
                else if (key === 'textinputday') birthDay = value.value;
            }
            i.reply({ content: `You entered ${Months[birthMonth].name} ${birthDay}. Is this correct?`, ephemeral: true, components: [rowVerify] });
        });
        modalCollector.on('end', (i) => {
            const btnMsg = i.get(i.keys().next().value);
            const verifyCollector = new InteractionCollector(interaction.client, { filter, componentType: ComponentType.Button, time: 10000 });
            verifyCollector.on('collect', (vi) => {
                console.log('Collected Verify', vi.customId);
                if (vi.customId === 'btnconfirm') {
                    btnMsg.editReply({ content: 'ok', components: [] });
                    vi.reply({ content: `${vi.user.username}'s birthday successfully recorded.`, components: [] });
                }
                else if (vi.customId === 'btnreject') {
                    btnMsg.editReply({ content: 'ok', components: [] });
                    vi.reply({ content: 'Use Birthday command to try again.', ephemeral: true, components: [] });
                }
            });
            verifyCollector.on('end', () => { console.log('Verify Ended'); });
        });
    }
};

// TODO: Lots of verification for input data. See if you can create your own validations using discord's interface like it's native API does for some components.
// Learn what the difference is between editReply() and update() and why the latter doesn't work.
// Either delete the button reply message after button is clicked, or edit it while only sending a signatl to discord client that interaction was replied to.
// Either utilize subcommands, OR create another button menu to split Birthday commands to "Register Birthday", "View Birthdays", and "Remove Birthday".
// Just realized, View Birthdays would have subcommands too, such as "specific user" so use a userOptions builder, and view all birthdays for specific month.