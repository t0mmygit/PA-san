const {
    SlashCommandBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    userMention,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ContainerBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    bold,
    inlineCode,
    subtext,
    heading,
    HeadingLevel,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler.js");
const { COLLECTOR_TIME } = require("@/constant,js");

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
const resize_options = [
    { name: "Strict", value: "strict" },
    { name: "Width Only", value: "width_only" },
];

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
                        name: resize.name,
                        value: resize.value,
                    }))
                )
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const attachment = interaction.options.getAttachment("file");

        if (!attachment.contentType?.startsWith("image/")) {
            await interaction.editReply("Please provide a valid image file.");
            return;
        }

        const algorithm = interaction.options.getString("algorithm");
        if (!algorithm_options.some((option) => option.value === algorithm)) {
            await interaction.editReply(
                "Please provide a valid algorithm; preferably from the available options."
            );
            return;
        }

        const resize = interaction.options.getString("resize");
        if (!resize_options.some((option) => option.value === resize)) {
            await interaction.editReply(
                "Please provide a valid resize mode; preferably from the available options."
            );
            return;
        }

        try {
            const imageObject = await fetch(attachment.url);
            const blob = await imageObject.blob();

            const controller = await APIController(
                { blob: blob, algorithm: algorithm, resize: resize },
                attachment.filename,
                attachment.contentType
            );
            const APIResponse = await controller.json();

            const imageBuffer = Buffer.from(APIResponse.image, "base64");
            const fileName = "image.jpg";

            const options = {
                algorithm: algorithm_options.find(
                    (option) => option.value === algorithm
                ),
                resize: resize_options.find(
                    (option) => option.value === resize
                ),
            };

            const response = await interaction.followUp({
                components: buildImageContainer(options, fileName),
                files: [new AttachmentBuilder(imageBuffer, { name: fileName })],
                flags: MessageFlags.IsComponentsV2,
            });

            const containsCustomId = (customId) =>
                ["show_palette", "back", "backward", "forward"].includes(
                    customId
                );
            const filter = (component) =>
                component.isButton() &&
                containsCustomId(component.customId) &&
                component.user.id === interaction.user.id;

            const collector = response.createMessageComponentCollector({
                filter: filter,
                componentType: ComponentType.Button,
                time: COLLECTOR_TIME,
            });

            await handleCollector(collector, options, APIResponse.palette, {
                buffer: imageBuffer,
                fileName: fileName,
            });
        } catch (error) {
            await interaction.editReply(
                `${userMention(interaction.user.id)} ${error.message}`
            );
            await handleError(error, __filename);
        }
    },
};

function buildImageContainer(options, fileName) {
    const title = new TextDisplayBuilder({
        content: heading("Image Generated", HeadingLevel.Three),
    });
    const description = new TextDisplayBuilder({
        content: "This is an estimation on how your render would look.",
    });

    const algorithmText = `\nAlgorithm: ${inlineCode(options.algorithm.name)}`;
    const resizeText = `\nResize: ${inlineCode(options.resize.name)}`;
    const informationText = new TextDisplayBuilder().setContent(
        bold("Information") + algorithmText + resizeText
    );

    const galleryItems = new MediaGalleryItemBuilder()
        .setURL(`attachment://${fileName}`)
        .setDescription("Image generated.");
    const gallery = new MediaGalleryBuilder().addItems(galleryItems);

    const footer = new TextDisplayBuilder({
        content: "This render uses the default palette",
    });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title)
        .addTextDisplayComponents(description)
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(informationText)
        .addMediaGalleryComponents(gallery)
        .addTextDisplayComponents(footer);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("show_palette")
            .setLabel("Show Palette")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId("download_file")
            .setLabel("Download PDF (currently disabled)")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );

    return [container, row];
}

function buildPaletteContainer(paletteInfo, currentPage, linesPerPage = 15) {
    const title = new TextDisplayBuilder({
        content: heading("Color Palette", HeadingLevel.Three),
    });
    const description = new TextDisplayBuilder({
        content: `There are ${inlineCode(paletteInfo.length)} unique blocks`,
    });

    const prevButton = new ButtonBuilder()
        .setCustomId("back")
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary);

    const upperSection = new SectionBuilder()
        .addTextDisplayComponents(title, description)
        .setButtonAccessory(prevButton);

    const paletteLines = paletteInfo.map(
        (palette) => `${palette.name}: ${palette.count}`
    );

    const totalPages = Math.ceil(paletteLines.length / linesPerPage);
    const startIndex = (currentPage - 1) * linesPerPage;
    const endIndex = Math.min(startIndex + linesPerPage, paletteLines.length);
    const currentPageLines = paletteLines.slice(startIndex, endIndex);
    const palette = currentPageLines.join("\n");

    const container = new ContainerBuilder()
        .addSectionComponents(upperSection)
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(new TextDisplayBuilder({ content: palette }))
        .addTextDisplayComponents(
            new TextDisplayBuilder({
                content: subtext(
                    `Showing lines ${startIndex + 1}-${endIndex + 1} of ${paletteLines.length + 1}`
                ),
            })
        );

    const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
            .setCustomId("backward")
            .setEmoji("⏪")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1),
        new ButtonBuilder()
            .setCustomId("page")
            .setLabel(`Page ${currentPage} of ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId("forward")
            .setEmoji("⏩")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages)
    );

    return [container, row];
}

async function handleCollector(collector, options, paletteInfo, imageData) {
    let currentPage = 1;

    collector.on("collect", async (interaction) => {
        if (interaction.customId === "show_palette") {
            currentPage = 1;
            await interaction.update({
                components: buildPaletteContainer(paletteInfo, currentPage),
                flags: MessageFlags.IsComponentsV2,
            });
        } else if (interaction.customId === "back") {
            await interaction.update({
                components: buildImageContainer(options, imageData.fileName),
                files: [
                    new AttachmentBuilder(imageData.buffer, {
                        name: imageData.fileName,
                    }),
                ],
                flags: MessageFlags.IsComponentsV2,
            });
        } else if (interaction.customId === "backward") {
            currentPage--;
            await interaction.update({
                components: buildPaletteContainer(paletteInfo, currentPage),
                flags: MessageFlags.IsComponentsV2,
            });
        } else if (interaction.customId === "forward") {
            currentPage++;
            await interaction.update({
                components: buildPaletteContainer(paletteInfo, currentPage),
                flags: MessageFlags.IsComponentsV2,
            });
        }
    });

    collector.once("end", async (_, reason) => {
        const { client, channelId, messageId } = collector;
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        if (reason === "time") {
            const container = message.components.filter(
                (component) => component.type !== 1
            );

            await message.edit({
                components: container,
                flags: MessageFlags.IsComponentsV2,
            });
        }
    });
}

async function APIController(options, filename, contentType) {
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
            const error = await response.json();
            throw new Error(error.message);
        }

        return response;
    } catch (error) {
        throw error;
    }
}
