const { EmbedBuilder } = require('discord.js');
const storage = require('@/storage.js');
const { COLOR_ERROR } = require('@/constant.js');

async function removeOngoingCommand(client, message, currentCommand) {
    if (!storage.has(message.author.id)) return;

    const record = storage.get(message.author.id);

    if (record.command != currentCommand) return;

    // CACHING IS DISABLED
    const channel = await client.channels.fetch(record.channel.id, { cache: false, force: true });
    const collector = record.collector;

    if (!collector.ended) {
        await collector.stop('ongoing');

        try {
            const existingMessage = await channel.messages.fetch(record.message.id);

            const messageEmbed = EmbedBuilder.from(existingMessage.embeds[0])
                .setColor(COLOR_ERROR)

            await existingMessage.edit({
                content: `${message.author} has cancelled this action.`,
                embeds: [messageEmbed],
                components: [], 
            });
        } catch (error) {
            console.error('Error when fetching message:', error.message);
        }    
    }

    await storage.delete(message.author.id);
}

module.exports = { removeOngoingCommand };