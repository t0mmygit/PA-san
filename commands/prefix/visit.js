const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('visit')
        .setDescription("No Usage. Not usable SlashCommand!"),
    async execute(message, client) {
        const KARUTA_BOT_ID = "646937666251915264"; // @Karuta
		const USER_ID_TO_MONITOR = "650593260255051792"; // @prxerkun
        const channel = client.channels.cache.get(message.channelId);
        console.log(`Trigger Message: ${message.content}`);

        const filter = await channel.messages.fetch({ limit: 3 })
            .then(messages => {
                const messagesObject = messages.filter(
                    message => message.author.id === KARUTA_BOT_ID);
                const messageReference = messagesObject.forEach(object => {
                    console.log(object)
                })
                //console.log(messageReference);
            })
            .catch(console.error)
        //message.reply(filter);
    }
}