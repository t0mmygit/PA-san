const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Reply you with hello!'),
    async execute(message) {
        await message.channel.send(`Hello, ${message.user}!`);
    }
}