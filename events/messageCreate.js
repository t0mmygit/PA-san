const { Events } = require('discord.js');
const { PREFIX } = require('@/constant.js');
const { removeOngoingCommand } = require('@/handlers/storageHandler.js');
const logError = require('@handlers/errorHandler');
const { User } = require('@/models');

module.exports = (client) => {
    client.on(Events.MessageCreate, async message => {
        if (!message.content.startsWith(PREFIX) || message.author.bot) return;
        
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

        try {
            await command.execute(client, message, args);
        } catch (error) {
            logError(error, __filename);
        }
    });
}