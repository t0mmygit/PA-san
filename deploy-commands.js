const { REST, Routes } = require("discord.js");
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
require("dotenv").config();
require("module-alias/register");
const { Guild } = require("@models");
const { Op } = require("sequelize");

setTimeout(deployCommands, 3000);

const commands = {
    global: [],
    guild: {},
};

async function deployCommands() {
    const foldersPath = join(process.cwd(), "commands/slash");
    const commandFolders = readdirSync(foldersPath);

    const rest = getRESTinstance();
    const guilds = await rest.get(Routes.userGuilds());

    console.table(commandFolders);
    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);

        if (folder === "general") {
            loadGlobalCommands(commandsPath);
        } else {
            await loadGuildCommands(commandsPath, folder, guilds);
        }
    }

    console.info("\n[info] Refreshing application (/) commands...");
    await refreshApplicationCommandsThenExit(rest);
}

function getRESTinstance() {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    rest.options.timeout = 30_000;

    return rest;
}

async function refreshApplicationCommandsThenExit(rest) {
    try {
        console.info(`Refreshing application (/) commands.`);

        const globalData = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands.global }
        );

        console.info(
            `Successfully reloaded ${globalData.length} global application (/) commands.`
        );

        for (const [guildID, guildCommands] of Object.entries(commands.guild)) {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.DISCORD_CLIENT_ID,
                    guildID
                ),
                { body: guildCommands }
            );
        }

        console.info(
            `Successfully reloaded guild commands in ${Object.keys(commands.guild).length} guild application.`
        );
        return;
    } catch (error) {
        console.error(error);
    }
}

function loadGlobalCommands(commandsPath) {
    const commandFiles = readdirSync(commandsPath).filter((file) =>
        file.endsWith(".js")
    );

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            commands.global.push(command.data.toJSON());
        } else {
            console.info(
                `[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }

    console.info(
        `[Global Command] Loaded ${commands.global.length} global commands.`
    );
}

async function loadGuildCommands(commandsPath, folder, appGuilds) {
    const guilds = await Guild.findAll({
        attributes: ["server_id", "category"],
        where: {
            category: {
                [Op.like]: `%${folder}%`,
            },
        },
    });

    if (guilds.length === 0) {
        console.info(
            `[Guild Command] No guilds found has the ${folder} category.`
        );

        return;
    }
    const connectedGuilds = guilds.filter((guild) =>
        appGuilds.some((appGuild) => appGuild.id === guild.server_id)
    );

    const commandFiles = readdirSync(commandsPath).filter((file) =>
        file.endsWith(".js")
    );

    const currentFolderCommands = [];
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            currentFolderCommands.push(command.data.toJSON());
        } else {
            console.info(
                `[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`
            );
        }
    }

    for (const guild of connectedGuilds) {
        if (commands.guild[guild.server_id] === undefined)
            commands.guild[guild.server_id] = [];
        commands.guild[guild.server_id].push(...currentFolderCommands);
    }

    console.info(
        `[Guild Commands] Loaded ${Object.keys(commands.guild).length} guild commands with ${folder} category.`
    );
}
