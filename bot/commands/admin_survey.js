const { SlashCommandBuilder, ActionRowBuilder, ComponentType, TextInputBuilder, TextInputStyle, ModalBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getTimeLeft, priviledgeCheck, refreshTimeout, setCooldown } = require('../Utils');
const logger = require('../../util/logger.js');
const { EmbedBuilder } = require('@discordjs/builders');

const permittedRoles = ['Admin', 'Mod'];

const cooldownTimer = 5000;

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
    constructor(name, questions) {
        this.name = name;
        this.questions = [];

        for (let i = 0; i < questions.length; i++) {
            this.questions[i] = new Question();
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin_survey')
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

                const rowReview = new ActionRowBuilder();

                const buttonAnswersNext = new ButtonBuilder()
                    .setCustomId('btnansnext')
                    .setLabel('Next Page')
                    .setStyle(ButtonStyle.Success);
                const buttonAnswersEdit = new ButtonBuilder()
                    .setCustomId('btnansedit')
                    .setLabel('Edit Answers')
                    .setStyle(ButtonStyle.Primary);
                const buttonAnswersCancel = new ButtonBuilder()
                    .setCustomId('btnanscancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger);

                const modalName = new ModalBuilder()
                    .setCustomId('modalname')
                    .setTitle('Type in Survey id');

                const textInputId = new TextInputBuilder()
                    .setCustomId('textinputid')
                    .setLabel('Id (ie: fall2023)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(25)
                    .setRequired(true);

                const textInputName = new TextInputBuilder()
                    .setCustomId('textinputname')
                    .setLabel('Name (ie: Fall 2023)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(50)
                    .setRequired(true);

                const rowMain = new ActionRowBuilder();

                const buttonCreate = new ButtonBuilder()
                    .setCustomId('btncreate')
                    .setLabel('Create Survey')
                    .setStyle(ButtonStyle.Primary);

                const buttonEdit = new ButtonBuilder()
                    .setCustomId('btnedit')
                    .setLabel('Edit Survey')
                    .setStyle(ButtonStyle.Primary);

                const buttonPublish = new ButtonBuilder()
                    .setCustomId('btnpublish')
                    .setLabel('Publish')
                    .setStyle(ButtonStyle.Success);

                const buttonDelete = new ButtonBuilder()
                    .setCustomId('btndelete')
                    .setLabel('Delete Survey')
                    .setStyle(ButtonStyle.Danger);

                const buttonCancel = new ButtonBuilder()
                    .setCustomId('btncancel')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger);
                // const survey = new SurveyBuilder();

                // API DB QUERY GET ENTRY, CHECK IF OBJ EXISTS
                interaction.client._tempSurvey.size > 0 ? rowMain.addComponents(buttonPublish, buttonEdit, buttonDelete, buttonCancel) : rowMain.addComponents(buttonCreate, buttonCancel);
                const filter = intr => intr.user.id === interaction.user.id;

                await interaction.reply({ content: 'Select an action to perform.', components: [rowMain] });

                const buttonReply = await interaction.channel.awaitMessageComponent({ time: 15000, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error(err); });

                if (buttonReply) {
                    refreshTimeout(interaction, timeout);

                    if (buttonReply.customId === 'btncreate') {
                        modalName.setTitle('Input Survey Id and Name').addComponents(textInputId, textInputName);

                        // const surveyName = modalNameReply.fields.getTextInputValue('textinputname');
                        // const surveyId = modalNameReply.fields.getTextInputValue('textinputid');
                        const messages = [buttonReply];
                        let msgCounter = 0;
                        const modals = [modalName];
                        let pageCounter = 0;
                        const offset = -(pageCounter * 5);
                        const answers = [{ label: 'Question 1?', style: TextInputStyle }];
                        const embeds = [];
                        let notDone = true;

                        while (notDone) {
                            refreshTimeout(interaction, timeout);
                            if (!modals[pageCounter]) {
                                modals[pageCounter] = new ModalBuilder()
                                    .setCustomId('modal_' + (pageCounter + offset))
                                    .setTitle('Survey Builder');
                                for (let i = 0; i < 5; i++) {
                                    modals.addComponents(
                                        new ActionRowBuilder()
                                            .addComponents(
                                                new TextInputBuilder()
                                                    .setCustomId('textinputid')
                                                    .setLabel('Question (Max 45 characters)')
                                                    .setStyle(TextInputStyle.Short)
                                                    .setMinLength(1)
                                                    .setMaxLength(45)
                                                    .setRequired(false)
                                            )
                                    );
                                }
                            }
                            await messages[msgCounter].showModal(modals[pageCounter]);
                            const modalSubmit = messages[msgCounter].awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('modalSubmit' + (msgCounter + 1), err); });
                            if (modalSubmit) {
                                answers[pageCounter] = { ans: modalSubmit.fields.fields.map(e => e.value) };
                                if (answers.length > 0) {
                                    rowReview.addComponents(buttonAnswersNext, buttonAnswersEdit, buttonAnswersCancel);
                                    if (!embeds[pageCounter]) {
                                        embeds[pageCounter] = new EmbedBuilder()
                                            .setColor(0x0099FF)
                                            .setTitle('Page Submit')
                                            .setDescription('Review, edit, or submit your answers.');
                                    }
                                    else {
                                        embeds[pageCounter].data.fields = [];
                                    }
                                    for (let i = 0; i < 5; i++) {
                                        if (answers[pageCounter].ans[i]) {
                                            embeds[pageCounter].setFields({ name: 'Question ' + i + offset, value: answers[pageCounter].ans[i] });
                                        }
                                    }
                                }
                                else {
                                    rowReview.addComponents(buttonAnswersEdit, buttonAnswersCancel);
                                    if (!embeds[pageCounter]) {
                                        embeds[pageCounter] = new EmbedBuilder()
                                            .setColor(0x0099FF)
                                            .setTitle('Page Submit')
                                            .setDescription('Review, edit, or submit your answers.');
                                    }
                                    else {
                                        embeds[pageCounter].data.fields = [];
                                    }
                                    // Disable Next button till there's at least one question or user cancels
                                }
                                await modalSubmit.update({ embeds: [embeds[pageCounter]], content: 'Review your questions.', components: [rowReview] });
                                const buttonVerify = await modalSubmit.channel.awaitMessageComponent({ time: 30000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('buttonVerify' + (msgCounter + 1), err); });

                                if (buttonVerify) {
                                    messages.push(buttonVerify);
                                    if (buttonVerify.customId === 'next') {
                                        pageCounter++;
                                        msgCounter++;
                                    }
                                    else if (buttonVerify.customId === 'edit') {
                                        msgCounter++;
                                    }
                                    else if (buttonVerify.customId === 'cancel') {
                                        notDone = false;
                                        await buttonVerify.update({ content: 'Interaction canceled. You can dismiss this message.', components: [] });
                                    }
                                }
                                else {
                                    await modalSubmit.editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
                                }
                            }
                            else {
                                await messages[msgCounter].editReply({ content: 'No form submitted on time.', ephemeral: true, components: [] });
                                notDone = false;
                            }
                        // While end
                        }

                        const survey = new SurveyBuilder(answers[1]);
                        interaction.client._tempSurvey.set(survey.name, survey);

                    }


                    else if (buttonReply.customId === 'btnedit') {
                        modalName.setTitle('Input survey Id').addComponents(textInputId);
                        await buttonReply.showModa(modalName);
                        await buttonReply.editReply({ content: 'Awaiting Submit', components: [] });
                        const modalReply = await buttonReply.awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('btnedit modalreply', err); });
                        if (modalReply) {
                            refreshTimeout(interaction, timeout);
                            const surveyName = modalReply.fields.getTextInputValue('textinputid');
                            const survey = interaction.client._tempSurvey.get(surveyName);
                            if (survey) {
                                await modalReply.update({ content: `Editing survey ${survey.name}. Proceed?`, components: [rowVerify] });
                                const buttonVerify = await interaction.channel.awaitMessageComponent({ time: 15000, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error('btnedit buttonVerify', err); });

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


                    else if (buttonReply.customId === 'btnpublish') {
                        modalName.setTitle('Input Id of survey').addComponents(textInputId);
                        await buttonReply.showModa(modalName);
                        await buttonReply.editReply({ content: 'Awaiting Submit', components: [] });
                        const modalReply = await buttonReply.awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('btnpublish modalreply', err); });
                        if (modalReply) {
                            refreshTimeout(interaction, timeout);
                            const surveyName = modalReply.fields.getTextInputValue('textinputid');
                            const survey = interaction.client._tempSurvey.get(surveyName);
                            if (survey) {
                                await modalReply.update({ content: `Editing survey ${survey.name}. Proceed?`, components: [rowVerify] });
                                const buttonVerify = await interaction.channel.awaitMessageComponent({ time: 15000, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error('btnedit buttonVerify', err); });

                                if (buttonVerify) {
                                    if (buttonVerify.customId === 'btnconfirm') {
                                        survey.active = true;
                                        await buttonVerify.update({ content: `Survey ${survey.name} will now be accessible to server members from //sometime// till //sometime//. You can dismiss this message.`, components: [] });
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
                        await buttonReply.showModa(modalName);
                        await buttonReply.editReply({ content: 'Awaiting Submit', components: [] });
                        const modalReply = await buttonReply.awaitModalSubmit({ time: 30000, filter, max: 1 }).catch(err => { logger.error('btnpublish modalreply', err); });
                        if (modalReply) {
                            refreshTimeout(interaction, timeout);
                            const surveyName = modalReply.fields.getTextInputValue('textinputid');
                            const survey = interaction.client._tempSurvey.get(surveyName);
                            if (survey) {
                                await modalReply.update({ content: `Deleting survey ${survey.name}. Proceed?`, components: [rowVerify] });
                                const buttonVerify = await interaction.channel.awaitMessageComponent({ time: 15000, filter, max: 1, ComponentType: ComponentType.Button }).catch(err => { logger.error('btndelete buttonVerify', err); });

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
 * @param {*} modalReply collected i.awaitModalSubmit
 * @param {String} content The string message to use
 * @param {[ActionRow]} components Row holding Next Edit Cancel buttons
 * @param {*} filter filter to use when collecting replies
 * @returns message reply or void
 */
/* async function loopEditableModal (modalReply, content, components, filter) {

    const modalReplies = [modalReply];
    const modalAnswers = [];
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Page Submitted!')
        .setDescription('Review, edit, or submit your answers')
        .setFields({ name: 'Question', value: 'Only you can see this. You can dismiss this.' });

    for (let i = 0; let i < modalReply.)

    let replied = false;
    let counter = 0;
    while (!replied || counter < 50) {

        await modalReplies[counter].update({ embeds: [embed], content: content, components: components });
        const buttonReply = await modalReplies[counter].channel.awaitMessageComponent({ time: 15000, filter, ComponentType: ComponentType.Button }).catch(err => { logger.error('buttonReply_' + (counter + 1), err); });

        if (buttonReply) {
            modalReplies.push(buttonReply);
            if (buttonReply.customId === 'btnnext') {
                replied = true;
            }
            else if (buttonReply.customId === 'btnedit') {
                // loop
                counter++;

            }
            else if (buttonReply.customId === 'btncancel') {
                break;
            }
        }
        else {
            await modalReplies[counter].editReply({ content: 'No button selected on time.', ephemeral: true, components: [] });
            break;
        }
    }

    if (replied) {
        return modalReplies[modalReplies.length - 1];
    }
} */

// Make it so Edit button itself grabs whatever the last reply in array is, regardless of how old it is.
// And have it "Edit" rather than update, so it remains in place on the channel. I thiiink that's how it can work.

// TODO: Create one more button, View Event which shows an embed with survey questions
// Also, figure out how mods can see answers. Can be posted in a channel, but should be stored in db.
// Maybe make it so older event answers can be viewed by user-basis. So, Select-User and see if they have an entry.