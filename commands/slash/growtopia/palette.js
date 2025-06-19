const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    codeBlock,
    TextDisplayBuilder,
    SectionBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    StringSelectMenuBuilder,
    MessageFlags,
    heading,
    HeadingLevel,
    inlineCode,
    ComponentType,
    StringSelectMenuOptionBuilder,
    SlashCommandSubcommandBuilder,
    userMention,
    subtext,
} = require("discord.js");
const { handleError } = require("@handlers/errorHandler");
const { sequelize, User, Palette, UserPalette } = require("@models");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("palette")
        .setDescription("Interact with palette module.")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("default")
                .setDescription("View default palette.")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("create")
                .setDescription("Create a new custom palette.")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("Enter your custom palette name")
                        .setRequired(true)
                )
                .addAttachmentOption((option) =>
                    option
                        .setName("file")
                        .setDescription("Insert your palette file (txt)")
                        .setRequired(true)
                )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("delete")
                .setDescription("Delete a custom palette.")
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            switch (interaction.options.getSubcommand()) {
                case "default":
                    await viewDefaultPalette(interaction);
                    break;
                case "create":
                    await createCustomPalette(interaction);
                    await interaction.followUp({
                        content: "Created a new custom palette.",
                    });
                    break;
                case "delete":
                    const response = await interaction.followUp({
                        components:
                            await buildDeleteCustomPaletteContainer(
                                interaction
                            ),
                        flags: MessageFlags.IsComponentsV2,
                    });

                    await handleSelectionCollector(interaction, response);
                    break;
            }
        } catch (error) {
            await handleError(error, __filename);
            await interaction.followUp(
                `${userMention(interaction.user.id)} ${error.message}`
            );
        }
    },
};

async function viewDefaultPalette(interaction) {
    const response = await interaction.followUp({
        components: await buildDefaultPaletteContainer(interaction),
        flags: MessageFlags.IsComponentsV2,
    });

    await handleButtonCollector(interaction, response);
    await handleSelectionCollector(interaction, response);
}

async function createCustomPalette(interaction) {
    const name = interaction.options.getString("name");
    const attachment = interaction.options.getAttachment("file");

    if (!attachment.contentType.startsWith("text/plain")) {
        const response = await interaction.followUp({
            content: `${userMention(interaction.user.id)} Invalid file input!`,
        });
        setTimeout(() => response.delete(), 3000);

        return;
    }

    try {
        const result = await sequelize.transaction(async (t) => {
            const [user, created] = await User.findOrCreate({
                where: { discordId: interaction.user.id },
            });

            if (!created) {
                // TO-DO: Check if name already exist; duplicated name.
                // Only allow maximum of 3 palette records for each user.
            }

            const response = await fetch(attachment.url);
            const text = await response.text();
            const catalog = {
                content: JSON.stringify(text),
            };

            const palette = await user.createPalette(
                { name: name, catalog: catalog, ownerId: user.id },
                { transaction: t }
            );

            return palette;
        });

        return result;
    } catch (error) {
        console.error(error);
    }
}

async function handleSelectionCollector(interaction, response) {
    const containsCustomId = (customId) =>
        ["activate-custom-palette", "delete-custom-palette"].includes(customId);

    const filter = (component) =>
        component.isStringSelectMenu() &&
        containsCustomId(component.customId) &&
        component.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
        filter: filter,
        componentType: ComponentType.StringSelect,
        time: 300_000,
    });

    collector.on("collect", async (interaction) => {
        switch (interaction.customId) {
            case "activate-custom-palette":
                await activateCustomPalette(interaction);
                break;
            case "delete-custom-palette":
                const deletedPalette = await deleteCustomPalette(interaction);
                await interaction.reply({
                    content: `${userMention(interaction.user.id)} Custom Palette ${inlineCode(deletedPalette.name)} deleted!`,
                });

                break;
        }
    });
}

