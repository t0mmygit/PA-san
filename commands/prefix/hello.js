const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Reply you with hello!'),
    execute(message) {
        const details = {
            message: message,
            channel: message.channel
        }

        message.channel.send(`Hello, ${message.user}!`)
        console.log(details)
    }
}