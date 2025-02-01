const { ModalBuilder, TextInputBuilder } = require("@discordjs/builders");
const {
    SlashCommandBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blacklist-user")
        .setDescription("Blacklist a user"),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("modal")
            .setTitle("Create blacklist");

        const userInput = new TextInputBuilder()
            .setCustomId("userId")
            .setLabel("GrowID")
            .setMinLength(3)
            .setMaxLength(18)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const discordInput = new TextInputBuilder()
            .setCustomId("discordId")
            .setLabel("Discord Username (if eligible)")
            .setMinLength(2)
            .setMaxLength(32)
            .setStyle(TextInputStyle.Short);

        const reasonInput = new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Reason")
            .setMinLength(8)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const userActionRow = new ActionRowBuilder().addComponents(userInput);
        const discordActionRow = new ActionRowBuilder().addComponents(
            discordInput
        );
        const reasonActionRow = new ActionRowBuilder().addComponents(
            reasonInput
        );

        modal.addComponents(userActionRow, discordActionRow, reasonActionRow);
        await interaction.showModal(modal);
    },
};