async function activateCustomPalette(interaction) {
    const paletteId = interaction.values[0];

    try {
        await sequelize.transaction(async (t) => {
            const user = await User.findOne({
                where: { discordId: interaction.user.id },
                transaction: t,
            });

            if (!user) {
                throw new Error("User not found!");
            }

            const userId = user.id;

            await UserPalette.update(
                { isActive: false },
                { where: { userId }, transaction: t }
            );

            const userPalette = await UserPalette.findOne({
                where: { userId, paletteId },
                transaction: t,
            });

            if (userPalette) {
                await userPalette.update(
                    { isActive: true },
                    { transaction: t }
                );
            }
        });

        await interaction.reply({ content: "Palette activated successfully!" });
    } catch (error) {
        console.error("Error activating custom palette: ", error);
        await interaction.reply({
            content: "An error occurred while activating the palette.",
        });
    }
}

async function deleteCustomPalette(interaction) {
    try {
        const result = await sequelize.transaction(async (t) => {
            return await Palette.destroy({
                where: { id: interaction.values[0] },
                transaction: t,
            });
        });

        return result;
    } catch (error) {
        console.error(error);
    }
}

async function disableCustomPalette(interaction) {
    try {
        await sequelize.transaction(async (t) => {
            const user = await User.findOne({
                where: { discordId: interaction.user.id },
            });
            const userId = user.id;

            await UserPalette.update(
                { isActive: false },
                { where: { userId }, transaction: t }
            );
        });
    } catch (error) {
        console.error(error);
    }
}

async function handleButtonCollector(interaction, response) {
    const containsCustomId = (customId) =>
        ["back", "custom-palette", "reset"].includes(customId);

    const filter = (component) =>
        component.isButton() &&
        containsCustomId(component.customId) &&
        component.user.id === interaction.user.id;

    const collector = response.createMessageComponentCollector({
        filter: filter,
        componentType: ComponentType.Button,
        time: 300_000,
    });

    collector.on("collect", async (interaction) => {
        switch (interaction.customId) {
            case "back":
                await interaction.update({
                    components: await buildDefaultPaletteContainer(interaction),
                    flags: MessageFlags.IsComponentsV2,
                });
                break;
            case "custom-palette":
                await interaction.update({
                    components:
                        await buildActivateCustomPaletteContainer(interaction),
                    flags: MessageFlags.IsComponentsV2,
                });
                break;
            case "reset":
                await disableCustomPalette(interaction);
                await interaction.update({
                    components: await buildDefaultPaletteContainer(interaction),
                    flags: MessageFlags.IsComponentsV2,
                });
                break;
        }
    });

    collector.once("end", async (_, reason) => {
        if (reason !== "time") return;

        const { client, channelId, messageId } = collector;
        const channel = await client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        const container = message.components.filter(
            (component) => component.type !== 1
        );

        await message.edit({
            components: container,
            flags: MessageFlags.IsComponentsV2,
        });
    });
}

async function buildDefaultPaletteContainer(interaction) {
    const title = new TextDisplayBuilder({
        content: heading("Default Palette", HeadingLevel.Three),
    });

    const description = new TextDisplayBuilder({
        content: `There are currently ${inlineCode("N")} unique blocks.`,
    });

    const hasActive = await hasActivePalette(interaction.user.id);

    const information = hasActive
        ? "- You're currently using a custom palette."
        : "+ You're currently using the default palette.";
    const paletteInformation = new TextDisplayBuilder({
        content: codeBlock("diff", information),
    });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(title, description)
        .addSeparatorComponents(
            new SeparatorBuilder({
                spacing: SeparatorSpacingSize.Small,
                divider: true,
            })
        )
        .addTextDisplayComponents(paletteInformation);

    const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
            .setCustomId("reset")
            .setLabel("Reset to Default")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(hasActive ? false : true),
        new ButtonBuilder()
            .setCustomId("custom-palette")
            .setStyle(ButtonStyle.Primary)
            .setLabel("Custom Palette")
    );

    return [container, row];
}

