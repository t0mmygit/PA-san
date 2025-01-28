const { Events } = require("discord.js");

module.exports = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied) {
                await interaction.followUp({
                    content: "Error: Interaction replied.",
                    ephemeral: true,
                });
            } else if (interaction.deferred) {
                await interaction.followUp({
                    content: "Error: Interaction deferred.",
                    ephemeral: true,
                });
            } else {
                await interaction.followUp({
                    content:
                        "2. There was an error while executing this command!",
                    ephemeral: true,
                });
            }
        }
    });
};

