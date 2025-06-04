const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    bold,
} = require("discord.js");
const { Channel, Guild } = require("@models");
const { handleError } = require("@handlers/errorHandler");
const schema = require("@schemas/channel-settings");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("allow-delete-by-reaction")
        .setDescription("Allow to delete message by reaction for this channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            await setDeleteByReaction(interaction);

            await interaction.followUp({
                content: bold(
                    `Users can now delete messages from this bot using the '🗑️' reaction for this channel.`
                ),
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

async function setDeleteByReaction(interaction) {
    try {
        let channel = await Channel.findOne({
            where: { discord_channel_id: interaction.channelId },
        });

        if (!channel) {
            const [guild] = await Guild.findOrCreate({
                where: { server_id: interaction.guildId },
            });

            channel = await guild.createChannel({
                discord_channel_id: interaction.channelId,
            });
        }

        const settings = schema.validate({ allowDeleteByReaction: true });
        console.table(settings);

        await channel.update({ settings: JSON.stringify(settings) });
    } catch (error) {
        await handleError(error, __filename);
    }
}
