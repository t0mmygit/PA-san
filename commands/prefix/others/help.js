const { EmbedBuilder, inlineCode, bold } = require("discord.js");
const { basename } = require("node:path");
const { COLOR_SECONDARY } = require("@/constant.js");
const { capitalize } = require("@utils");

// TODO: Commands List
// TODO: Emoji per category?

module.exports = {
    name: "help",
    category: basename(__dirname),
    description: "Shows all the commands.",
    async execute(client, message, args) {
        args.length
            ? await showCommandDescription(client, message, args)
            : await showCommands(client, message);
    },
};

async function showCommands(client, message) {
    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Commands")
        .setDescription("Here are the list of commands.");

    const categories = {};
    client.prefixCommands.forEach((command) => {
        if (!command.category) command.category = "others";
        if (!categories[command.category]) categories[command.category] = [];
        categories[command.category].push(command.name);
    });

    for (const [category, commands] of Object.entries(categories)) {
        embed.addFields({
            name: `${bold(capitalize(category))}`,
            value: commands.map((command) => inlineCode(command)).join(", "),
            inline: true,
        });
    }

    await message.reply({
        embeds: [embed],
    });
}

async function showCommandDescription(client, message, args) {
    const commandName = args[0].toLowerCase();

    const embed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle("Command Description")
        .setFields({
            name: commandName,
            value: client.prefixCommands.get(commandName).description,
        });

    await message.reply({
        embeds: [embed],
    });
}
