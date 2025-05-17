const { Events } = require("discord.js");
const { PREFIX } = require("@/constant.js");
const { removeOngoingCommand } = require("@/handlers/storageHandler.js");
const { handleError } = require("@handlers/errorHandler");
const { User, Guild } = require("@/models");

module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        return;
    });
};

function isAuthorizedUser(message) {
    if (!message.member) return false;

    return message.member.roles?.cache.has(process.env.DEVELOPER_ROLE_ID);
}

function isHome(guildId) {
    return guildId === process.env.DISCORD_GUILD_ID;
}

function hasAccess(message) {
    return isAuthorizedUser(message) && isHome(message.guild.id);
}

async function guildHasPrefixPermission(guildId) {
    const [guild] = await Guild.findOrCreate({ where: { server_id: guildId } });

    return guild.prefix_status;
}

async function allowCommand(message) {
    const hasPrefixPermission = await guildHasPrefixPermission(
        message.guild.id
    );
    return (
        message.author.bot ||
        !message.content.startsWith(PREFIX) ||
        !hasPrefixPermission
    );
}
