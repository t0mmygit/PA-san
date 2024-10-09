const { Events } = require('discord.js');
const { subtext, userMention } = require('@discordjs/formatters')
const { Channel } = require('@models');
const { handleError, handlePermissionError } = require('@handlers/errorHandler');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        try {
            await handleAllowDeleteByReaction(client, reaction, user);
        } catch (error) {
            await handleError(error, __filename);
        }
    });
}

async function handleAllowDeleteByReaction(client, reaction, user) {
    if (!isDeleteReaction(reaction.emoji.name)) return;

    if (!await allowDeleteByReaction(reaction.message.channelId, user)) {
        await handleReactionError(
            reaction, 
            user,
            `${userMention(user.id)}, delete by reaction is not enabled! Please contact the server moderator. \n${subtext('Message will be deleted in 5 seconds.')}`,
            5000
        );

        return;
    };

    const interactionUserId = getinteractionUserID(reaction.message);
    if (!await extractedUserIdMatchesAuthor(interactionUserId, user.id)) {
        await handleReactionError(
            reaction,
            user,
            `${userMention(user.id)}, you did not requested this render! \n${subtext('Message will be deleted in 3 seconds.')}`,
        );

        return;
    }

    if (reaction.message.author.bot && reaction.client.application.id === client.application.id) {
        const response = await reaction.message.reply({
            content: `${userMention(user.id)}, you've requested to delete this message... \n${subtext('Please wait for a few seconds.')}`,
        });

        await delay(3000);
        await reaction.message.delete();

        await response.edit({
            content: `Deletion request successful! \n${subtext('This message will be deleted in 3 seconds.')}`,
        });

        await delay(3000);
        response.delete();
    }
}

async function handleReactionError(reaction, user, content, miliseconds = 3000) {
    try {
        const response = await reaction.message.reply({
            content: content,
        });
        await delay(miliseconds);
        response.delete();

        await reaction.users.remove(user);
    } catch (error) {
        await handlePermissionError(error, reaction.message, __filename, 'Reaction deletion');
    }
}

async function channelHasPermission(channelId) {
    const channel = await Channel.findOne({ where: { discord_channel_id: channelId } });
    
    if (channel === null) return false;

    const settings = JSON.parse(channel.settings);

    return settings.value.allowDeleteByReaction;
}

async function allowDeleteByReaction(channelId, user) {
    try {
        const channelPermission = await channelHasPermission(channelId);

        return channelPermission && !user.bot;
    } catch (error) {
        await handleError(error, __filename);
    }
}

async function extractedUserIdMatchesAuthor(extractedUserId, userId) {
    if (!extractedUserId) return false;

    return extractedUserId == userId;
}

function isDeleteReaction(emojiName) {
    return emojiName === '❌';
}

function getinteractionUserID(message) {
    const embed = message.embeds[0];

    if (!embed === null || !embed?.image === undefined) return null;

    const imageUrl = embed.image.url;
    const cleanUrl = imageUrl.split('.png?')[0];
    const userId = cleanUrl.split('/').pop();

    return userId;
}