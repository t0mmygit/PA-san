const {
    Routes,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    bold,
    inlineCode,
} = require("discord.js");
const { COLLECTOR_TIME, COLOR_SECONDARY } = require("@/constant.js");
const { readdirSync } = require("node:fs");
const { basename, join } = require("node:path");
const { Guild } = require("@models");
const { handleError } = require("@handlers/errorHandler");

/*
 * TODO: Utilize the StringSelectMenu class
 * First, prompt user to select which guild.
 * Then, prompt the required question.
 */
module.exports = {
    name: "guild",
    category: basename(__dirname),
    description: "A test for guild methods.",
    async execute(client, message, args) {
        switch (args[0]) {
            case "setCategory":
                await handleGuildCategory(client, args[1], message);
                break;
            case "setPrefixStatus":
                await setGuildsPrefixStatus(client, message);
                break;
            default:
                showGuildDetail(
                    message,
                    await Guild.findOne({
                        where: { server_id: message.guild.id },
                    })
                );
        }
    },
};

async function showGuildDetail(message, guild) {
    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Server Information")
        .setDescription(
            `Server ID: ${message.guild.id}\n` +
                `Server Name: ${message.guild.name}\n`
        )
        .setFields(
            {
                name: "Category",
                value:
                    guild.category.length > 0
                        ? JSON.parse(guild.category).join(", ")
                        : "N/A",
                inline: true,
            },
            {
                name: "Allow Prefix",
                value: guild.prefix_status ? "Yes" : "No",
                inline: true,
            }
        );

    await message.reply({
        embeds: [embed],
    });
}

async function handleGuildCategory(client, category, message) {
    if (!category) {
        message.reply("Please specify a category.");

        return;
    }

    if (!isCategory(category)) {
        message.reply(`${bold(category)} is not a valid category.`);

        return;
    }

    const guilds = await Guild.findAll({
        attributes: ["id", "server_id", "category"],
    });

    const cachedGuilds = client.guilds.cache;

    let namedGuilds = [];
    guilds.forEach((guild) => {
        const cacheGuild = cachedGuilds.get(guild.server_id);

        if (cacheGuild) {
            namedGuilds.push({
                id: cacheGuild.id,
                name: cacheGuild.name,
                category:
                    guild.category.length > 0
                        ? JSON.parse(guild.category).join(", ")
                        : "No category",
            });
        }
    });

    console.table(namedGuilds);

    const select = new StringSelectMenuBuilder()
        .setCustomId("set-guild-category")
        .setPlaceholder("Select a guild")
        .setOptions(guildCategoryOptions(namedGuilds));

    const component = new ActionRowBuilder().addComponents(select);

    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Guild Category")
        .setFooter({
            text: `Select a guild to add ${bold(category)} category.`,
        });

    const response = await message.reply({
        embeds: [embed],
        components: [component],
    });

    const filter = (interaction) =>
        interaction.isStringSelectMenu() &&
        interaction.user.id === message.author.id;

    try {
        const interaction = await response.awaitMessageComponent({
            filter: filter,
            time: COLLECTOR_TIME,
        });
        await interaction.deferReply();

        const guildId = interaction.values[0];
        const guild = guilds.find((guild) => guild.server_id === guildId);

        await setGuildCategory(client, category, guild, interaction);
    } catch (error) {
        await handleError(error, __filename, response);
    }
}

async function setGuildCategory(client, category, guild, message) {
    if (!guild.category.includes(category)) {
        try {
            await mergeApplicationGuildCommands(
                client,
                category,
                message,
                guild
            );

            const array =
                guild.category.length > 0 ? JSON.parse(guild.category) : [];
            array.push(category);

            await guild.update({ category: JSON.stringify(array) });

            await message.followUp(
                `Added ${bold(category)} category to ${bold(guild.server_id)}.`
            );
        } catch (error) {
            await handleError(error, __filename, response);
        }
    }
}

