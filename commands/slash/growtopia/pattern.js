const {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");

const APIHttpLocalRoute = "http://host.docker.internal:5000/combined";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pattern")
        .setDescription("pattern")
        .addAttachmentOption((option) =>
            option
                .setName("file")
                .setDescription("file description")
                .setRequired(true)
        ),
    async execute(interaction) {
        console.log("Running Pattern Command...");
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
                attachment.name,
                attachment.contentType
            );
            if (response.headers.get("content-type") !== "application/json") {
                throw new Error(
                    "Unexpected response format: ${response.headers.get('content-type')}"
                );
            }
            const buffers = await getResponseBuffer(response);

            console.log("Replying...");
            await handleDiscordResponse(interaction, buffers);
        } catch (error) {
            await handleErrorResponse(interaction);
            await handleError(error, __filename);
        }
    },
};

async function handleDiscordResponse(interaction, buffer) {
    const imageAttachment = new AttachmentBuilder(buffer.imageBuffer, {
        name: buffer.image_filename,
    });
    const pdfAttachment = new AttachmentBuilder(buffer.pdfBuffer, {
        name: buffer.pdf_filename,
    });
    const footer = { text: "Note: This is not an official render." };

    const embeds = new EmbedBuilder()
        .setTitle("Dithered Image Generated")
        .setDescription("Please refer to attached PDF for detailed view.")
        .setImage(`attachment://${buffer.image_filename}`)
        .setFooter(footer)
        .setTimestamp();

    await interaction.editReply({
        embeds: [embeds],
        files: [imageAttachment, pdfAttachment],
    });
}

async function handleErrorResponse(interaction) {
    await interaction.editReply(
        "This bot sucks. Unable fulfill your request, i blame prxer."
    );
}

async function getResponseBuffer(response) {
    const json = await response.json();
    console.log("JSON: ", json);

    const imageBuffer = Buffer.from(json.image, "base64");
    const pdfBuffer = Buffer.from(json.pdf, "base64");

    return {
        imageBuffer: imageBuffer,
        pdfBuffer: pdfBuffer,
        image_filename: json.image_filename,
        pdf_filename: json.pdf_filename,
    };
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
            const errorText = await response.text();
            throw new Error(`API error (${response.status}): ${errorText}`);
        }

        return response;
    } catch (error) {
        throw error;
    }
}
