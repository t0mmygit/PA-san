const {
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder,
    bold,
} = require("discord.js");
const { COLOR_SECONDARY } = require("@/constant.js");
const { addExtension } = require("@utils");
const { handleError } = require("@handlers/errorHandler");
const webhook = require("@handlers/webhookHandler");
const worldRenderLink = "https://s3.amazonaws.com/world.growtopiagame.com/";

module.exports = {
    name: "render",
    data: new SlashCommandBuilder()
        .setName("renderworld")
        .setDescription("Render a growtopia world!")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("Insert a world name.")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("credit")
                .setDescription("Insert the credit (who made the pixel art).")
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
            await interaction.deferReply();

            const options = getInteractionOptions(interaction);
            const fetchResponse = await fetch(
                worldRenderLink + addExtension(options.name, "png")
            );

            if (!fetchResponse.ok) {
                await interaction.followUp({
                    content: "Render not found! Is this world rendered?",
                });

                return;
            }
            const imageUrl = await getImageUrl(fetchResponse, interaction);
            const embed = await createEmbed(interaction, options, imageUrl);

            await interaction.followUp({ embeds: [embed] });
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

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
