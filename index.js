const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	], 
});

module.exports.client = client;

client.commands = new Collection();

console.log('Loading slash commands...')
require('./handlers/commandHandler')(client);

require('./events/clientReady')(client);
require('./events/messageCreate')(client);
require('./events/interactionCreate')(client);

client.login(process.env.DISCORD_TOKEN);