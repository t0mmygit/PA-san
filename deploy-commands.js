const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
// Grab all the command folders from the commands directory you created
// const foldersPath = path.join(__dirname, 'commands/slash');
const foldersPath = path.join(process.cwd(), 'commands/slash');
console.log("Fetching Folders Path:", foldersPath)

const commandFolders = fs.readdirSync(foldersPath);
console.log("Fetching Command Folders:", commandFolders)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			console.log(`Processing command: ${file}`);
			try {
				commands.push(command.data.toJSON());
			} catch (error) {
				console.error(`Error processing command: ${file}: ${error.message}`);
			}
		} else {
			console.log(`[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`);
		} 
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

console.log("Deploying Commands...");

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();