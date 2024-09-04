const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { COLOR_SECONDARY, COLOR_SUCCESS, COLOR_ERROR } = require('../../../constant');
const User = require('../../../models/User');

module.exports = {
    async execute(message) {
        const embed = new EmbedBuilder()
            .setTitle('User Verification')
            .setDescription(`Hey ${message.author.username}, you're new around here! Please click on the button below to verify your account.`)
            .setColor(COLOR_SECONDARY);

        const verifiedEmbed = new EmbedBuilder()
            .setTitle('User Verification')
            .setDescription('Your account has been verified!')
            .setColor(COLOR_SUCCESS);
                
        const cancelEmbed = new EmbedBuilder()
            .setTitle('User Verification')
            .setDescription('Your account verification has been cancelled.')
            .setColor(COLOR_ERROR);

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
            embeds: [embed],
            components: [row],
        });       

        const filter = (interaction) => interaction.user.id === message.author.id;
        const confirmation = await response.awaitMessageComponent({ filter: filter, time: 60_000 });

        try {
            if (confirmation.customId === 'verify') {
                const user = await User.create({ discordId: message.author.id });

                await confirmation.message.edit({ 
                    embeds: [verifiedEmbed],
                    components: [],
                });
                // Provide user with the available options after verification
            }

            if (confirmation.customId === 'cancel') {
                await confirmation.message.edit({
                    embeds: [cancelEmbed],
                    components: [],
                });
            }
        } catch (error) {
            await message.channel.send(error);
        }
    },
}