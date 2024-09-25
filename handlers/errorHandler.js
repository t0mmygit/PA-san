const { EmbedBuilder } = require('discord.js');
const client = require('@/index.js').client;
const { basename } = require('node:path');
const { COLOR_ERROR } = require('@/constant.js');
const { wrapInBold, wrapInCodeBlock } = require('@utils');

// TODO: Handle 'deleted' collector error.

async function handleError(error, fileName) {
    if (isTimeoutError(error)) return;

    const errorEmbed = new EmbedBuilder()
        .setTitle(basename(fileName))
        .setFields(
            {
                name: error.code || 'Unknown Error Code',
                value: constructErrorEmbedFieldValue(error),
            }
        ); 

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

function handleEmbedTimeoutError(error, response) { 
    if (!isTimeoutError(error)) return;

    const timeoutEmbed = EmbedBuilder.from(response.embeds[0]).setColor(COLOR_ERROR);

    response.edit({
        content: wrapInBold('Timed out! Please try again.'),
        embeds: [timeoutEmbed],
        components: [],
    });
}

async function logError(error, response, fileName) {
    handleEmbedTimeoutError(error, response);
    await handleError(error, fileName);
}

function isTimeoutError(error) {
    return error.message.includes('time') && error.code === 'InteractionCollectorError';
}

function constructErrorEmbedFieldValue(error) {
    console.error(error);

    let errors = [];
    const { code, message, stack } = error;

    if (code) errors.push(`${wrapInCodeBlock('code', 'single')} ${code}`);
    if (message) errors.push(`${wrapInCodeBlock('message', 'single')} ${message}`);
    if (stack) errors.push(`${wrapInCodeBlock('stack', 'single')} ${stack}`);

    // TODO: Handle getOwnProperties errors.
    
    return errors.join('\n');
}

module.exports = {
    handleError,
    handleEmbedTimeoutError,
    logError,
};