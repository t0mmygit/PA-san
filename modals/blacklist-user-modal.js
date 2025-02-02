const { EmbedBuilder, codeBlock } = require("discord.js");

module.exports = async (interaction) => {
    const userId = interaction.fields.getTextInputValue("userId");
    const discordId = interaction.fields.getTextInputValue("discordId");
    const reason = interaction.fields.getTextInputValue("reasonId");

    const embed = constructEmbed({
        userId: userId,
        discordId: discordId,
        reason: reason,
    });

    await interaction.reply({ embeds: [embed] });
};

function constructEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle("Blacklisted User")
        .setFields({ name: "GrowID", value: data.userId, inline: true });

    if (data.discordId.length > 0) {
        embed.addFields({
            name: "Discord Username",
            value: data.discordId,
            inline: true,
        });
    }
    embed.addFields({ name: "\u2008", value: codeBlock(data.reason) });

    return embed;
}
