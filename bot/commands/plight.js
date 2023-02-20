const { SlashCommandBuilder } = require('discord.js');
const { createModalTextInputs } = require('../Utils');
const logger = require('../../util/logger.js');

// const cooldownTimer = 5000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('plight')
        .setDescription('Used for testing snippets of code and techniques for when I find myself in trouble'),
/*         .addUserOption((option =>
            option.setName('finduser')
                .setDescription('Select a user')
                .setRequired(true))), THISWORKS */

                async execute(interaction) {

                    const modal = createModalTextInputs('modalid', 'Modal Title', { rows: 5, id: 'textinput_', label: 'Text Input Label ', style: 'short', min: 1, max: 45, required: true });

                    const filter = intr => intr.user.id === interaction.user.id;
                    await interaction.showModal(modal);
                    const mainCommand = await interaction.awaitModalSubmit({ time: 100000, filter, max: 1 }).catch(err => { logger.error(err); });

                    if (mainCommand) {
                        const fields = mainCommand.fields.fields.map(e => e.value);
                        if (fields.length > 0) {
                            mainCommand.reply({ content: `Added: ${fields.length} fields`, components: [] });
                        }
                        else {
                            interaction.editReply({ content: 'No fields were added.', components: [] });

                        }
                    }
                    else {
                        await interaction.editReply({ content: 'Interaction expired', ephemeral: true, components: [] });

                    }
                },
};