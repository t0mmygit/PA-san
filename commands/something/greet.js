const { SlashCommandBuilder, Message } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greet')
        .setDescription('Greet with a message!')
        .addUserOption(option => 
            option.setName('user')
                .setDescription(`Insert username.`)
                .setRequired(true))
        .addStringOption(option => 
                option.setName('message')
                .setDescription('Insert your message.')),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message') ?? `Hello!`;
        
        interaction.reply(`Hey ${user}, ${interaction.user} greets you with a message: ${message}`);
    }
}