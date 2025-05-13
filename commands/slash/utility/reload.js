const { readdirSync } = require("fs");
const { join } = require("path");
const { inlineCode, subtext } = require("@discordjs/formatters");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const userHasPermission = require("@middlewares/userHasPermission");

module.exports = {
    middlewares: [userHasPermission([PermissionFlagsBits.Administrator])],
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reloads a command.")
        .addStringOption((option) =>
            option
                .setName("command")
                .setDescription("The command to reload.")
                .setRequired(true)
        ),
    async execute(interaction) {
        const commandName = interaction.options
            .getString("command", true)
            .toLowerCase();

        const command = interaction.client.commands.get(commandName);
        if (!command) {
            await interaction.reply(
                getInteractionReply("no-command-name", commandName)
            );

            return;
        }

        const commandPath = getCommandPath(commandName);
        delete require.cache[require.resolve(commandPath)];
        try {
            interaction.client.commands.delete(command.data.name);

            const newCommand = require(commandPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply(
                getInteractionReply("command-reloaded", newCommand.data.name)
            );
        } catch (error) {
            console.error(error);
            await interaction.reply(
                getInteractionReply("error", command.data.name)
            );
        }
    },
};

function getCommandPath(commandName) {
    const foldersPath = join(process.cwd(), "commands/slash");

    const commandFolders = readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const folderPath = join(foldersPath, folder);
        const commandFiles = readdirSync(folderPath);

        if (commandFiles.includes(commandName.concat(".js"))) {
            return folderPath.concat("/", commandName, ".js");
        }
    }
}

function getInteractionReply(string, data) {
    switch (string) {
        case "no-command-name":
            return `There is no command ${inlineCode(data)}. \n${subtext("Did you run " + inlineCode("node deploy-commands.js") + "?")}`;
        case "command-reloaded":
            return `Successfully reloaded ${inlineCode(data)}!`;
        case "error":
            return `There was an error while reloading a command ${inlineCode(data)}`;
        default:
            return "DEFAULT: No response being set.";
    }
}
