const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();
client.prefixCommands = new Collection();

client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log(`[${new Date().toLocaleString()}] Client logged in!`);
    })
    .catch(() => {
        console.error('Client login failed! Check your token!');
    });

module.exports = client;