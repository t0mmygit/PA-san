const {
    Routes,
    SlashCommandBuilder,
    StringSelectMenuOptionBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    inlineCode,
    DiscordjsErrorCodes,
    PermissionFlagsBits,
    bold,
    EmbedBuilder,
} = require("discord.js");
const { Guild } = require("@models");
const { join } = require("node:path");
const { readdirSync } = require("node:fs");
const { COLLECTOR_TIME, COLOR_INFO } = require("@/constant.js");
const { handleError } = require("@handlers/errorHandler");
const userHasPermission = require("@middlewares/userHasPermission");
const { COLOR_ERROR } = require("../../../constant");

module.exports = {
    middlewares: [userHasPermission([PermissionFlagsBits.Administrator])],
    data: new SlashCommandBuilder()
        .setName("command")
        .setDescription("Command Descriptions"),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const selectedGuildId = await handleGuildSelection(interaction);
            if (!selectedGuildId)
                throw new Error("[Operation Aborted] No Selected Guild ID!");

            const guildCategories = await getGuildCategories(selectedGuildId);
            const currentCategories = [...new Set(guildCategories)];
            const categories = getSlashCommandCategories();

            await handleCategoryToggle(
                interaction,
                currentCategories,
                categories,
                selectedGuildId
            );

            console.info(__filename, " completed.");
        } catch (error) {
            await handleError(error, __filename);
        }
    },
};

async function handleGuildSelection(interaction) {
    const guilds = interaction.client.guilds.cache;
    const guildSelectMenu = createGuildSelectMenu([...guilds.values()]);

    const response = await interaction.editReply({
        content: "Please select a server to manage",
        components: [guildSelectMenu],
    });

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: COLLECTOR_TIME,
        });

        if (confirmation.customId !== "guild_select") return;
        await confirmation.update({
            content: bold("[Completed] Please proceed with the next prompt."),
            components: [],
        });

        return confirmation.values[0];
    } catch (error) {
        if (error?.code === DiscordjsErrorCodes.InteractionCollectorError) {
            await response.edit({
                content: bold(
                    "[Session Expired] Confirmation not received within 1 minute."
                ),
                components: [],
            });
        } else {
            throw error;
        }
    }
}

async function handleCategoryToggle(
    interaction,
    currentCategories,
    categories,
    guildId
) {
    const guild = await interaction.client.guilds.fetch(guildId);
    const categoryMenu = createCategorySelectMenu(
        currentCategories,
        categories
    );
    const embed = createGuildInfoEmbed(guild);

    const response = await interaction.followUp({
        embeds: [embed],
        components: [categoryMenu],
        withResponse: true,
    });

    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: COLLECTOR_TIME,
        });

        if (confirmation.customId !== "command_menu") return;
        await handleCategoryUpdate(
            confirmation,
            currentCategories,
            confirmation.values[0],
            guildId
        );

        await confirmation.update({
            embeds: [embed.setColor(COLOR_INFO)],
            components: [],
        });
    } catch (error) {
        if (error?.code === DiscordjsErrorCodes.InteractionCollectorError) {
            await response.edit({
                content: bold(
                    "[Session Expired] Confirmation not received within 1 minute."
                ),
                embeds: [embed.setColor(COLOR_ERROR)],
                components: [],
            });
        } else {
            throw error;
        }
    }
}

function createGuildInfoEmbed(guild) {
    return new EmbedBuilder()
        .setTitle("Server Configuration")
        .setDescription(bold(guild.name))
        .addFields({ name: "Server ID", value: guild.id, inline: true })
        .setThumbnail(guild.iconURL())
        .setTimestamp();
}

async function handleCategoryUpdate(
    confirmation,
    currentCategories,
    folder,
    guildId
) {
    let newCategories;
    if (currentCategories.includes(folder)) {
        newCategories = currentCategories.filter(
            (category) => category !== folder
        );
        await confirmation.message.edit({
            content: `${inlineCode(folder)} ${bold("has been disabled.")}`,
        });
    } else {
        newCategories = [...currentCategories, folder];
        await confirmation.message.edit({
            content: `${inlineCode(folder)} ${bold("has been enabled.")}`,
        });
    }

    const commands = [];
    console.table(newCategories);
    for (const category of newCategories) {
        const commandArray = getFolderCommands(category);
        commands.push(...commandArray);
    }
    await refreshGuildCommands(confirmation, commands);
    await setGuildCategory(guildId, newCategories);
}

function createGuildSelectMenu(guilds) {
    const options = guilds.map((guild) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(guild.name)
            .setDescription(guild.id)
            .setValue(guild.id)
    );

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("guild_select")
            .setPlaceholder("Select a server to manage")
            .addOptions(options)
    );
}

function createCategorySelectMenu(currentCategories, categories) {
    const selectMenuOptions = categories.map((category) => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(category)
            .setDescription(
                currentCategories.includes(category) ? "Enabled" : "Disabled"
            )
            .setValue(category.toLowerCase());
    });

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("command_menu")
            .setPlaceholder("Select a command to toggle")
            .addOptions(selectMenuOptions)
    );
}

async function setGuildCategory(id, categories) {
    const guild = await Guild.findOne({
        where: {
            server_id: id,
        },
    });
    const array = categories.length > 0 ? categories : [];

    await guild.update({ category: JSON.stringify(array.flat()) });
}

async function getGuildCategories(id) {
    const [guild, _] = await Guild.findOrCreate({
        where: {
            server_id: id,
        },
    });

    return JSON.parse(guild.category).flat();
}

async function refreshGuildCommands(confirmation, commands) {
    await confirmation.client.rest.put(
        Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            confirmation.guildId
        ),
        { body: commands }
    );
}

function getSlashCommandCategories() {
    const foldersPath = join(process.cwd(), "commands/slash");
    return readdirSync(foldersPath).filter((folder) => folder !== "general");
}

function getFolderCommands(folder) {
    const commands = [];
    const commandsPath = join(process.cwd(), `commands/slash/${folder}`);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
        file.endsWith(".js")
    );

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }

    return commands;
}
