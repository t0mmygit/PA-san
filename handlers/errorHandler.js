const { EmbedBuilder, bold, inlineCode, codeBlock } = require('discord.js');
const { basename } = require('node:path');
const { COLOR_ERROR } = require('@/constant.js');
const { subtext } = require('@discordjs/formatters');
const client = require('@handlers/clientSingletonHandler.js');

// TODO: Handle 'deleted' collector error.

async function handleError(error, fileName) {
    if (isTimeoutError(error)) return;

    console.error('Error Handled:', error);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const humanReadableTimestamp = new Date().toLocaleString('en-US', options);

    const errorEmbed = new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle(basename(fileName))
        .setFields(
            {
                name: error.code || 'Unknown Error Code',
                value: constructErrorEmbedFieldValue(error) || 'No error definition.',
            }
        ) 
        .setFooter({ text: `Issued on ${humanReadableTimestamp}` });

    const channelId = process.env.ERROR_LOGS_CHANNEL_ID;

    try {
        let channel = await client.channels.cache.get(channelId);

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
        content: bold('Timed out! Please try again.'),
        embeds: [timeoutEmbed],
        components: [],
    });
}

async function handlePermissionError(error, response, filename, reason = error.code) {
    if (!isPermissionError(error)) {
        await handleError(error, filename);

        return;
    } 
    console.error('Missing Permission Error!');

    const message = await response.channel.send({
        content: `[${reason}] No permission! Please contact the server moderator. \n${subtext('Message will be deleted in 5 seconds.')}`,
    });

    setTimeout(() => message.delete(), 5000);
}

async function logError(error, response, fileName) {
    handleEmbedTimeoutError(error, response);
    await handleError(error, fileName);
}

function isTimeoutError(error) {
    return error.message.includes('time') && error.code === 'InteractionCollectorError';
}

function isPermissionError(error) {
    return error.message.includes('Missing Permissions') && error.code == 50013;
}

function constructErrorEmbedFieldValue(error) {
    let errors = [];

    if (!error) {
        return 'No error definition.';
    }

    if (error.code) errors.push(inlineCode('code') + error.code);
    if (error.message) errors.push(inlineCode('message') + error.message);
    if (error.stack) errors.push(codeBlock(error.stack));

    // TODO: Handle getOwnProperties errors.
    
    return errors.join('\n');
}

module.exports = {
    handleError,
    handleEmbedTimeoutError,
    handlePermissionError,
    logError,
};