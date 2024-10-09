const { REST, Routes } = require('discord.js');
const { readdirSync } = require('node:fs');
const { join } = require('node:path');
require('dotenv').config();
require('module-alias/register');
const { Guild } = require('@models');
const { Op } = require('sequelize');

console.log("Running deploy-commands.js...");
setTimeout(deployCommands, 3000);

const commands = {
	global: [],
	guild: {}
};

async function deployCommands() {
	const foldersPath = join(process.cwd(), 'commands/slash');
	const commandFolders = readdirSync(foldersPath);

	console.table(commandFolders);

	for (const folder of commandFolders) {
		const commandsPath = join(foldersPath, folder);

		if (folder === 'general') {
			loadGlobalCommands(commandsPath);
		} else {
			await loadCommands(commandsPath, folder);
		}
	}
	const rest = new REST().setToken(process.env.DISCORD_TOKEN);

	console.log('\n[info] Refreshing application (/) commands...');
	setTimeout(async () => await refreshApplicationCommandsThenExit(rest), 3000);
}

async function refreshApplicationCommandsThenExit(rest) {
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
			);
		}

		console.log(`Successfully reloaded ${Object.keys(commands.guild).length} guild application.`);
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

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

	console.log(`[End Load Global Command] Loaded ${commands.global.length} global commands.`);
}

async function loadCommands(commandsPath, folder) {
	const guilds = await Guild.findAll({
		attributes: ['server_id', 'category'],
		where: {
			category: {
				[Op.like]: `%${folder}%`			
			}
		}
	});

	if (guilds.length === 0) {
		console.log(`[info] No guilds found has the ${folder} category.`);

		return;
	}

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
		if (commands.guild[guild.server_id] === undefined) commands.guild[guild.server_id] = [];
		commands.guild[guild.server_id].push(...currentFolderCommands);
	}

	console.log(`[End Load Command] Loaded ${Object.keys(commands.guild).length} guild commands with ${folder} category.`);
}