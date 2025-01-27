const { Events, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { bold, subtext, userMention } = require("@discordjs/formatters");
const { Channel } = require("@models");
const { handleError } = require("@handlers/errorHandler");
const { COLOR_SUCCESS, COLOR_ERROR } = require("@/constant.js");
const channelSchema = require("@schemas/channel-settings");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return;

        try {
            await handleDeleteByReaction(client, reaction, user);
            await handleQualifiedByReaction(reaction, user);
        } catch (error) {
            await handleError(error, __filename);
        }
    });
};

async function handleDeleteByReaction(client, reaction, user) {
    if (!isDeleteReaction(reaction.emoji.name)) return;

    const canReact = await canDeleteByReaction(reaction.message.channelId);
    if (!canReact) {
        await handleReactionError(reaction, user, "delete-by-reaction");

        return;
    }

    // Check if reacted message was requested by the same user
    // Reason: The message can only be deleted by the user who originally requested it.
    const interactionUserId = extractInteractionUserID(reaction.message);
    if (!userIdMatchesAuthor(interactionUserId, user.id)) {
        await handleReactionError(reaction, user, "user-requested-not-match");

        return;
    }

    if (isReactionByBotAndSameClient(client, reaction)) {
        const response = await reaction.message.reply({
            content: constructUserResponse(user.id, "message-delete-request"),
        });

        await delay(3000);
        await reaction.message.delete();

        await delay(1000);
        response.delete();
    }
}

async function handleQualifiedByReaction(reaction, user) {
    const reactionName = reaction.emoji.name;

    if (!isValidQualifiedReaction(reactionName)) return;

    const isAdmin = await isAdministrator(reaction, user);
    if (!isAdmin) return;

    const canReact = await canQualifyByReaction(reaction.message.channelId);
    if (!canReact) {
        await handleReactionError(reaction, user, "qualify-by-reaction");

        return;
    }

    const message = reaction.message;
    if (!message.editable) {
        console.log("Message is not editable by client user.");
    }

    const embed = EmbedBuilder.from(message.embeds[0]);
    if (isQualifiedReaction(reactionName)) {
        await message.edit({
            content: bold(`Qualified for ${getCurrentMonth()} Pixlr Contest!`),
            embeds: [embed.setColor(COLOR_SUCCESS)],
        });
    }

    if (isNonQualifiedReaction(reactionName)) {
        await message.edit({
            content: bold(
                `Not Qualified for ${getCurrentMonth()} Pixlr Contest!`
            ),
            embeds: [embed.setColor(COLOR_ERROR)],
        });
    }

    await reaction.users.remove(user.id);
}

async function handleReactionError(reaction, user, content) {
    try {
        const response = await reaction.message.reply({
            content: constructUserResponse(user.id, content),
        });
        await delay(3000);
        response.delete();

        await reaction.users.remove(user);
    } catch (error) {
        await handleError(error, __filename, response);
    }
}

async function canDeleteByReaction(channelId) {
    return await hasChannelPermission(channelId, "allowDeleteByReaction");
}

async function canQualifyByReaction(channelId) {
    return await hasChannelPermission(channelId, "allowQualifyByReaction");
}

/* Handle 'is' condition */
async function isAdministrator(reaction, user) {
    // TODO: Check if user has permission or allowed to qualify (user role choose)
    const member = await reaction.message.guild.members.fetch(user.id);

    return member.permissions.has(PermissionFlagsBits.Administrator);
}

function isQualifiedReaction(emoji) {
    return emoji === "✅";
}

function isNonQualifiedReaction(emoji) {
    return emoji === "❌";
}

function isDeleteReaction(emoji) {
    return emoji === "🗑️";
}

function isValidQualifiedReaction(emoji) {
    return isQualifiedReaction(emoji) || isNonQualifiedReaction(emoji);
}

function isReactionByBotAndSameClient(client, reaction) {
    return (
        reaction.message.author.bot &&
        reaction.client.application.id === client.application.id
    );
}

/* Other functions */
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

function getCurrentMonth() {
    const date = new Date();

    return date.toLocaleString("default", { month: "long" });
}

function getContent(content) {
    switch (content) {
        case "qualify-by-reaction":
            return "Qualify by reaction is not enabled!";

        case "delete-by-reaction":
            return "Delete by reaction is not enabled!";

        case "user-requested-not-match":
            return "You did not request for this render!";

        case "message-delete-request":
            return "You have requested to delete this message.";

        default:
            return "Something went wrong, please report to the developer.";
    }
}

function userIdMatchesAuthor(extractedUserId, userId) {
    if (!extractedUserId) return false;

    return extractedUserId == userId;
}

function extractInteractionUserID(message) {
    const embed = message.embeds[0];

    if (!embed === null || !embed?.image === undefined) return null;

    const imageUrl = embed.image.url;
    const cleanUrl = imageUrl.split(".png?")[0];
    const userId = cleanUrl.split("/").pop();

    return userId;
}

function constructUserResponse(userId, content) {
    const user = `${userMention(userId)}`;
    const sub = `\n${subtext("This message will be deleted in 3 seconds.")}`;

    return `${user} ${getContent(content)}${sub}`;
}
