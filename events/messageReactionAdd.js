const { Events } = require('discord.js');
const { subtext, userMention } = require('@discordjs/formatters')
const { Channel } = require('@models');

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        await handleAllowDeleteByReaction(client, reaction, user);
    });
}

async function handleAllowDeleteByReaction(client, reaction, user) {
    if (await allowDeleteByReaction(reaction.message.channelId, user)) {
        const extracted = extractUserID(reaction.message);
        if (!await extractedUserIdMatchesAuthor(extracted, user.id)) return;

        if (!isDeleteReaction(reaction.emoji.name)) return;

        if (reaction.message.author.bot && reaction.client.application.id === client.application.id) {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            const response = await reaction.message.reply({
                content: `${userMention(user.id)}, you've requested to delete this message... \n${subtext('Please wait for a few seconds.')}`,
            });

            await delay(3000);

            await reaction.message.delete();

            await response.edit({
                content: `Your message has been deleted. \n${subtext('This message will be deleted in 3 seconds.')}`,
            });

            await delay(3000);

            response.delete();
        }
    }
}

async function channelHasPermission(channelId) {
    const channel = await Channel.findOne({ where: { discord_channel_id: channelId } })
    const settings = JSON.parse(channel.settings);

    return settings.value.allowDeleteByReaction;
}

async function allowDeleteByReaction(channelId, user) {
    const channelPermission = await channelHasPermission(channelId);

    return channelPermission && !user.bot;
}

async function extractedUserIdMatchesAuthor(extractedUserId, userId) {
    if (!extractedUserId) return false;

    return extractedUserId === userId;
}

function isDeleteReaction(emojiName) {
    return emojiName === '❌';
}

function extractUserID(message) {
    const embed = message.embeds[0];

    if (!embed.image) return null;

    const imageUrl = embed.image.url;
    const cleanUrl = imageUrl.split('.png?')[0];
    const userId = cleanUrl.split('/').pop();

    return userId;
}