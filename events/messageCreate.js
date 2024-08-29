const { PREFIX } = require('../constant.js');
const { Events } = require('discord.js');
const User = require('../models/User');

module.exports = (client) => {
    client.on(Events.MessageCreate, async message => {
        if (!message.content.startsWith(PREFIX)) return;
        
        const user = await User.findOne({ where: { discordId: message.author.id } });

        if (user === null) {
            await require('../commands/prefix/interface/userVerification').execute(message);

            return;
        }

        const args = message.content.slice(PREFIX.length).trim().split(/ +/g);

        if (args[0].length === 0) {
            message.reply('Please provide a command!');

            // TODO: Show button for commands

            return;
        }

        const command = args.shift().toLowerCase();

        try {
            const action = require(`../commands/prefix/interface/${command}.js`);

            await action.execute(client, message);
        } catch (error) {
            console.log('Message Error:', error)
        }
    });
}