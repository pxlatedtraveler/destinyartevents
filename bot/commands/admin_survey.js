const { SlashCommandBuilder, ActionRowBuilder, ComponentType, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getTimeLeft, priviledgeCheck, refreshTimeout, setCooldown } = require('../Utils');
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

                const textInputId = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputid')
                            .setLabel('Id (ie: fall2023)')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(25)
                            .setRequired(true)
                    );

                const textInputName = new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('textinputname')
                            .setLabel('Name (ie: Fall 2023)')
                            .setStyle(TextInputStyle.Short)
                            .setMinLength(1)
                            .setMaxLength(50)
                            .setRequired(true)
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

                        const results = await loopEditableModal(buttonReply, modalName, filter).catch(err => { logger.error('loopEditableModal create survey ' + err); });

                        if (results.submitted) {
                            const surveyId = results.answers[0];
                            const surveyName = results.answers[1];
                            const surveyQuestions = results.answers.splice(2);

                            const survey = new SurveyBuilder(surveyId, surveyName, surveyQuestions);
                            interaction.client._tempSurvey.set(survey.id, survey);
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
 * @returns {Object} message reply or void
 */
async function loopEditableModal(interaction, modal, filter) {
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
    const interactions = [interaction];
    let iCounter = interactions.length - 1;

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
            modals[mCounter] = new ModalBuilder()
                .setCustomId('modal_' + (mCounter))
                .setTitle('Page ' + (mCounter + 1));
            for (let i = 0; i < 5; i++) {
                modals[mCounter].addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('textinputid_' + i)
                                .setLabel('Field (Max 45 characters)')
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(45)
                                .setRequired(false)
                        )
                );
            }
        }
        else {
            if (editing) {
                for (let i = 0; i < modals[mCounter].components.length; i++) {
                    modals[mCounter].components[i].components[0].setValue(answers[mCounter].ans[i]);
                }
            }
        }

        await interactions[iCounter].showModal(modals[mCounter]).catch(err => { logger.error('interaction + ' + iCounter + 'showModal' + err); });
        await interactions[iCounter].editReply({ components: [] }).catch(err => { logger.error('interaction + ' + iCounter + 'editReply' + err); });

        const modalSubmit = await interactions[iCounter].awaitModalSubmit({ time: modalTime, filter, max: 1 }).catch(err => { logger.error('modalSubmit' + (iCounter + 1), err); });

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
                interactions.push(buttonVerify);
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
                    editing = false;
                    submitted = true;
                    await buttonVerify.update({ embeds: [], content: `Questions created!`, components: [] }).catch(err => { logger.error('buttonVerify ' + iCounter + ' submit ' + err); });
                }
                else if (buttonVerify.customId === 'btncncl_' + iCounter) {
                    editing = false;
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
        const data = { answers: [], submitted: true };
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

// Make it so Edit button itself grabs whatever the last reply in array is, regardless of how old it is.
// And have it "Edit" rather than update, so it remains in place on the channel. I thiiink that's how it can work.

// TODO: Test other scenarios of looping modal function (such as no modal added at start)
// Test it out for Survey Edit command
// And then move it over to Utility
// See how it can convert into survey-answering type for users answering survey created

// TODO: Add date creation for survey Create command

// TODO: Create one more button, View Event which shows an embed with survey questions
// Also, figure out how mods can see answers. Can be posted in a channel, but should be stored in db.
// Maybe make it so older event answers can be viewed by user-basis. So, Select-User and see if they have an entry.