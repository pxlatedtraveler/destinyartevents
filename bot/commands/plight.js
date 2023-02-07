const { SlashCommandBuilder, ActionRowBuilder, ComponentType, RoleSelectMenuBuilder } = require('discord.js');
// const { arrayToString } = require('../Utils');
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
                            new RoleSelectMenuBuilder()
                                .setCustomId('roleselect')
                                .setPlaceholder('role')
                                .setMaxValues(1)
                                .setMinValues(1)
                        );

                    const filter = intr => intr.user.id === interaction.user.id;
                    await interaction.reply({ content: 'Choose!', components: [row] });
                    const mainCommand = await interaction.channel.awaitMessageComponent({ time: 10000, filter, ComponentType: ComponentType.RoleSelect }).catch(err => { logger.error(err); });

                    if (mainCommand) {
                        const roleId = mainCommand.values;
                        const guildRoles = await interaction.guild.roles.fetch();
                        const role = await guildRoles.get(roleId.find(e => e !== undefined));
                        if (role) {
                            mainCommand.reply({ content: `Selected: ${role.name}`, components: [] });
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
