const { Events } = require("discord.js")
const { Guild } = require("@models")
const { handleError } = require('@handlers/errorHandler');

module.exports = (client) => {
    client.on(Events.GuildCreate, async guild => {
        // TODO: Alert if guild is not available
        if (!guild.available) return; 

        try {
            await Guild.create({ server_id: guild.id });

            const channel = client.channels.cache.get(process.env.LOGS_CHANNEL_ID);
            await channel.send(`New server: ${guild.name} (${guild.id})`);
        } catch (error) {
            await handleError(error, __filename);
        }
    })
}