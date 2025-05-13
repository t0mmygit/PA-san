const {
    Routes,
    SlashCommandBuilder,
    StringSelectMenuOptionBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    inlineCode,
    DiscordjsErrorCodes,
    PermissionFlagsBits,
} = require("discord.js");
const { Guild } = require("@models");
const { join } = require("node:path");
const { readdirSync } = require("node:fs");
const { COLLECTOR_TIME } = require("@/constant.js");
const { handleError } = require("@handlers/errorHandler");
const userHasPermission = require("@middlewares/userHasPermission");

module.exports = {
    middlewares: [userHasPermission([PermissionFlagsBits.Administrator])],
    data: new SlashCommandBuilder()
        .setName("command")
        .setDescription("Command Descriptions"),
    async execute(interaction) {
        await interaction.deferReply();

        const guildCategories = await getGuildCategories(interaction.guildId);
        console.table(guildCategories);
        const currentCategories = [...new Set(guildCategories)];

        const categories = getSlashCommandCategories();

        const selectMenuOptions = categories.map((category) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(category)
                .setDescription(
                    currentCategories.includes(category)
                        ? "Enabled"
                        : "Disabled"
                )
                .setValue(category.toLowerCase());
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("command_menu")
            .setPlaceholder("Select a command to toggle")
            .addOptions(selectMenuOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.followUp({
            content: "Please choose a category to toggle.",
            components: [row],
            withResponse: true,
        });

        const collectorFilter = (i) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({
                filter: collectorFilter,
                time: COLLECTOR_TIME,
            });

            if (confirmation.customId === "command_menu") {
                const folder = confirmation.values[0];

                let newCategories;
                if (currentCategories.includes(folder)) {
                    newCategories = currentCategories.filter(
                        (category) => category !== folder
                    );
                    await confirmation.reply({
                        content: `${inlineCode(folder)} has been removed.`,
                        components: [],
                        withResponse: false,
                    });
                } else {
                    newCategories = [...currentCategories, folder];
                    await confirmation.reply({
                        content: `${inlineCode(folder)} has been added.`,
                        components: [],
                        withResponse: false,
                    });
                }

                const commands = [];
                console.table(newCategories);
                for (const category of newCategories) {
                    const commandArray = getFolderCommands(category);
                    commands.push(...commandArray);
                }
                await refreshGuildCommands(confirmation, commands);
                await setGuildCategory(confirmation.guildId, newCategories);
                console.info(__filename, " completed.");
            }
        } catch (error) {
            console.error(error);
            if (
                error &&
                error.code === DiscordjsErrorCodes.InteractionCollectorError
            ) {
                await response.edit({
                    content:
                        "[Session Expired] Confirmation not received within 1 minute.",
                });
            }
            await handleError(error, __filename);
        }
    },
};

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
    const guild = await Guild.findOne({
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
