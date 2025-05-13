const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    bold,
    PermissionFlagsBits,
} = require("discord.js");
const { COLOR_SECONDARY } = require("@/constant.js");
const { addExtension } = require("@utils");
const { handleError } = require("@handlers/errorHandler");
const webhook = require("@handlers/webhookHandler");
const appHasPermission = require("@middlewares/appHasPermission");

module.exports = {
    middlewares: [
        appHasPermission([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
        ]),
    ],

    name: "renderworld-by-file",
    data: new SlashCommandBuilder()
        .setName("renderworld-by-file")
        .setDescription("Render a growtopia world!")
        .addAttachmentOption((option) =>
            option
                .setName("file")
                .setDescription("file description")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("Insert the world name.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("credit")
                .setDescription(
                    "Insert the credit (who made the pixel art). You can use Discord mention, e.g. @prxerkun."
                )
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("character")
                .setDescription("Insert the character name (if any).")
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName("series")
                .setDescription("Insert the series name (if any).")
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const options = getInteractionOptions(interaction);
            const imageURL = await fetchImageURL(interaction);

            const embed = await createEmbed(interaction, options, imageURL);

            await interaction.channel.send({ embeds: [embed] });
            await interaction.deleteReply();
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

async function fetchImageURL(interaction) {
    const attachment = interaction.options.getAttachment("file");

    if (!attachment.contentType?.startsWith("image/")) {
        await interaction.editReply("Please provide a valid image file.");
        return;
    }

    return attachment.url;
}

function getInteractionOptions(interaction) {
    return {
        name: interaction.options.getString("name").toLowerCase(),
        character: interaction.options.getString("character"),
        series: interaction.options.getString("series"),
        credit: interaction.options.getString("credit"),
    };
}

async function getImageUrl(response, interaction) {
    const attachment = await createAttachment(response, "buffer");
    attachment.setName(addExtension(interaction.user.id, "png"));

    const message = await webhook.send(
        {
            content: `Requested by ${bold(interaction.user.username)} from ${bold(interaction.guild.name)}.`,
            files: [attachment],
        },
        "image-cache"
    );

    return message.attachments[0].proxy_url;
}

async function createEmbed(interaction, options, image) {
    const { name, credit, character, series } = options;

    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Growtopia World Render")
        .setFields({
            name: "World Name",
            value: name.toUpperCase(),
            inline: true,
        })
        .setImage(image)
        .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL(),
        });

    if (credit) {
        embed.addFields({
            name: "Credit",
            value: credit,
            inline: true,
        });
    }

    if (character) {
        embed.addFields({
            name: "Character",
            value: character,
            inline: true,
        });
    }

    if (series) {
        embed.addFields({
            name: "Series",
            value: series,
            inline: true,
        });
    }

    return embed;
}

async function createAttachment(response, type = "buffer") {
    let imageBuffer;

    if (type === "buffer") {
        const imageArrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(imageArrayBuffer);
    }

    if (type === "chunk" || type === "byob") {
        let reader;
        const chuck = [];
        // reader = response.body.getReader();
        type === "byob"
            ? (reader = response.body.getReader({ mode: "byob" }))
            : (reader = response.body.getReader());

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chuck.push(value);
        }

        imageBuffer = Buffer.concat(chuck);
    }

    return new AttachmentBuilder(imageBuffer);
}