async function setGuildsPrefixStatus(client, message) {
    const { count, rows } = await Guild.findAndCountAll({
        attributes: ["server_id", "prefix_status"],
    });

    const guilds = client.guilds.cache;

    const collection = [];
    rows.forEach((row) => {
        const guild = guilds.get(row.server_id);

        if (guild) {
            collection.push({
                id: guild.id,
                name: guild.name,
                status: row.prefix_status ? "Enabled" : "Disabled",
            });
        }
    });

    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Guilds Prefix Status")
        .setFooter({
            text: "Choose an option to toggle the selected guild prefix status.",
        })
        .setFields({
            name: `Showing results ${count} of ${count}`,
            value: constructGuildsField(collection),
        });

    const select = new StringSelectMenuBuilder()
        .setCustomId("set-guild-prefix-status")
        .setPlaceholder("Select a guild")
        .addOptions(guildPrefixStatusOptions(collection));

    const component = new ActionRowBuilder().addComponents(select);

    const response = await message.reply({
        embeds: [embed],
        components: [component],
    });

    const filter = (interaction) =>
        interaction.isStringSelectMenu() &&
        interaction.user.id === message.author.id;

    try {
        const interaction = await response.awaitMessageComponent({
            filter: filter,
            time: COLLECTOR_TIME,
        });
        await interaction.deferReply();

        const guild = await Guild.findOne({
            where: { server_id: interaction.values[0] },
        });
        const [data, status] = guild.togglePrefixStatus();

        const { name } = client.guilds.cache.get(data.server_id);

        await interaction.followUp(
            `Prefix Status ${bold(name)} is ${inlineCode(status ? "enabled" : "disabled")}`
        );
    } catch (error) {
        await handleError(error, __filename, response);
    }
}

async function updateApplicationGuildCommands(client, commands, guild) {
    const data = await client.rest.put(
        Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            guild.server_id
        ),
        { body: commands }
    );

    console.log(
        `Successfully updated ${data.length} application (/) commands.`
    );
    console.table(data, ["index", "name", "description"]);
}

async function mergeApplicationGuildCommands(client, category, message, guild) {
    const newCommands = await getCategoryApplicationCommands(category, message);
    const existingCommands = await getCurrentApplicationCommands(client, guild);

    const existed = newCommands.every((newCommand) =>
        existingCommands.some((command) => command.name === newCommand.name)
    );

    if (!existed)
        await updateApplicationGuildCommands(
            client,
            [...newCommands, ...existingCommands],
            guild
        );
}

async function getCurrentApplicationCommands(client, guild) {
    return await client.rest.get(
        Routes.applicationGuildCommands(
            process.env.DISCORD_CLIENT_ID,
            guild.server_id
        )
    );
}

async function getCategoryApplicationCommands(category, message) {
    const commandsPath = join(process.cwd(), `commands/slash/${category}`);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
        file.endsWith(".js")
    );

    let newCommands = [];
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            newCommands.push(command.data.toJSON());
        } else {
            console.log(
                `[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
            await message.followUp(
                "Something went wrong. Missing required properties."
            );
        }
    }

    console.log(`Loaded ${newCommands.length} ${category} commands.`);
    console.table(newCommands, ["name", "description"]);

    return newCommands;
}

// Check if 'string' is a valid category (command/slash)
function isCategory(string) {
    const foldersPath = join(process.cwd(), "commands/slash");
    const commandFolders = readdirSync(foldersPath);

    return commandFolders.includes(string);
}

function buildGuildOptions(guilds, getDescription) {
    console.table(guilds);
    return guilds.map((guild) =>
        new StringSelectMenuOptionBuilder()
            .setLabel(guild.name)
            .setDescription(getDescription(guild))
            .setValue(guild.id)
    );
}

function guildCategoryOptions(guilds) {
    return buildGuildOptions(guilds, (guild) => guild.category);
}

function guildPrefixStatusOptions(guilds) {
    return buildGuildOptions(guilds, (guild) => guild.status);
}

function constructGuildsField(guilds) {
    return guilds
        .map((guild) => constructGuildField(guild.name, guild.status))
        .join("\n");
}

function constructGuildField(name, status) {
    return `${bold(name)} - ${status}`;
}
