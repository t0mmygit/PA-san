const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLOR_SECONDARY } = require("@/constant.js");
const { addExtension } = require('@utils');
const growtopiaWorldRenderLink = 'https://s3.amazonaws.com/world.growtopiagame.com/';

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
        const name = interaction.options.getString('name'); 
        const credit = interaction.options.getString('credit');
        const character = interaction.options.getString('character') || undefined;
        const series = interaction.options.getString('series') || undefined;

        const imageResponse = await fetch(growtopiaWorldRenderLink + addExtension(name, 'png'));
        if (!imageResponse.ok) {
            await interaction.reply({ content: 'There was an error rendering the world! Either not rendered or the bot is down.', ephemeral: true });

            return;
        } 

        const embed = new EmbedBuilder()
            .setColor(COLOR_SECONDARY)
            .setTitle('Growtopia World Render')
            .setFields({
                name: 'World Name',
                value: name.toUpperCase(),
                inline: true 
            })
            .setImage(imageResponse.url)
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

        await interaction.reply({ embeds: [embed] }); }
}