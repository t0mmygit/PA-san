const { Events } = require("discord.js");

module.exports = (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            if (command.middlewares && command.middlewares.length > 0)
                await executeWithMiddleware(
                    interaction,
                    command.middlewares,
                    command.execute
                );
            else await command.execute(interaction);
        } catch (error) {
            await handleInteractionAction(interaction);
        }
    });
};

async function executeWithMiddleware(interaction, middlewares, handler) {
    for (const middleware of middlewares) {
        const allowed = await middleware(interaction);
        if (!allowed) return;
    }

    await handler(interaction);
}

async function handleInteractionAction(interaction) {
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
            content: "1. There was an error while executing this command!",
            ephemeral: true,
        });
    }
}
