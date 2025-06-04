const { Events, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { bold, userMention } = require("@discordjs/formatters");
const { Channel } = require("@models");
const { handleError } = require("@handlers/errorHandler");
const { COLOR_SUCCESS, COLOR_ERROR } = require("@/constant.js");
const channelSchema = require("@schemas/channel-settings");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const EMOJI = {
    QUALIFY: "✅",
    NON_QUALIFY: "❌",
    DELETE: "🗑️",
};

function isQualifiedReaction(emoji) {
    return emoji === EMOJI.QUALIFY;
}

function isNonQualifiedReaction(emoji) {
    return emoji === EMOJI.NON_QUALIFY;
}

function isDeleteReaction(emoji) {
    return emoji === EMOJI.DELETE;
}

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;

        try {
            const reactionName = reaction.emoji.name;

            if (isDeleteReaction(reactionName)) {
                await handleDeleteByReaction(client, reaction, user);
            }

            if (
                isQualifiedReaction(reactionName) ||
                isNonQualifiedReaction(reactionName)
            ) {
                await handleQualifiedByReaction(reaction, user);
            }
        } catch (error) {
            await handleError(error, __filename);
        }
    });
};

async function handleDeleteByReaction(client, reaction, user) {
    const canReact = await canDeleteByReaction(reaction.message.channelId);
    if (!canReact) {
        await sendReactionError(reaction, user, "deleteReactionDisabled");

        return;
    }

    const { message } = reaction;
    if (!isAuthor(message.interactionMetadata.user.id, user.id)) {
        await sendReactionError(reaction, user, "notAuthor");

        return;
    }

    if (!message.deletable) {
        const response = await message.reply({
            content: constructUserResponse(user.id, "messageNotDeletable"),
        });

        await delay(3000);
        await response.delete();

        return;
    }

    if (isReactionByBotAndSameClient(client, reaction)) {
        const response = await message.reply({
            content: constructUserResponse(user.id, "deleteRequest"),
        });

        await delay(3000);
        await message.delete();

        await delay(1000);
        await response.delete();
    }
}

async function handleQualifiedByReaction(reaction, user) {
    const isAdmin = await isAdministrator(reaction, user);
    if (!isAdmin) return;

    const canReact = await canQualifyByReaction(reaction.message.channelId);
    if (!canReact) {
        await sendReactionError(reaction, user, "qualifyReactionDisabled");

        return;
    }

    const { message } = reaction;
    if (!message.editable) {
        const response = await message.reply({
            content: constructUserResponse(user.id, "messageNotEditable"),
        });

        await delay(3000);
        await response.delete();

        return;
    }

    const reactionName = reaction.emoji.name;

    const embeds = EmbedBuilder.from(message.embeds[0]);
    if (isQualifiedReaction(reactionName)) {
        await message.edit({
            content: bold(
                `Qualified for ${getCurrentMonth(message)} Pixlr Contest!`
            ),
            embeds: [
                setEmbedProperties(
                    embeds,
                    true,
                    message.interactionMetadata.user
                ),
            ],
        });
    }

    if (isNonQualifiedReaction(reactionName)) {
        await message.edit({
            content: bold(
                `Not Qualified for ${getCurrentMonth(message)} Pixlr Contest!`
            ),
            embeds: [setEmbedProperties(embeds, false, user)],
        });
    }

    await reaction.users.remove(user.id);
}

function setEmbedProperties(embeds, isQualified, user) {
    const color = isQualified ? COLOR_SUCCESS : COLOR_ERROR;
    const footerText = isQualified
        ? `Approved by ${user.username}`
        : `Requested by ${user.username}`;

    return embeds
        .setColor(color)
        .setFooter({ text: footerText, iconURL: user.avatarURL() });
}

async function sendReactionError(reaction, user, reasonKey) {
    try {
        const response = await reaction.message.reply({
            content: constructUserResponse(user.id, reasonKey),
        });
        await delay(3000);

        await response.delete();
        await reaction.users.remove(user);
    } catch (error) {
        await handleError(error, __filename);
    }
}

const PERMISSIONS = {
    DELETE_BY_REACTION: "allowDeleteByReaction",
    QUALIFY_BY_REACTION: "allowQualifyByReaction",
};

async function canDeleteByReaction(channelId) {
    return await hasChannelPermission(
        channelId,
        PERMISSIONS.DELETE_BY_REACTION
    );
}

async function canQualifyByReaction(channelId) {
    return await hasChannelPermission(
        channelId,
        PERMISSIONS.QUALIFY_BY_REACTION
    );
}

async function isAdministrator(reaction, user) {
    const member = await reaction.message.guild.members.fetch(user.id);
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isReactionByBotAndSameClient(client, reaction) {
    return (
        reaction.message.author.bot &&
        reaction.client.application.id === client.application.id
    );
}

async function hasChannelPermission(channelId, object) {
    try {
        const channel = await Channel.findOne({
            where: { discord_channel_id: channelId },
        });

        if (channel === null) return false;

        const schemaMetadata = channelSchema.describe();
        console.log("Schema Metadata: ", schemaMetadata);
        // TODO: Check if object exist or not. (Joi schema object)
        const settings = JSON.parse(channel.settings);
        return settings.value[object];
    } catch (error) {
        await handleError(error, __filename);
    }
}

function getCurrentMonth(message) {
    const date = message.createdAt;
    const options = {
        month: "long",
        timeZone: "America/New_York",
    };

    return date.toLocaleString("en-US", options);
}

function isAuthor(interactionUserId, userId) {
    return interactionUserId == userId;
}

function constructUserResponse(id, responseKey) {
    const reasons = {
        qualifyReactionDisabled: "Qualify by reaction is disabled.",
        deleteReactionDisabled: "Delete by reaction is disabled.",
        deleteRequest: "You have requested to delete this message.",
        notAuthor: "You can only delete messages you requested yourself.",
        messageNotEditable: "This message is not editable.",
        messageNotDeletable: "This message is not deletable",
    };

    return `${userMention(id)} ${reasons[responseKey] ?? "Something went wrong!"}`;
}