async function buildActivateCustomPaletteContainer(interaction) {
    const title = new TextDisplayBuilder({
        content: heading("Custom Palette", HeadingLevel.Three),
    });
    const description = new TextDisplayBuilder({
        content: "This is the description sample.",
    });

    const backButton = new ButtonBuilder()
        .setCustomId("back")
        .setLabel("Back")
        .setStyle(ButtonStyle.Secondary);

    const upperSection = new SectionBuilder()
        .addTextDisplayComponents(title, description)
        .setButtonAccessory(backButton);

    const userPalettes = await getUserPalettes(interaction.user.id);
    const options = userPalettes.map((palette) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(palette.name)
            .setValue(palette.id)
    );

    const selectionPlaceholder =
        userPalettes.length > 0
            ? "Please choose a custom palette"
            : "Please create a custom palette";

    const paletteSelection = new ActionRowBuilder().setComponents(
        new StringSelectMenuBuilder()
            .setCustomId("activate-custom-palette")
            .setPlaceholder(selectionPlaceholder)
            .setMinValues(1)
            .setMaxValues(1)
            .setDisabled(userPalettes.length > 0 ? false : true)
            .setOptions(options)
    );

    const container = new ContainerBuilder()
        .addSectionComponents(upperSection)
        .addSeparatorComponents(
            new SeparatorBuilder({
                spacing: SeparatorSpacingSize.Small,
                divider: true,
            })
        )
        .addActionRowComponents(paletteSelection);

    const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder()
            .setCustomId("request-sample")
            .setLabel("Request Sample")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
    );

    return [container, row];
}

async function buildDeleteCustomPaletteContainer(interaction) {
    const title = new TextDisplayBuilder({
        content: heading("Delete Custom Palette", HeadingLevel.Three),
    });
    const description = new TextDisplayBuilder({
        content: "Choose a selection from the menu to delete a custom palette",
    });

    const userPalettes = await getUserPalettes(interaction.user.id);
    console.info("User Palette", userPalettes);

    if (userPalettes.length < 1) {
        return [
            new ContainerBuilder()
                .addTextDisplayComponents(title, description)
                .addSeparatorComponents(
                    new SeparatorBuilder({
                        spacing: SeparatorSpacingSize.Small,
                        divider: true,
                    })
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder({
                        content: codeBlock(
                            "diff",
                            "- No available custom palette"
                        ),
                    })
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder({
                        content: subtext(
                            `Please use the ${inlineCode("/palette create")} command`
                        ),
                    })
                ),
        ];
    }

    const options = userPalettes.map((palette) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(palette.name)
            .setValue(palette.id)
    );

    const paletteSelection = new ActionRowBuilder().setComponents(
        new StringSelectMenuBuilder()
            .setCustomId("delete-custom-palette")
            .setMinValues(1)
            .setMaxValues(1)
            .setDisabled(userPalettes.length > 0 ? false : true)
            .setOptions(options)
    );

    return [
        new ContainerBuilder()
            .addTextDisplayComponents(title, description)
            .addSeparatorComponents(
                new SeparatorBuilder({
                    spacing: SeparatorSpacingSize.Small,
                    divider: true,
                })
            )
            .addActionRowComponents(paletteSelection),
    ];
}
async function hasActivePalette(userDiscordId) {
    try {
        const result = await sequelize.transaction(async (t) => {
            const user = await User.findOne({
                where: { discordId: userDiscordId },
                transaction: t,
            });

            const userPalette = await UserPalette.findOne({
                where: { userId: user.id, isActive: true },
                transaction: t,
            });

            return userPalette;
        });

        return result ? true : false;
    } catch (error) {
        console.error(error);
    }
}

async function getUserPalettes(userId) {
    try {
        const [user] = await User.findOrCreate({
            where: { discordId: userId },
        });

        return await user.getPalettes();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
