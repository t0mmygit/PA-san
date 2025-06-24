const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    userMention,
} = require("discord.js");
const { Channel, Guild } = require("@models");
const { handleError } = require("@handlers/errorHandler");
const schema = require("@schemas/channel-settings");
const { sequelize } = require("@models");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear-channel-settings")
        .setDescription("Clear the current channel's settings")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await resetCurrentChannel(interaction);

            await interaction.editReply({
                content: `${userMention(interaction.user.id)} This channel's settings has been reset.`,
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

async function resetCurrentChannel(interaction) {
    const { guildId, channelId } = interaction;

    await sequelize.transaction(async (t) => {
        const channel = await Channel.findOne({
            where: { discord_channel_Id: channelId },
        });

        await channel.update({
            settings: JSON.stringify(schema.validate({})),
        });

        await channel.save();

        if (!channel) {
            const [guild] = await Guild.findOrCreate({
                where: { server_id: guildId },
                transaction: t,
            });

            await guild.createChannel(
                {
                    discord_channel_id: channelId,
                },
                { transaction: t }
            );
        }
    });
}
