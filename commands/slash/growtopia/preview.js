const {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
    inlineCode,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");

const APIHttpLocalRoute = "http://host.docker.internal:5000/preview";

const algorithm_options = [
    { name: "Atkinson Dithering", value: "atkinson" },
    { name: "Nearest Neighbour Interpolation", value: "nearest_neighbor" },
];
const resize_options = ["original", "strict", "width_only"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("preview")
        .setDescription("Preview Description")
        .addAttachmentOption((option) =>
            option
                .setName("file")
                .setDescription("file description")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("algorithm")
                .setDescription("Algorithm description")
                .setRequired(true)
                .setChoices(
                    ...algorithm_options.map((algorithm) => ({
                        name: algorithm.name,
                        value: algorithm.value,
                    }))
                )
        )
        .addStringOption((option) =>
            option
                .setName("resize")
                .setDescription("Resize mode description")
                .setRequired(true)
                .setChoices(
                    ...resize_options.map((resize) => ({
                        name: resize,
                        value: resize,
                    }))
                )
        ),
    async execute(interaction) {
        console.log("Running Atkinson Command...");
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment("file");

        if (!attachment.contentType?.startsWith("image/")) {
            await interaction.editReply("Please provide a valid image file.");
            return;
        }

        const algorithm = interaction.options.getString("algorithm");
        if (!algorithm_options.some((option) => option.value !== algorithm)) {
            await interaction.editReply(
                "Please provide a valid algorithm; preferably from the available options."
            );
            return;
        }

        const resize = interaction.options.getString("resize");
        if (!resize_options.includes(resize)) {
            await interaction.editReply(
                "Please provide a valid resize mode; preferably from the available options."
            );
            return;
        }

        try {
            const imageObject = await fetch(attachment.url);
            const blob = await imageObject.blob();

            const options = {
                blob: blob,
                algorithm: algorithm,
                resize: resize,
            };

            const response = await fetchResponse(
                options,
                attachment.filename,
                attachment.contentType
            );
            const buffer = await getResponseBuffer(response);

            console.log("Replying...");
            await handleDiscordResponse(interaction, buffer, options);
        } catch (error) {
            await handleErrorResponse(interaction);
            await handleError(error, __filename);
        }
    },
};

async function handleDiscordResponse(interaction, buffer, options) {
    const attachment = new AttachmentBuilder(buffer, { name: "image.png" });
    const footer = {
        text: "This is just copium, do not rely 100% on this.",
    };

    const embeds = new EmbedBuilder()
        .setTitle("Image Generated")
        .setImage("attachment://image.png")
        .setFields(
            {
                name: "Algorithm",
                value: inlineCode(options.algorithm),
                inline: true,
            },
            {
                name: "Resize Mode",
                value: inlineCode(options.resize),
                inline: true,
            }
        )
        .setFooter(footer);

    await interaction.editReply({
        embeds: [embeds],
        files: [attachment],
    });
    console.info("Response successful!");
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

async function fetchResponse(options, filename, contentType) {
    try {
        const formData = new FormData();
        formData.append("image", options.blob, {
            filename: filename,
            contentType: contentType,
        });

        formData.append("algorithm", options.algorithm);
        formData.append("resize", options.resize);

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
