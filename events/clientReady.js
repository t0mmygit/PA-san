const { Events } = require('discord.js');
const { BOT_STATUS, ACTIVITY_TYPE, ACTIVITY_NAME, GUILD_LOG_CHANNEL_ID } = require('../constant.js');

module.exports = (client) => {
    console.log("Loading client ready event...")
    
    client.once(Events.ClientReady, client => {
        const bot = client.user; 
        const channels = client.channels;
        const channelID = GUILD_LOG_CHANNEL_ID;
        let currentTime = new Date();

        bot.setStatus(BOT_STATUS);
        bot.setActivity(ACTIVITY_NAME, { type: ACTIVITY_TYPE })

        channels.fetch(channelID)
            .then(channel => channel.send(`${bot.tag} is now online! Time: ${currentTime}`))
            .then(console.log(`Ready! Logged in as ${bot.tag}`))
            .catch(console.error)
    });
}