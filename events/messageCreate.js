const { Events } = require('discord.js');
const { PREFIX } = require('@/constant.js');
const { removeOngoingCommand } = require('@/handlers/storageHandler.js');
const { handleError } = require('@handlers/errorHandler');
const { User, Guild } = require('@/models');

module.exports = (client) => {
    client.on(Events.MessageCreate, async message => {
        try {
            if (await allowCommand(message)) {
                if (!hasAccess(message)) return;
            }
            
            const user = await User.getByDiscordId(message.author.id);

            if (user === null) {
                await require('@auth/userVerification').execute(message);

                return;
            }

            const args = message.content.slice(PREFIX.length).trim().split(/ +/g);

            if (args[0].length === 0) {
                message.reply('Please provide a command!');

                // TODO: Show button for commands

                return;
            }

            const action = args.shift().toLowerCase();
            const command = client.prefixCommands.get(action);

            if (!command) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`Message Error: Command '${action}' not found or does not exist.`);
                }
                
                return;
            }

            await removeOngoingCommand(client, message, action);
            await command.execute(client, message, args);
        } catch (error) {
            handleError(error, __filename);
        }
    });
}

function isAuthorizedUser(message) {
    return message.member.roles.cache.has(process.env.DEVELOPER_ROLE_ID);
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
    const hasPrefixPermission = await guildHasPrefixPermission(message.guild.id);
    return (
        message.author.bot || !message.content.startsWith(PREFIX) || !hasPrefixPermission
    )
} 