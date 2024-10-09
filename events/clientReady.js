const { Events, userMention, EmbedBuilder } = require('discord.js');
const { BOT_STATUS, ACTIVITY_TYPE, ACTIVITY_NAME, COLOR_SUCCESS } = require('@/constant.js');

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
        const timeLocaleOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true, 
            timeZoneName: 'short' 
        };

        const dateLocaleOptions = {
            weekday: 'long', 
            year: 'numeric', 
            month: 'long',   
            day: 'numeric',  
            timeZoneName: 'short' 
        };

        const embed = new EmbedBuilder()
            .setColor(COLOR_SUCCESS)
            .setTitle('Kessoku Band')
            .setDescription(`${userMention(app.id)} entered the band!`)
            .setFields(
                { name: 'Time', value: new Date().toLocaleTimeString('en-MY', timeLocaleOptions), inline: true },
                { name: 'Date', value: new Date().toLocaleDateString('en-MY', dateLocaleOptions), inline: true },
            );

        client.channels.fetch(process.env.WAKEUP_LOGS_CHANNEL_ID)
            .then(channel => channel.send({ embeds: [embed] }))
            .then(console.log(`Ready! Logged in as ${app.tag}`))
            .catch(console.error);
    });
}