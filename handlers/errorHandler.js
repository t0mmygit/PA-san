const { EmbedBuilder } = require('@discordjs/builders');
const client = require('@/index.js').client;
const { basename } = require('node:path');

async function handleError(error, fileName) {

    const errorEmbed = new EmbedBuilder()
        .setTitle(basename(fileName))
        .setFields(
            {
                name: error.code,
                value: `Message: ${error.message}\n` + `Name: ${error.name}\n`, 
            }
        ); 
    console.error(error);

    let channel;
    const channelId = process.env.ERROR_LOGS_CHANNEL_ID;

    try {
        channel = await client.channels.cache.get(channelId);

        if (!channel) {
            channel = await client.channels.fetch(channelId);
        }

        await channel.send({
            content: 'An error has occured!',
            embeds: [errorEmbed],
        });
    } catch (error) {
        console.error('Failed to send error message.', error);
    }
}

module.exports = handleError;