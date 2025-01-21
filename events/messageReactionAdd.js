const {
    Events,
    PermissionFlagsBits,
    EmbedBuilder,
    bold,
} = require("discord.js");
const { subtext, userMention } = require("@discordjs/formatters");
const { Channel } = require("@models");
const {
    handleError,
    handlePermissionError,
} = require("@handlers/errorHandler");
const { COLOR_SUCCESS } = require("@/constant.js");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        try {
            await handleDeleteByReaction(client, reaction, user);
            await handleQualifiedByReaction(client, reaction, user);
        } catch (error) {
            await handleError(error, __filename);
        }
    });
};

async function handleDeleteByReaction(client, reaction, user) {
    // Check for "Delete" reaction
    if (!isDeleteReaction(reaction.emoji.name)) return;

    // Check if server delete by reaction is enabled
    if (!(await allowDeleteByReaction(reaction.message.channelId, user))) {
        await handleReactionError(
            reaction,
            user,
            `${userMention(user.id)}, delete by reaction is not enabled! Please contact the server moderator. \n${subtext("Message will be deleted in 5 seconds.")}`,
            5000
        );

        return;
    }

    // Check if reacted message was requested by the same user
    // Reason: The message can only be deleted by the user who originally requested it.
    const interactionUserId = getinteractionUserID(reaction.message);
    if (!(await extractedUserIdMatchesAuthor(interactionUserId, user.id))) {
        await handleReactionError(
            reaction,
            user,
            `${userMention(user.id)}, you did not requested this render! \n${subtext("Message will be deleted in 3 seconds.")}`
        );

        return;
    }

    /*
     * 1. Check if reacted message is owned by a bot.
     * 2. Check if reacted message matches this bot's id.
     * 3. Then, deletes reacted message.
     */
    if (
        reaction.message.author.bot &&
        reaction.client.application.id === client.application.id
    ) {
        const response = await reaction.message.reply({
            content: `${userMention(user.id)}, you've requested to delete this message... \n${subtext("Please wait for a few seconds.")}`,
        });

        await delay(3000);
        await reaction.message.delete();

        await delay(1000);
        response.delete();
    }
}

async function handleQualifiedByReaction(client, reaction, user) {
    if (!isQualifiedReaction(reaction.emoji.name)) return;
    if (!isAdministrator(reaction, user)) return;

    if (!(await allowQualifyByReaction(reaction.message.channelId, user))) {
        await handleReactionError(
            reaction,
            user,
            `${userMention(user.id)}, qualify by reaction is not enabled! \n${subtext("Message will be deleted in 5 seconds.")}`,
            5000
        );

        return;
    }

    await qualifyMessage(reaction.message);

    // TODO: Remove triggering reaction.
}
async function handleReactionError(
    reaction,
    user,
    content,
    miliseconds = 3000
) {
    try {
        const response = await reaction.message.reply({
            content: content,
        });
        await delay(miliseconds);
        response.delete();

        await reaction.users.remove(user);
    } catch (error) {
        await handlePermissionError(
            error,
            reaction.message,
            __filename,
            "Reaction deletion"
        );
    }
}

async function channelHasPermission(channelId, object) {
    const channel = await Channel.findOne({
        where: { discord_channel_id: channelId },
    });

    if (channel === null) return false;

    const settings = JSON.parse(channel.settings);

    // TODO: Check if object exist or not. (Joi schema object)
    return settings.value[object];
}

async function allowDeleteByReaction(channelId, user) {
    try {
        const channelPermission = await channelHasPermission(
            channelId,
            "allowDeleteByReaction"
        );

        return channelPermission && !user.bot;
    } catch (error) {
        await handleError(error, __filename);
    }
}

async function allowQualifyByReaction(channelId, user) {
    try {
        const channelPermission = await channelHasPermission(
            channelId,
            "allowQualifyByReaction"
        );

        return channelPermission && !user.bot;
    } catch (error) {
        await handleError(error, __filename);
    }
}

async function qualifyMessage(message) {
    if (!message.editable) {
        console.log("Message is not editable by client user.");
    }

    const embed = EmbedBuilder.from(message.embeds[0]);

    await message.edit({
        content: bold(`Qualified for ${getCurrentMonth()} Pixlr Contest!`),
        embeds: [embed.setColor(COLOR_SUCCESS)],
    });
}

async function extractedUserIdMatchesAuthor(extractedUserId, userId) {
    if (!extractedUserId) return false;

    return extractedUserId == userId;
}

function isQualifiedReaction(emojiName) {
    return emojiName === "✅";
}

function isNotQualifiedReaction(emojiName) {
    return emojiName === "❌";
}

function isDeleteReaction(emojiName) {
    return emojiName === "🗑️";
}

function getCurrentMonth() {
    const date = new Date();

    return date.toLocaleString("default", { month: "long" });
}

async function isAdministrator(reaction, user) {
    // TODO: Check if user has permission or allowed to qualify (user role choose)
    const member = await reaction.message.guild.members.fetch(user.id);

    return member.permissions.has(PermissionFlagsBits.Administrator);
}

function getinteractionUserID(message) {
    const embed = message.embeds[0];

    if (!embed === null || !embed?.image === undefined) return null;

    const imageUrl = embed.image.url;
    const cleanUrl = imageUrl.split(".png?")[0];
    const userId = cleanUrl.split("/").pop();

    return userId;
}
