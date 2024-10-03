const { REST, Routes } = require('discord.js');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
require('dotenv').config();
require('module-alias/register');
const { Guild } = require('@models');
const { Op } = require('sequelize');

const commands = {
	global: [],
	guild: {}
};

const foldersPath = join(process.cwd(), 'commands/slash');
const commandFolders = readdirSync(foldersPath);

console.log(commandFolders);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);

	if (folder === 'general') {
		loadGlobalCommands(commandsPath);
	} else {
		loadCommands(commandsPath, folder);
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

console.log("Deploying Commands...");

(async () => {
	try {
		console.log(`Started refreshing application (/) commands.`);

		const globalData = await rest.put(
			Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
			{ body: commands.global },
		);

		console.log(`Successfully reloaded ${globalData.length} global application (/) commands.`);

		for (const [guildID, guildCommands] of Object.entries(commands.guild)) {
			await rest.put(
				Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildID),
				{ body: guildCommands },
			)
		}

		console.log(`Successfully reloaded ${Object.keys(commands.guild).length} guild application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

function loadGlobalCommands(commandsPath) {
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.global.push(command.data.toJSON());
		} else {
			console.log(`[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}

	console.log(`Loaded ${commands.global.length} global commands.`);
	console.table(commands.global, ['index', 'name', 'description']);
}

async function loadCommands(commandsPath, folder) {
	const guilds = await Guild.findAll({
		attributes: ['category'],
		where: {
			category: {
				[Op.like]: `%${folder}%`			
			}
		}
	});

	if (!guilds) return;

	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	
	const currentFolderCommands = [];
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			currentFolderCommands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING-DEPLOY] The command at ${filePath} is missing a required "data" or "execute" property.`);
		} 
	}

	for (const guild of guilds) {
		commands.guild[guild.id] = currentFolderCommands;
	}

	console.log(`Loaded ${Object.keys(commands.guild).length} guild commands.`);
	console.table(commands.guild, ['index', 'name', 'description']);
}