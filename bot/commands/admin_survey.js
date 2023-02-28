const { SlashCommandBuilder, ActionRowBuilder, ComponentType, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Months, createModalTextInputs, getTimeLeft, priviledgeCheck, refreshTimeout, setCooldown, validateMonthDay } = require('../Utils');
const logger = require('../../util/logger.js');
const { EmbedBuilder } = require('@discordjs/builders');

const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 5000;

const selectTime = 300000;

const modalTime = 600000;

class Question {
    constructor(label, style, min, max, required) {
        this.label = label;
        this.style = style;
        this.min = min;
        this.max = max;
        this.required = required;
    }
}

class SurveyBuilder {
    constructor(id, name, questions) {
        this.id = id;
        this.name = name;
        this.questions = [];

        for (let i = 0; i < questions.length; i++) {
            this.questions[i] = new Question(
                questions[i],
                TextInputStyle.Paragraph,
                null,
                4000,
                false);
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin-survey')
        .setDescription('Working example of multiple editable modals'),

    async execute(interaction) {

        if (interaction.client.cooldowns.has(interaction.user.id)) {
            const userTimeout = interaction.client.cooldowns.get(interaction.user.id);
            await interaction.reply({ content: "You've used this command recently. Try again after `" + getTimeLeft(userTimeout.timeout, userTimeout.startTime) + " seconds`.", ephemeral: true });
        }
        else {
            const timeout = setCooldown(interaction, cooldownTimer);

            const priviledge = await priviledgeCheck(interaction, permittedRoles);

            if (priviledge.has(interaction.user.id)) {

                const rowVerify = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btnconfirm')
                            .setLabel('Yes')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('btnreject')
                            .setLabel('No')
                            .setStyle(ButtonStyle.Danger)
                    );

                const modalName = new ModalBuilder()
                    .setCustomId('modalname')
                    .setTitle('Type in Survey id');

                const modalDate = new ModalBuilder()
                    .setCustomId('modaldate')
                    .setTitle('Type in Date ranges');

                const textInputYear = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputyear').setLabel('Start year').setStyle(TextInputStyle.Short)
                            .setMinLength(4).setMaxLength(4).setRequired(true)
                    );
                const textInputStartMonth = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputstartmonth').setLabel('Start month').setStyle(TextInputStyle.Short)
                            .setMinLength(1).setMaxLength(2).setRequired(true)
                    );
                const textInputStartDay = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputstartday').setLabel('Start day').setStyle(TextInputStyle.Short)
                            .setMinLength(1).setMaxLength(2).setRequired(true)
                    );
                const textInputEndMonth = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputendmonth').setLabel('End month').setStyle(TextInputStyle.Short)
                            .setMaxLength(2).setRequired(false)
                    );
                const textInputEndDay = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputendday').setLabel('End month').setStyle(TextInputStyle.Short)
                            .setMaxLength(2).setRequired(false)
                    );
                    // logic will be that end date month and day are not required. Check if string length is empty. If so, set survey to never end.
                    // If there is a valid date, and it is later than start date, set it.
                    // Will need a kill-button to actually stop an infinite survey. A button that will show up when editing active and unstarted surveys.
                    // Actually, add a pause button too that will be replaced with resume button too.
                    // Unpublished survey (any): Edit > ID, Name, Questions, Start, End
                    // Published limited: Edit > End, Pause/Resume
                    // Published Unlimited: Edit > Pause/Resume, Archive

                const textInputId = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputid')
                            .setLabel('Id (ie: fall2023)')
                            .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(25).setRequired(true)
                    );

                const textInputName = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputname')
                            .setLabel('Name (ie: Fall 2023)')
                            .setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(50).setRequired(true)
                    );

                const rowMain = new ActionRowBuilder();

                const buttonCreate = new ButtonBuilder()
                    .setCustomId('btncreate')
                    .setLabel('Create Survey')
                    .setStyle(ButtonStyle.Success);
                const buttonEdit = new ButtonBuilder()
                    .setCustomId('btnedit')
                    .setLabel('Edit Survey')
                    .setStyle(ButtonStyle.Primary);
                const buttonDelete = new ButtonBuilder()
                    .setCustomId('btndelete')
                    .setLabel('Delete Survey')
                    .setStyle(ButtonStyle.Danger);
                const buttonCancel = new ButtonBuilder()
                    .setCustomId('btncancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger);

                // API DB QUERY GET ENTRY, CHECK IF OBJ EXISTS
                interaction.client._tempSurvey.size > 0 ? rowMain.addComponents(buttonCreate, buttonEdit, buttonDelete, buttonCancel) : rowMain.addComponents(buttonCreate, buttonCancel);
                const filter = intr => intr.user.id === interaction.user.id;

                await interaction.reply({ content: 'Select an action to perform.', components: [rowMain] });

                const buttonReply = await interaction.channel.awaitMessageComponent({ time: selectTime, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error(err); });

                if (buttonReply) {
                    refreshTimeout(interaction, timeout);

                    if (buttonReply.customId === 'btncreate') {

                        modalName.setTitle('Input Survey Id and Name').addComponents(textInputId, textInputName);
                        textInputEndMonth.components[0].setLabel('End month (Leave blank if endless)');
                        textInputEndDay.components[0].setLabel('End day (Leave blank if endless)');
                        modalDate.setTitle('Set a Start and End date').addComponents(textInputYear, textInputStartMonth, textInputStartDay, textInputEndMonth, textInputEndDay);

                        const dateResults = await loopModalValidation(buttonReply, modalDate, filter, validateSurveyDates);
                        if (dateResults.submitted) {
                            console.log('Date Submitted!: ', dateResults.submitted);
                            const questionResults = await loopEditableModal(dateResults.interactions[dateResults.counter], modalName, filter).catch(err => { logger.error('loopEditableModal create survey ' + err); });

                            if (questionResults.submitted) {
                                const surveyId = questionResults.answers[0];
                                const surveyName = questionResults.answers[1];
                                const surveyQuestions = questionResults.answers.splice(2);

                                const survey = new SurveyBuilder(surveyId, surveyName, surveyQuestions);
                                interaction.client._tempSurvey.set(survey.id, survey);
                                await questionResults.interactions[questionResults.counter].update({ embeds: [], content: `Questions created!`, components: [] }).catch(err => { logger.error('buttonVerify ' + questionResults.counter + ' submit ' + err); });
                            }
                            else {
                                console.error('Failed getting questions');
                            }
                        }
                        else {
                            console.error('Failed getting dates');
                        }
                    }


                    else if (buttonReply.customId === 'btnedit') {
                        modalName.setTitle('Input survey Id').addComponents(textInputId);
                        await buttonReply.showModal(modalName);
                        await buttonReply.editReply({ content: 'Awaiting Submit', components: [] });
                        const modalReply = await buttonReply.awaitModalSubmit({ time: modalTime, filter, max: 1 }).catch(err => { logger.error('btnedit modalreply', err); });
                        if (modalReply) {
                            refreshTimeout(interaction, timeout);
                            const surveyName = modalReply.fields.getTextInputValue('textinputid');
                            const survey = interaction.client._tempSurvey.get(surveyName);
                            if (survey) {
                                await modalReply.update({ content: `Editing survey ${survey.name}. Proceed?`, components: [rowVerify] });
                                const buttonVerify = await interaction.channel.awaitMessageComponent({ time: selectTime, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error('btnedit buttonVerify', err); });

                                if (buttonVerify) {
                                    if (buttonVerify.customId === 'btnconfirm') {
                                        // Can edit name, id, questions, start date, end date
                                        // SEND ACTIONROW WITH MULTI SELECT MENU
                                        await buttonVerify.update({ content: 'TODO - EDIT SURVEY', components: [] });
                                    }
                                    else if (buttonVerify.customId === 'btnreject') {
                                        await buttonVerify.update({ content: 'Interaction canceled. You can dismiss this message.', components: [] });
                                    }
                                }
                                else {
                                    await modalReply.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
                                }

                            }
                            else {
                                await modalReply.update({ content: 'No survey exists by that Id', components: [] });
                            }
                        }
                        else {
                            await buttonReply.editReply({ content: 'No form submitted on time.', ephemeral: true, components: [] });
                        }
                    }

                    else if (buttonReply.customId === 'btndelete') {
                        await buttonReply.showModal(modalName);
                        await buttonReply.editReply({ content: 'Awaiting Submit', components: [] });
                        const modalReply = await buttonReply.awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('btnpublish modalreply', err); });
                        if (modalReply) {
                            refreshTimeout(interaction, timeout);
                            const surveyName = modalReply.fields.getTextInputValue('textinputid');
                            const survey = interaction.client._tempSurvey.get(surveyName);
                            if (survey) {
                                await modalReply.update({ content: `Deleting survey ${survey.name}. Proceed?`, components: [rowVerify] });
                                const buttonVerify = await interaction.channel.awaitMessageComponent({ time: selectTime, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error('btndelete buttonVerify', err); });

                                if (buttonVerify) {
                                    if (buttonVerify.customId === 'btnconfirm') {
                                        interaction.client._tempSurvey.delete(surveyName);
                                        await buttonVerify.update({ content: `Survey ${survey.name} deleted. You can dismiss this message.`, components: [] });
                                    }
                                    else if (buttonVerify.customId === 'btnreject') {
                                        await buttonVerify.update({ content: 'Interaction canceled. You can dismiss this message.', components: [] });
                                    }
                                }
                                else {
                                    await modalReply.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
                                }

                            }
                            else {
                                await modalReply.update({ content: 'No survey exists by that Id', components: [] });
                            }
                        }
                        else {
                            await buttonReply.editReply({ content: 'No form submitted on time.', ephemeral: true, components: [] });
                        }
                    }


                    else if (buttonReply.customId === 'btncancel') {
                        refreshTimeout(interaction, timeout);
                        buttonReply.update({ content: 'Interaction canceled. You can dismiss this message.', components: [] });
                    }
                }
                else {
                    await interaction.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });

                }
            }
        }
    },
};

