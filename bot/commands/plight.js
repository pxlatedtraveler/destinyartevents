const { SlashCommandBuilder, ActionRowBuilder, ComponentType, UserSelectMenuBuilder } = require('discord.js');
const logger = require('../../util/logger.js');

const cooldownTimer = 5000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plight')
        .setDescription('Used for testing snippets of code and techniques for when I find myself in trouble'),
/*         .addUserOption((option =>
            option.setName('finduser')
                .setDescription('Select a user')
                .setRequired(true))), THISWORKS */

    async execute(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('userselect')
                    .setPlaceholder('name#0000')
                    .setMaxValues(1)
                    .setMinValues(1)
            );

        const filter = intr => intr.user.id === interaction.user.id;
        await interaction.reply({ content: 'Choose!', components: [row] });
        const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.UserSelect }).catch(err => { logger.error(err); });

        if (mainCommand) {
            console.log(mainCommand.message.components[0]);
            const birthdayPerson = interaction.client._tempBirthdays.get(mainCommand.users.first().id);
            if (birthdayPerson) {
                mainCommand.reply({ content: "User `" + mainCommand.users.first().username + "`'s birthday is on `" + birthdayPerson.month + ' ' + birthdayPerson.day + "`", components: [] });
            }
            else {
                interaction.editReply({ content: "User `" + mainCommand.users.first().username + "` has not registered their birthday.", components: [] });

            }
        }
        else {
            logger.info('USER NO INPUT mainCommand');
            await interaction.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", ephemeral: true, components: [] });

        }
    },
};
