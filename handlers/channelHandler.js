const client = require('@handlers/clientSingletonHandler.js');

module.exports = async () => {
    const channelId = process.env.ERROR_LOGS_CHANNEL_ID;
    let channel = await client.channels.cache.get(channelId);

    if (!channel) {
        channel = await client.channels.fetch(channelId);
    }

    return channel;
}