/**
 * To be used after collecting a modalSubmit
 * @param {MessageComponentInteraction} interaction Starts off the chain of looping interactions
 * @param {ModalBuilder} modal Optional modal that could be fed before dynamically created modals
 * @param {callbackFunction} filter filter to use when awaiting message
 * @param {callbackFunction} validator optional, used to validate user input
 * @returns {Object} message reply or void
 */
async function loopEditableModal(interaction, modal, filter) {
    const data = {};
    const rowReview = new ActionRowBuilder();
    const buttonNext = new ButtonBuilder()
        .setCustomId('btnnext')
        .setLabel('Next Page')
        .setStyle(ButtonStyle.Primary);
    const buttonEdit = new ButtonBuilder()
        .setCustomId('btnedit')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary);
    const buttonSubmit = new ButtonBuilder()
        .setCustomId('btnsbmt')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);
    const buttonCancel = new ButtonBuilder()
        .setCustomId('btncncl')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

    const requiredLength = 3;
    data.interactions = [interaction];
    let iCounter = data.interactions.length - 1;

    const modals = [modal];
    let mCounter = modals.length - 1;

    const answers = [];
    const embeds = [];

    let offset = 0;
    let editing = false;
    let canceled = false;
    let submitted = false;

    while (!canceled && !submitted) {
        offset = 0;
        for (let i = mCounter; i > 0; i--) {
            offset += answers[i - 1].ans.length;
        }

        if (!modals[mCounter]) {
            modals[mCounter] = createModalTextInputs('modal_' + mCounter, 'Page ' + (mCounter + 1), { rows: 5, id: 'textinputid_', label: 'Field ', style: 'short', max: 45, required: false });
        }
        else {
            if (editing) {
                for (let i = 0; i < modals[mCounter].components.length; i++) {
                    modals[mCounter].components[i].components[0].setValue(answers[mCounter].ans[i]);
                }
            }
        }

        await data.interactions[iCounter].showModal(modals[mCounter]).catch(err => { logger.error('interaction + ' + iCounter + 'showModal' + err); });
        await data.interactions[iCounter].editReply({ components: [] }).catch(err => { logger.error('interaction + ' + iCounter + 'editReply' + err); });

        const modalSubmit = await data.interactions[iCounter].awaitModalSubmit({ time: modalTime, filter, max: 1 }).catch(err => { logger.error('modalSubmit' + (iCounter + 1), err); });

        if (modalSubmit) {

            answers[mCounter] = { ans: modalSubmit.fields.fields.map(e => e.value) };
            answers[mCounter].ans = answers[mCounter].ans.filter(e => e.length > 0);
            if (answers[mCounter].ans.length > 0) {
                rowReview.setComponents(buttonNext, buttonEdit);
                if ((offset + answers[mCounter].ans.length) >= requiredLength) {
                    rowReview.addComponents(buttonSubmit);
                }

                rowReview.addComponents(buttonCancel);

                if (!embeds[mCounter]) {
                    embeds[mCounter] = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Review Page ' + (mCounter + 1))
                        .setDescription('Review, edit, or submit.');
                }
                else {
                    embeds[mCounter].data.fields = [];
                }

                for (let i = 0; i < 5; i++) {
                    if (answers[mCounter].ans[i]) {
                        embeds[mCounter].addFields({ name: 'Field: ' + (i + offset + 1), value: answers[mCounter].ans[i] });
                    }
                }
            }
            else {
                rowReview.setComponents(buttonEdit, buttonCancel);
                if (!embeds[mCounter]) {
                    embeds[mCounter] = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle('Review Page ' + (mCounter + 1))
                        .setDescription('Please include at least one field.');
                }
                else {
                    embeds[mCounter].data.fields = [];
                }
            }
            rowReview.components.forEach(ele => {
                // Below code is very specific with name... try to simplefy more
                ele.setCustomId(ele.data.custom_id.slice(0, 7) + '_' + iCounter);
            });

            await modalSubmit.update({ embeds: [embeds[mCounter]], content: 'Review your questions.', components: [rowReview] }).catch(err => { logger.error('modalSubmit ' + mCounter + 'buttonVerify ' + (iCounter + 1) + err); });
            const buttonVerify = await modalSubmit.channel.awaitMessageComponent({ time: selectTime, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('buttonVerify ' + (iCounter + 1), err); });

            if (buttonVerify) {
                data.interactions.push(buttonVerify);
                // these customId conditions are also very specific and rely on previous specific comment above
                if (buttonVerify.customId === 'btnnext_' + iCounter) {
                    editing = false;
                    mCounter++;
                    iCounter++;
                }
                else if (buttonVerify.customId === 'btnedit_' + iCounter) {
                    editing = true;
                    iCounter++;
                }
                else if (buttonVerify.customId === 'btnsbmt_' + iCounter) {
                    submitted = true;
                    iCounter++;
                    // await buttonVerify.update({ embeds: [], content: `Questions created!`, components: [] }).catch(err => { logger.error('buttonVerify ' + iCounter + ' submit ' + err); });
                }
                else if (buttonVerify.customId === 'btncncl_' + iCounter) {
                    canceled = true;
                    await buttonVerify.update({ embeds: [], content: 'Interaction canceled. You can dismiss this message.', components: [] }).catch(err => { logger.error('buttonVerify ' + iCounter + ' cancel ' + err); });
                }
            }
            else {
                await modalSubmit.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
                canceled = true;
            }
        }
    }

    if (submitted) {
        data.submitted = true;
        data.counter = iCounter;
        data.answers = [];
        for (let i = 0; i < answers.length; i++) {
            if (answers[i].ans.length > 0) {
                data.answers = data.answers.concat(answers[i].ans);
            }
        }
        console.log('Data: ', data);
        return data;
    }
    return;
}

