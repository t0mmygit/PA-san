const { Events } = require('discord.js');
const { BOT_STATUS, ACTIVITY_TYPE, ACTIVITY_NAME } = require('@/constant.js');

module.exports = (client) => {
    console.log("Loading client ready event...");

    if (!process.env.WAKEUP_LOGS_CHANNEL_ID) {
        console.error('WAKEUP_LOGS_CHANNEL_ID is not set!');

        return 0;
    }
    
    client.once(Events.ClientReady, client => {
        const app = client.user;

        app.setStatus(BOT_STATUS);
        app.setActivity(ACTIVITY_NAME, { type: ACTIVITY_TYPE })

        client.channels.fetch(process.env.WAKEUP_LOGS_CHANNEL_ID)
            .then(channel => channel.send(`${app.tag} is now online! Time: ${new Date()}`))
            .then(console.log(`Ready! Logged in as ${app.tag}`))
            .catch(console.error);
    });
}