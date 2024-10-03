const { SlashCommandBuilder } = require('discord.js');

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
        const channel = interaction.channel;

        channel.messages.fetch(messageID)
            .then(message => interaction.reply(message.content))
            .catch(console.error);
    }
}