async function loopModalValidation(interaction, modal, filter, validator) {
    const data = {};
    const rowReview = new ActionRowBuilder();
    const buttonEdit = new ButtonBuilder()
        .setCustomId('btnedit')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary);
    const buttonSubmit = new ButtonBuilder()
        .setCustomId('btnsbmt')
        .setLabel('Submit')
        .setStyle(ButtonStyle.Success);
    const buttonCancel = new ButtonBuilder()
        .setCustomId('btncncl')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);
    data.interactions = [interaction];
    let iCounter = data.interactions.length - 1;
    let answers = [];
    let rawAnswers = [];
    let editing = false;
    let canceled = false;
    data.submitted = false;

    let fields = [];
    for (let i = 0; i < modal.components.length; i++) {
        fields[i] = modal.components[i].components[0].data.label;
        console.log('Modal Fields (for embed): ', fields[i]);
    }

    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Review Information')
        .setDescription('Review, edit, or submit.');

    while (!canceled && !data.submitted) {
        embed.setFields();
        if (editing) {
            for (let i = 0; i < modal.components.length; i++) {
                modal.components[i].components[0].setValue(rawAnswers[i]);
            }
        }
        await data.interactions[iCounter].showModal(modal);
        const modalSubmit = await data.interactions[iCounter].awaitModalSubmit({ time: modalTime, filter, max: 1 }).catch(err => logger.error('loopModalValidation modalSubmit ' + err));
        if (modalSubmit) {
            if (validator) {
                const results = validator(modalSubmit);
                if (results.valid) {
                    data.validatedData = results;
                    answers = results.answers;
                    rawAnswers = answers;
                    rowReview.setComponents(buttonSubmit, buttonEdit, buttonCancel);
                    console.log('dates valid!');
                    // Here, check if there's a fields property. If not, leave as is. An object with arrays.
                    if (results.format) {
                        fields = results.format.fields;
                        answers = results.format.answers;
                        if (results.format.description) embed.setDescription(results.format.description);
                    }
                }
                else {
                    embed.setDescription('You have errors. Please edit or cancel.');
                    embed.addFields({ name: 'Errors:', value: results.error.msg, inline: false });
                    embed.addFields({ name: '--------------------', value: ' ', inline: false });
                    answers = modalSubmit.fields.fields.map(e => e.value);
                    rawAnswers = answers;
                    rowReview.setComponents(buttonEdit, buttonCancel);
                    console.log('dates invalid!');
                }
            }
            else {
                answers = modalSubmit.fields.fields.map(e => e.value);
                rawAnswers = answers;
                rowReview.setComponents(buttonSubmit, buttonEdit, buttonCancel);
                console.log('no validation needed!');
            }

            answers = answers.filter(e => e.length > 0);
            if (answers.length > 0) {
                if (!validator) embed.setDescription('Review, edit, or submit.');
                for (let i = 0; i < answers.length; i++) {
                    console.warn('answers: ', answers);
                    embed.addFields({ name: fields[i], value: answers[i] });
                }
            }
            else {
                if (!validator) embed.setDescription('No inputs. Hit submit to skip this section.');
            }

            await modalSubmit.update({ embeds: [embed], content: 'Review your replies.', components: [rowReview] });
            const buttonVerify = await modalSubmit.channel.awaitMessageComponent({ time: selectTime, filter, ComponentType: ComponentType.Button }).catch(err => logger.error('loopModalValidation buttonVerify ' + err));

            if (buttonVerify) {
                data.interactions.push(buttonVerify);
                if (buttonVerify.customId === 'btnedit') {
                    editing = true;
                    iCounter++;
                }
                else if (buttonVerify.customId === 'btnsbmt') {
                    data.submitted = true;
                }
                else if (buttonVerify.customId === 'btncncl') {
                    canceled = true;
                    await buttonVerify.update({ embeds: [], content: 'Interaction canceled. You can dismiss this message.', components: [] }).catch(err => { logger.error('loopModalValidation buttonVerify cancel' + err); });
                }
            }
            else {
                await modalSubmit.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
            }
        }
        else {
            await data.interactions[iCounter].editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
            canceled = true;
        }
    }

    if (data.submitted) {
        data.answers = answers;
        return data;
    }
}

