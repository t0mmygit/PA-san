const { EmbedBuilder } = require("discord.js");
const { COLOR_ERROR } = require("../constant");

module.exports = async (interaction) => {
    const embeds = EmbedBuilder.from(interaction.message.embeds[0]).setColor(COLOR_ERROR);

    await interaction.update({
        content: `${interaction.user} has cancelled this action.`,
        embeds: [embeds],
        components: [],
    });
}