const { readdirSync } = require('node:fs');
const { join } = require('node:path');

const requiredProperties = ['name', 'category', 'description', 'execute'];

module.exports = (client) => {
    const folderPath = join(process.cwd(), 'commands/prefix');
    const commandFolders = readdirSync(folderPath);

    for (const folder of commandFolders) {
        const commandsPath = join(folderPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('js'));
    
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);;
            const command = require(filePath);

            if (requiredProperties.every(property => property in command)) {
                client.prefixCommands.set(command.name, command);
            }
        }
    }

    console.log(`Loaded ${client.prefixCommands.size} prefix commands.`);
}