const { Collection } = require('discord.js');

async function priviledgeCheck(interaction, roleNames) {
    await interaction.guild.members.fetch();
    const guildRoles = await interaction.guild.roles.fetch();
    let roles = new Collection();
    for (let i = 0; i < roleNames.length; i++) {
        const role = await guildRoles.find(r => r.name === roleNames[i]);
        roles = roles.concat(role.members);
    }
    return roles;
}

module.exports = { priviledgeCheck };