const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    bold,
} = require("discord.js");
const { Channel, Guild } = require("@models");
const schema = require("@schemas/channel-settings");
const { handleError } = require("@handlers/errorHandler");
const userHasPermission = require("@middlewares/userHasPermission");

module.exports = {
    middlewares: [userHasPermission([PermissionFlagsBits.Administrator])],
    data: new SlashCommandBuilder()
        .setName("allow-delete-by-reaction")
        .setDescription(
            "Allow to delete message by reaction for this channel."
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (!isModerator(interaction.member)) {
                await interaction.followUp({
                    content: "You do not have permission to use this command!",
                });
                return;
            }

            await setDeleteByReaction(interaction);

            await interaction.followUp({
                content: bold(
                    `Users can now delete messages from this bot using the '❌' reaction for this channel.`
                ),
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

function isModerator(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

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
