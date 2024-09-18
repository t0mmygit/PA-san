const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drop')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.reply('Dropped!');
    },
};