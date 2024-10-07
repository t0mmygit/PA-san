const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('module-alias/register');
require('dotenv').config();
require('@models/index');

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
	], 
});

module.exports.client = client;

client.commands = new Collection();
client.prefixCommands = new Collection();

require('@handlers/commandHandler')(client);
require('@handlers/prefixCommandHandler')(client);

require('@events/clientReady')(client);
require('@events/messageCreate')(client);
require('@events/interactionCreate')(client);
require('@events/guildCreate')(client);
require('@events/messageReactionAdd')(client);

client.login(process.env.DISCORD_TOKEN);