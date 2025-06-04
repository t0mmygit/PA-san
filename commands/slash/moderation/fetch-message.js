const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    bold,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("fetch-message")
        .setDescription("Fetch message.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option
                .setName("message-id")
                .setDescription("The message ID to fetch.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("new-content")
                .setDescription("The message content")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option.setName("is-bold").setDescription("Enable bold to content.")
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            const messageId = interaction.options.getString("message-id");
            const newContent = interaction.options.getString("new-content");
            const isBold = interaction.options.getBoolean("is-bold");

            const channel = await interaction.channel;
            const targetMessage = await channel.messages.fetch(messageId);

            if (!targetMessage) {
                await interaction.followUp({
                    content: `Could not find the message with provided message ID: ${messageId}`,
                });
                return;
            }
            console.info("Target Message: ", targetMessage);

            if (!newContent) return;
            await targetMessage.edit({
                content: isBold ? bold(newContent) : newContent,
            });

            await interaction.followUp({
                content: "Message has been updated!",
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};
