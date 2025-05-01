const {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");

const APIHttpLocalRoute = "http://host.docker.internal:5000/preview";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("atkinson")
        .setDescription("Atkinson")
        .addAttachmentOption((option) =>
            option
                .setName("file")
                .setDescription("file description")
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log("Running Atkinson Command...");
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment("file");

        if (!attachment.contentType?.startsWith("image/")) {
            await interaction.editReply("Please provide a valid image file.");
            return;
        }

        try {
            const imageObject = await fetch(attachment.url);
            const imageBlob = await imageObject.blob();

            const response = await fetchResponse(
                imageBlob,
                attachment.filename,
                attachment.contentType
            );
            const buffer = await getResponseBuffer(response);

            console.log("Replying...");
            await handleDiscordResponse(interaction, buffer);
        } catch (error) {
            await handleErrorResponse(interaction);
            await handleError(error, __filename);
        }
    },
};

async function handleDiscordResponse(interaction, buffer) {
    const attachment = new AttachmentBuilder(buffer, { name: "image.png" });
    const footer = {
        text: "This is just copium, do not rely 100% on this.",
    };

    const embeds = new EmbedBuilder()
        .setTitle("Image Generated")
        .setImage("attachment://image.png")
        .setFooter(footer);

    await interaction.editReply({
        embeds: [embeds],
        files: [attachment],
    });
}

async function handleErrorResponse(interaction) {
    await interaction.editReply(
        "This bot sucks. Unable fulfill your request, i blame prxer."
    );
}

async function getResponseBuffer(response) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
}

async function fetchResponse(blob, filename, contentType) {
    try {
        const formData = new FormData();
        formData.append("image", blob, {
            filename: filename,
            contentType: contentType,
        });

        const response = await fetch(APIHttpLocalRoute, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(
                `API error (${response.status}): ${response.text()}`
            );
        }

        return response;
    } catch (error) {
        throw error;
    }
}