/**
 * Checks user-provided survey dates
 * @param {MessageComponentInteraction} modalSubmit The modal inputs received from user
 * @returns {Object} data includes {boolean} valid isEndless, {Date} startDate endDate, {[string]} answers, {Object} error
 */
function validateSurveyDates(modalSubmit) {
    const data = { isEndless: false, startDate: null, endDate: null, answers: [], format: null, warn: [], error: {} };
    const startYear = modalSubmit.fields.getTextInputValue('textinputyear');
    const startMonth = modalSubmit.fields.getTextInputValue('textinputstartmonth');
    const startDay = modalSubmit.fields.getTextInputValue('textinputstartday');
    const endMonth = modalSubmit.fields.getTextInputValue('textinputendmonth');
    const endDay = modalSubmit.fields.getTextInputValue('textinputendday');

    data.answers = [startYear, startMonth, startDay, endMonth, endDay];

    const validStartDate = validateMonthDay(startMonth, startDay);

    if (validStartDate.valid) {
        const currentYear = new Date().getFullYear();
        if (startYear >= currentYear) {
            data.startDate = new Date(startYear, validStartDate.m - 1, validStartDate.d);
        }
        else {
            data.error.msg = `Start year entry ${startYear} is a past year. Edit to current or later.`;
            logger.error(data.error.msg);
        }

        if (endMonth.length === 0 || endDay.length === 0) {
            data.isEndless = true;
            data.valid = true;
            data.warn.push('End month or end day left blank. Survey will run endlessly until manually stopped.');
            // Success
            data.format = { fields: ['Start Date', 'End Date'],
                            answers: [
                                `${Months[validStartDate.m].name} ${validStartDate.d}, ${startYear}`,
                                `No end date`],
                            description: data.warn[data.warn.length - 1]
                            };
        }
        else {
            const validEndDate = validateMonthDay(endMonth, endDay);

            if (validEndDate.valid) {

                if (Number(endMonth) < Number(startMonth)) {
                    const endYear = Number(startYear) + 1;
                    data.endDate = new Date(endYear, validEndDate.m - 1, validEndDate.d);
                    data.warn.push(`End month ${Months[validEndDate.m].name} is earlier than start month ${Months[validStartDate.m].name}. Setting end year to ${endYear}`);
                    logger.warn(data.warn[data.warn.length - 1]);
                }
                else {
                    data.endDate = new Date(startYear, validEndDate.m - 1, validEndDate.d);
                }

                if (data.endDate > data.startDate) {
                    data.valid = true;
                    // Success
                    data.format = { fields: ['Start Date', 'End Date'],
                                    answers: [
                                        `${Months[validStartDate.m].name} ${validStartDate.d}, ${startYear}`,
                                        `${Months[validEndDate.m].name} ${validEndDate.d}, ${data.endDate.getFullYear()}`]
                                    };
                }
                else {
                    data.valid = false;
                    data.error.msg = `End date ${Months[validEndDate.m].name} ${validEndDate.d} ${data.endDate.getFullYear()} is ealier than start date ${Months[validStartDate.m].name} ${validStartDate.d} ${startYear}.`;
                    logger.error('End date is ealier than start date.');
                }
            }
            else {
                data.error.msg = validEndDate.error.msg;
                logger.error('validEndDate error: ' + validEndDate.error.msg);
            }
        }
    }
    else {
        data.error.msg = validStartDate.error.msg;
        console.error('validStartDate error: ' + validStartDate.error.msg);
    }
    console.log('validate survey data: ', data);
    return data;
}

// TODO: Add date creation for survey Create command
// DONE
// Now must debug why .submitted not working. Supposedly reading .submitted of the following function, loopEditableModal's return data.

// MISC:
// Make it so Edit button itself grabs whatever the last reply in array is, regardless of how old it is.
// And have it "Edit" rather than update, so it remains in place on the channel. I thiiink that's how it can work.
// But this would ONLY apply if I were NOT updating last message, and leaving each embed message posted instead.

// TODO: Clean up error logger structures

// TODO: Test other scenarios of looping modal function (such as no modal added at start)
// Test it out for Survey Edit command
// And then move it over to Utility
// See how it can convert into survey-answering type for users answering survey created

// TODO: Create one more button, View Event which shows an embed with survey questions
// Also, figure out how mods can see answers. Can be posted in a channel, but should be stored in db.
// Maybe make it so older event answers can be viewed by user-basis. So, Select-User and see if they have an entry.