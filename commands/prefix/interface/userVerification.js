const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    async execute(message) {
        const confirm = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Primary);

        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(cancel, confirm);

        const response = await message.reply({
            content: `Hey! You're new here, please first verify your account.`,
            components: [row],
        });       

        const filter = (interaction) => interaction.user.id === message.author.id;
        const confirmation = await response.awaitMessageComponent({ filter: filter, time: 60_000 });

        if (confirmation.customId === 'verify') {
            await confirmation.reply({ content: 'Your account has been verified!' });
        }

        if (confirmation.customId === 'cancel') {
            await confirmation.reply({ content: 'Your account has not been verified!' });
        }
    },
}