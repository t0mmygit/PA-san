const {
    SlashCommandBuilder,
    AttachmentBuilder,
    EmbedBuilder,
    inlineCode,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");

const environmentAPIUrl =
    process.env.NODE_ENV === "production"
        ? process.env.API_URL_PROD
        : process.env.API_URL_DEV;

const APIHttpLocalRoute = environmentAPIUrl + "preview";
console.log("Command Endpoint: ", APIHttpLocalRoute);

const algorithm_options = [
    { name: "Atkinson Dithering", value: "atkinson" },
    { name: "Nearest Neighbour Interpolation", value: "nearest_neighbor" },
];
const resize_options = ["strict", "width_only"];

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
            const APIResponse = await response.json();

            const buffer = await getImageBuffer(APIResponse);

            console.log("Replying...");
            await handleDiscordResponse(
                interaction,
                options,
                buffer,
                APIResponse
            );
        } catch (error) {
            await handleErrorResponse(interaction);
            await handleError(error, __filename);
        }
    },
};

async function handleDiscordResponse(
    interaction,
    options,
    buffer,
    APIResponse
) {
    const attachment = new AttachmentBuilder(buffer, { name: "image.png" });

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
        );

    const message = await interaction.editReply({
        embeds: [embeds],
        files: [attachment],
    });

    console.info("Replying to this embeds: ", message);
    const paletteLines = constructPalette(APIResponse.palette);
    await sendPaginatedPalette(message, paletteLines);

    console.info("Response successful!");
}

function constructPalette(palette) {
    return palette.map((color) => {
        return `${color.name}: ${color.count}`;
    });
}

async function sendPaginatedPalette(
    interaction,
    paletteLines,
    title = "Color Palette"
) {
    const embeds = [];
    const linesPerPage = 20;

    for (let i = 0; i < paletteLines.length; i += linesPerPage) {
        const chunk = paletteLines.slice(i, i + linesPerPage);
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(chunk.join("\n"))
            .setFooter({
                text: `Page ${Math.ceil((i + linesPerPage) / linesPerPage)} of ${Math.ceil(paletteLines.length / linesPerPage)}`,
            });
        embeds.push(embed);
    }
    if (embeds.length === 0) return;

    const createButtons = (currentPage) => {
        return new ActionRowBuilder().setComponents(
            new ButtonBuilder()
                .setCustomId("prev_page")
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === 0),
            new ButtonBuilder()
                .setCustomId("next_page")
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(currentPage === embeds.length - 1)
        );
    };

    const message = await interaction.reply({
        embeds: [embeds[0]],
        components: [createButtons(0)],
        fetchReply: true,
    });

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000,
    });

    let currentPage = 0;
    collector.on("collect", async (buttonInteraction) => {
        if (buttonInteraction.user.id !== interaction.interaction.user.id)
            return;

        await buttonInteraction.deferUpdate();
        if (buttonInteraction.customId === "prev_page") {
            currentPage--;
        } else if (buttonInteraction.customId === "next_page") {
            currentPage++;
        }

        await message.edit({
            embeds: [embeds[currentPage]],
            components: [createButtons(currentPage)],
        });

        collector.on("end", async () => {
            const finalComponents = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("prev_page_disabled")
                    .setLabel("Previous")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next_page_disabled")
                    .setLabel("Next")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );

            await message.edit({
                components: [finalComponents],
            });
        });
    });
}

async function handleErrorResponse(interaction) {
    await interaction.editReply(
        "This bot sucks. Unable fulfill your request, i blame prxer."
    );
}

async function getImageBuffer(response) {
    return Buffer.from(response.image, "base64");
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
