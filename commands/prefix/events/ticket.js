const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { PREFIX, COLOR_SECONDARY, COLOR_SUCCESS, COLOR_ERROR, COLLECTOR_MAX, COLLECTOR_TIME } = require("@/constant.js");
const storage = require('@//storage.js');

function isPositiveInteger(message) {
    const number = Number(message);

    return Number.isInteger(number) && number > 0;
}

function wrapCodeBlock(string) {
    return `\`\`\`${string}\`\`\``;
}

function wrapBold(string) {
    return `**${string}**`;
}

module.exports = {
    name: 'ticket',
    async execute(client, message) {
        const embed = new EmbedBuilder()
            .setColor(COLOR_SECONDARY)
            .setTitle('Bocchi\'s Ticket Store')
            .setDescription('Store is open! Please input the amount of tickets you would like to sell.')
            .setFields({ name: '\u2008', value: '\u2008' })
            .setFooter({ text: 'Input must be a positive integer.' });

            const row = new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('save')
                        .setLabel('Save')
                        .setStyle(ButtonStyle.Primary),
                );

        const response = await message.reply({
            embeds: [embed],
        });

        const filter = (interaction) => interaction.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter: filter, max: COLLECTOR_MAX, time: COLLECTOR_TIME});
 
        await storage.set(
            message.author.id,
            {
                command: this.name,
                message: {
                    id: response.id,
                },
                channel: {
                    id: response.channelId,
                },
                collector: collector,
            }
        );

        collector.on('collect', async (collected) => {
            if (isPositiveInteger(collected.content)) { 
                const secondEmbed = EmbedBuilder.from(response.embeds[0])
                    .setColor(COLOR_SECONDARY)
                    .setDescription(null)
                    .setFields(
                        { name: 'You\'ve inserted the following', value: wrapCodeBlock(collected.content + ' Tickets') }
                    );

                const secondInteraction = await response.edit({
                    embeds: [secondEmbed],
                    components: [row],
                })  

                const secondFilter = (interaction) => interaction.user.id === message.author.id;
                const secondResponse = await secondInteraction.awaitMessageComponent({ filter: secondFilter, time: COLLECTOR_TIME }); 

                if (secondResponse.isButton()) {
                    if (secondResponse.customId === 'save') {
                        const savedEmbed = EmbedBuilder.from(response.embeds[0])
                            .setColor(COLOR_SUCCESS);

                        await response.edit({
                            content: wrapBold('Tickets have been saved.'),
                            embeds: [savedEmbed],
                            components: [],
                        });

                    } else if (secondResponse.customId === 'cancel') {
                        collector.stop('cancel-by-user');
                    }

                    if (!collector.ended) collector.stop();
                    storage.delete(message.author.id);
                }
            } else {
                if (collected.content.startsWith(PREFIX)) return;

                await collected.reply('Please input a valid input!');
            }
        });

        collector.on('end', async (collected, reason) => {
            console.log('End Reason:', reason);
 
            const defaultFailedEmbed = EmbedBuilder.from(response.embeds[0]).setColor(COLOR_ERROR);
            
            if (reason === 'time') {
                await response.edit({ 
                    content: wrapBold('Timed out! Please try again.'),
                    embeds: [defaultFailedEmbed],
                    components: [],
                });
            }

            if (reason === 'cancel-by-user') {
                await response.edit({
                    content: wrapBold(`${message.author} has cancelled this action.`),
                    embeds: [defaultFailedEmbed],
                    components: [],
                })
            }

            await storage.delete(message.author.id);
        });
    }
}