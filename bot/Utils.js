const { Collection, inlineCode, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
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

function arrayToString(array, inline, styling) {
    let string = '';
    for (let i = 0; i < array.length; i++) {
        if (inline) {
            if (i < array.length - 1) {
                string += inlineCode(array[i].toString()) + styling;
            }
            else {
                string += inlineCode(array[i].toString());
            }
        }
        else {
            if (i < array.length - 1) {
                string += array[i].toString() + styling;
            }
            else {
                string += array[i].toString();
            }
        }

    }
    return string;
}

/**
 * @param {string} id id of the modal
 * @param {string} title title of modal
 * @param {string} config.id id of the inputBox before iteration
 * @param {Object} config.label the label of the input box
 * @param {number} config.max maximum characters allowed
 * @param {number} config.min minimum characters required
 * @param {boolean} config.required true if input is required
 * @param {number} config.rows the number of inputs to create
 * @param {TextInputStyle | string} config.style the style of input box
 */
function createModalTextInputs(id, title, config) {
    const modal = new ModalBuilder()
    .setCustomId(id)
    .setTitle(title);
    console.log('base modal created: ', modal);
    for (let i = 0; i < config.rows; i++) {
        modal.addComponents(
            new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                        .setCustomId(config.id + i)
                        .setLabel(config.label + i)
                )
        );
        const textInputId = config.id + i;
        const textInput = getModalComponentById(modal, textInputId);
        if (config.style === 'short') textInput.setStyle(TextInputStyle.Short);
        if (config.style === 'paragraph') textInput.setStyle(TextInputStyle.Paragraph);
        if (config.min) textInput.setMinLength(config.min);
        if (config.max) textInput.setMaxLength(config.max);
        if (config.required) textInput.setRequired(config.required);
    }
    return modal;
}

/**
 * @param {MessageComponentInteraction} msg The interaction returned after user interacts
 * @returns {[ActionRow]} an array of ActionRows or empty array
 */
 function getMessageComponents(msg) {
    return msg.message.components;
}

/**
 * @param {MessageComponentInteraction} msg The interaction returned after user interacts
 * @returns {Component} or undefined if no matching id found
 */
function getMessageComponentById(msg, id) {
    const rows = getMessageComponents(msg);
    const rowWithId = rows.find(e => e.customId === id);
    if (rowWithId) return rowWithId;
    for (let i = 0; i < rows.length; i++) {
        const rowComponents = rows[i].components;
        const childWithId = rowComponents.find(e => e.customId === id);
        if (childWithId) return childWithId;
    }
    return undefined;
}

function getMessageFirstComponent(msg) {
    const rows = getMessageComponents(msg);
    return rows[0].components[0];
}

function getModalComponentById(modal, id) {
    for (let i = 0; i < modal.components.length; i++) {
        const childWithId = modal.components[i].components.find(e => e.data.custom_id === id);
        if (childWithId) return childWithId;
    }
    return;
}

function getTimeLeft(timeout, startTime) {
    return Math.ceil((timeout._idleTimeout / 1000) - (Date.now() - startTime) / 1000);
}

/**
 * https://help.bungie.net/hc/en-us/articles/360049199911-Destiny-2-Ritual-Reset-Guide
 * @param {Date} date a date object to pass that will be checked against an active daylight savings date, July 1
 * @returns {boolean}
 */
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

function validateMonthDay(month, day) {
    if (month < 10 && month.length > 1) month = month.slice(1);
    if (day < 10 && day.length > 1) day = day.slice(1);
    const data = { m: month, d: day, valid: false, error: { code: 0, msg: `Month entry ${month} is invalid.` } };
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


module.exports = { Months, priviledgeCheck, arrayToString, createModalTextInputs, getMessageComponents, getMessageComponentById, getMessageFirstComponent, getModalComponentById, getTimeLeft, isDaylightSavings, refreshTimeout, setCooldown, validateMonthDay };