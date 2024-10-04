const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { COLOR_SECONDARY } = require("@/constant.js");
const { addExtension } = require('@utils');
const { client } = require('@/index.js');
const { handleError } = require('@handlers/errorHandler');
const worldRenderLink = 'https://s3.amazonaws.com/world.growtopiagame.com/';

module.exports = {
    name: 'render',
    data: new SlashCommandBuilder()
        .setName('renderworld')
        .setDescription('Render a growtopia world!')
        .addStringOption(option => 
            option
                .setName('name')
                .setDescription('Insert a world name.')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('credit')
                .setDescription('Insert the credit (who made the pixel art).')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('character')
                .setDescription('Insert the character name (if any).')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('series')
                .setDescription('Insert the series name (if any).')
                .setRequired(false)),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const options = getInteractionOptions(interaction);
            const imageUrl = await getImageUrl(worldRenderLink + addExtension(options.name, 'png'));

            if (typeof imageUrl === 'object' && imageUrl.message) {
                await interaction.followUp({ content: imageUrl.message });
                    
                return;
            }

            const embed = await createEmbed(interaction, options, imageUrl);
            await interaction.deleteReply();
            await interaction.channel.send({ embeds: [embed] });

        } catch (error) {
            await handleError(error, __filename);
        }
    }
}

function getInteractionOptions(interaction) {
    return {
        name: interaction.options.getString('name'),
        character: interaction.options.getString('character'),
        series: interaction.options.getString('series'),
        credit: interaction.options.getString('credit')
    };
}

async function getImageUrl(originalUrl) {
    const response = await fetch(originalUrl);

    if (!response.ok) return { message: 'World render not found, either world is not rendered or the bot is on mental breakdown.' };

    const attachment = await createAttachment(response, 'buffer');

    const channel = await fetchChannel(process.env.IMAGE_CACHE_CHANNEL_ID);
    const message = await channel.send({
        files: [attachment]
    });

    return message.attachments.first().proxyURL;
}

async function fetchChannel(channelId) {
    let channel;
    channel = client.channels.cache.get(channelId);

    if (!channel) {
        channel = await client.channels.fetch(channelId);
    }

    return channel;
}

async function createEmbed(interaction, options, image) {
    const { name, credit, character, series } = options;

    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle('Growtopia World Render')
        .setFields({
            name: 'World Name',
            value: name.toUpperCase(),
            inline: true 
        })
        .setImage(image)
        .setFooter({ 
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL()
        });

    if (credit) {
        embed.addFields({
            name: 'Credit',
            value: credit,
            inline: true
        });
    }

    if (character) {
        embed.addFields({
            name: 'Character',
            value: character,
            inline: true
        });
    }

    if (series) {
        embed.addFields({
            name: 'Series',
            value: series,
            inline: true
        });
    }

    return embed;
}

async function createAttachment(response, type = 'buffer') {
    let imageBuffer;

    if (type === 'buffer') {
        const imageArrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(imageArrayBuffer);
    }

    if (type === 'chunk' || type === 'byob') {
        let reader;
        const chuck = []; 
        // reader = response.body.getReader();
        type === 'byob' ? reader = response.body.getReader({ mode: 'byob' }) : reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chuck.push(value);
        }

        imageBuffer = Buffer.concat(chuck);
    }

    return new AttachmentBuilder(imageBuffer);
}

async function measurePerformance(fn, ...args) {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    const elapsedTime = endTime - startTime;
    console.log(`Elapsed time: ${elapsedTime}ms`);

    return result instanceof Promise ? await result : result
}