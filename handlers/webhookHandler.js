const { WebhookClient } = require('discord.js');


async function send(message, type = 'logs') {
    const webhookClient = await create(type);

    const APIMessage = await webhookClient.send(message); 
    return APIMessage;
}

async function create(type) {
    let webhookUrl;

    if (type === 'image-cache') {
        webhookUrl = process.env.WEBHOOK_IMAGE_CACHE_URL;
    } else if (type === 'logs') {
        webhookUrl = process.env.WEBHOOK_LOGS_URL;
    }

    return new WebhookClient({ url: webhookUrl });
}

module.exports = {
    create,
    send,
}