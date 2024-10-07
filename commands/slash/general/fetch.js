const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleError } = require('@handlers/errorHandler');
const { COLOR_SECONDARY } = require("@/constant.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetch')
        .setDescription('Fetch a message!')
        .addStringOption(option => 
            option.setName('id')
                .setDescription(`Insert the message ID.`)
                .setRequired(true)),
    async execute(interaction) {
        const messageID = interaction.options.getString('id');
        try {
            const message = await interaction.channel.messages.fetch(messageID);

            if (!message) {
                const response = await interaction.reply({
                    content: 'No message found!',
                    ephemeral: true,
                });

                setTimeout(() => {
                    response.delete();
                });
            }

            const embed = createEmbed(message);

            await interaction.reply({
                embeds: [embed]
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    }
}

function createEmbed(message) {
    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle('Message detail');

    if (message.content) {
        embed.addFields({
            name: 'Content',
            value: message.content
        });
    }

    return embed;
}