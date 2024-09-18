const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('button')
        .setDescription('Show buttons!'),
    async execute(interaction) {
        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const continueButton = new ButtonBuilder()
            .setCustomId('continue')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
			.addComponents(cancelButton, continueButton);

        await interaction.reply({
            content: `Are you sure to continue?`,
            components: [row],
        });
    },
};