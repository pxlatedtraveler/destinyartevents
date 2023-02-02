const { SlashCommandBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder } = require('discord.js');
const { arrayToString } = require('../Utils');
const logger = require('../../util/logger.js');

const cooldownTimer = 5000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('case_multiselect')
        .setDescription('Working example of multiple StringSelect'),

    async execute(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .setMaxValues(3)
                    .setMinValues(2)
                    .addOptions([
                        { label: 'Option 1', description: 'Pick first option', value: 'one' },
                        { label: 'Option 2', description: 'Pick second option', value: 'two' },
                        { label: 'Option 3', description: 'Pick third option', value: 'three' },
                        { label: 'Option 4', description: 'Pick fourth option', value: 'four' },
                        { label: 'Option 5', description: 'Pick fifth option', value: 'five' },
                        { label: 'Option 6', description: 'Pick sixth option', value: 'six' },
                    ])
            );

        const filter = intr => intr.user.id === interaction.user.id;
        await interaction.reply({ content: 'Choose at least two, and up to three options!', components: [row] });
        const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.SelectMenu }).catch(err => { logger.error(err); });

        if (mainCommand) {
            console.log(mainCommand.values);
            const changeValues = mainCommand.values;
            if (changeValues) {
                mainCommand.reply({ content: `Selected: ${arrayToString(changeValues)}`, components: [] });
            }
            else {
                interaction.editReply({ content: 'No selections were made.', components: [] });

            }
        }
        else {
            logger.info('USER NO SELECT mainCommand');
            await interaction.editReply({ content: "Interaction expired. Try again after `" + cooldownTimer / 1000 + " seconds`.", ephemeral: true, components: [] });

        }
    },
};
