const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    bold,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    EmbedBuilder,
    inlineCode,
} = require("discord.js");
const {
    COLOR_SECONDARY,
    COLOR_SUCCESS,
    COLOR_ERROR,
    COLLECTOR_TIME,
} = require("@/constant.js");
const { Channel, Guild } = require("@models");
const { handleError } = require("@handlers/errorHandler");
const channelSchema = require("@schemas/channel-settings");
const appHasPermission = require("@middlewares/appHasPermission");
const userHasPermission = require("@middlewares/userHasPermission");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("toggle-qualify-by-reaction")
        .setDescription(
            "Toggle to qualify message by reaction for this channel."
        ),

    middlewares: [
        userHasPermission([PermissionFlagsBits.Administrator]),
        appHasPermission([
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
        ]),
    ],

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        if (!isModerator(interaction.member)) {
            await interaction.followUp({
                content: "You do not have permission to use this command!",
            });
        }
        await qualifyByReaction(interaction);
    },
};

function isModerator(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator);
}

async function qualifyByReaction(interaction) {
    const [channel, channelSettings] = await getChannelSettings(interaction);
    const [embed, row] = buildConfirmationEmbed(channelSettings);

    const response = await interaction.editReply({
        embeds: [embed.setColor(COLOR_SECONDARY)],
        components: [row],
    });

    await handleResponse(response, embed, channel, channelSettings);
}

async function getChannel(interaction) {
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

    return channel;
}

/*
 * Retrieve then validates channel settings.
 *
 * @param {Object} interaction
 * @returns {[Object, Object]}
 */
async function getChannelSettings(interaction) {
    const channel = await getChannel(interaction);

    // 'validateAsync' argument requires JavaScript object instead of JSON format.
    const parsedSettings = JSON.parse(channel.settings);
    const validatedSettings = await validateChannelSettings(parsedSettings);
    console.log("Validated Settings: ", validatedSettings);

    return [channel, validatedSettings];
}

async function validateChannelSettings(settings) {
    try {
        return await channelSchema.validateAsync(settings.value);
    } catch (error) {
        // Temporary solution.
        console.error(
            "[Unsolved Validation Error] Channel Settings Validation Error!"
        );
    }
}

function buildConfirmationEmbed(settings) {
    console.log(
        "Settings showed for embed [normal/inverse]: ",
        settings.allowQualifyByReaction,
        !settings.allowQualifyByReaction
    );
    const embed = new EmbedBuilder()
        .setTitle("Channel Settings Configuration")
        .setDescription(
            `Set ${inlineCode("Qualify By Reaction")} to ${bold(!settings.allowQualifyByReaction)}?`
        );

    const confirm = new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);

    return [embed, row];
}

async function handleResponse(response, embed, channel, channelSettings) {
    const collectorFilter = (interaction) =>
        interaction.user.id === response.interaction.user.id;

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: collectorFilter,
            time: COLLECTOR_TIME,
        });

        if (confirmation.customId === "confirm") {
            const updatedSettings = await updateSettings(
                channel,
                channelSettings
            );
            const parsedSettings = JSON.parse(updatedSettings).value;

            const confirmedEmbed = embed
                .setColor(COLOR_SUCCESS)
                .setDescription(
                    `${inlineCode("Qualify By Reaction")} had set to ${bold(parsedSettings.allowQualifyByReaction)}!`
                );

            await confirmation.update({
                content: bold("Confirmed!"),
                embeds: [confirmedEmbed],
                components: [],
            });
        } else if (confirmation.customId === "cancel") {
            await confirmation.update({
                content: bold("Cancelled!"),
                embeds: [embed.setColor(COLOR_ERROR)],
                components: [],
            });
        }
    } catch (error) {
        await handleError(error, __filename);
    }
}
/*
 * Inverse `allowQualifyByReaction` boolean value.
 *
 * @param {Object} channel
 * @param {Object} channelSettings
 * @returns {JSON}
 */
async function updateSettings(channel, channelSettings) {
    channelSettings.allowQualifyByReaction =
        !channelSettings.allowQualifyByReaction;

    const settings = JSON.stringify({
        value: channelSettings,
    });
    await channel.set({ settings: settings });
    await channel.save();

    return channel.settings;
}
