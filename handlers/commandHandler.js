const { readdirSync } = require('node:fs');
const { join } = require('node:path');

module.exports = (client) => {
    const folderPath = join(process.cwd(), 'commands/slash');
    const commandFolders = readdirSync(folderPath);

    for (const folder of commandFolders) {
        const commandsPath = join(folderPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));    

        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.error(`[WARNING-HANDLER] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    console.log(`Loaded ${client.commands.size} slash commands.`);
}