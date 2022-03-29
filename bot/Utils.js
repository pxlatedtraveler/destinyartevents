exports.utils =
{
    checkRolePriviledge: async function(interaction, roleID) {
        const role = await interaction.guild.roles.fetch(roleID);
        const roleMembers = role.members;
        const user = interaction.user;

        if (roleMembers.has(user.id)) {
            return true;
        }
        return false;
    }
};