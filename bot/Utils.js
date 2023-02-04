const { Collection, inlineCode } = require('discord.js');
const logger = require('../util/logger.js');

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

function arrayToString(array) {
    let string = '';
    for (let i = 0; i < array.length; i++) {
        if (i < array.length - 1) {
            string += inlineCode(array[i].toString()) + ' ';
        }
        else {
            string += inlineCode(array[i].toString());
        }
    }
    return string;
}

function getTimeLeft(timeout, startTime) {
    return Math.ceil((timeout._idleTimeout / 1000) - (Date.now() - startTime) / 1000);
}

function isDaylightSavings(date) {
    if (date.getTimezoneOffset() === new Date(date.getFullYear(), 6).getTimezoneOffset()) return true;
    return false;
}

function refreshTimeout(interaction, timeout) {
    interaction.client.cooldowns.delete(interaction.user.id);
    timeout.refresh();
    interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });
}

function setCooldown(interaction, cooldownTimer) {
    logger.info('SETTING COOLDOWN');
    const timeout = setTimeout(() => {
        interaction.client.cooldowns.delete(interaction.user.id);
        logger.info('COOLDOWN DELETED IN TIMEOUT: ' + interaction.client.cooldowns);
    }, cooldownTimer);
    interaction.client.cooldowns.set(interaction.user.id, { timeout: timeout, startTime: Date.now() });
    return timeout;
}

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


module.exports = { Months, priviledgeCheck, arrayToString, getTimeLeft, isDaylightSavings, refreshTimeout, setCooldown, validateDate };