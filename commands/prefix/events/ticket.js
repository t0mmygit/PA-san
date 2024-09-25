const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { PREFIX, COLOR_SECONDARY, COLOR_SUCCESS, COLOR_ERROR, COLLECTOR_MAX, COLLECTOR_TIME } = require("@/constant.js");
const { addSuffix, wrapInCodeBlock, wrapInBold, isIntegerAndPositive } = require("@utils");
const { handleError, logError } = require("@handlers/errorHandler");
const InventoryService = require('@services/InventoryService');
const storage = require('@/storage.js');
const { User } = require('@models');

module.exports = {
    name: 'ticket',
    category: 'events',
    description: 'No description yet.',
    async execute(_, message, args) {
        const storeEmbed = new EmbedBuilder()
            .setColor(COLOR_SECONDARY)
            .setTitle('STARRY Ticket Store')
            .setDescription('Welcome to STARRY! The ticket store is currently open!')
            .setFooter({ text: 'Please select an option.'});
 
        const storeActionRow = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId('bulletin')
                    .setLabel('Bulletin')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket')
                    .setLabel('Ticket')
                    .setStyle(ButtonStyle.Primary),
            );

        const response = await message.reply({
            embeds: [storeEmbed],
            components: [storeActionRow]
        });

        try {
            const filterUserInteraction = (interaction) => interaction.user.id === message.author.id;
            const interaction = await response.awaitMessageComponent({ filter: filterUserInteraction, time: COLLECTOR_TIME });

            if (interaction.isButton()) {
                await interaction.deferUpdate();

                if (interaction.customId === 'bulletin') {
                    await handleBulletinInteraction(response, filterUserInteraction);
                }
                
                if (interaction.customId === 'ticket') {
                    await handleTicketInteraction(response, message);
                }
            }
        } catch (error) {
            await logError(error, response, __filename); 
        }
    }
}

async function handleBulletinInteraction(message, filter) {
    const bulletinEmbed = new EmbedBuilder()
        .setColor(COLOR_SECONDARY)
        .setTitle('Bulletin Board')
        .setDescription('Below are the latest ticket sales!');

    const { count, rows } = await User.findAndCountAll(); 

    bulletinEmbed.setFields({
        name: wrapInBold(`Showing results ${count} of ${count}`),
        value: await constructUsersField(rows) 
    });

    await message.edit({ embeds: [bulletinEmbed], components: [] });
}

async function handleTicketInteraction(response, message) {
    try {
        const inputTicketEmbed = new EmbedBuilder()
            .setColor(COLOR_SECONDARY)
            .setTitle('Bocchi\'s Ticket Store')
            .setDescription('Store is open! Please input the amount of tickets you would like to sell.')
            .setFooter({ text: 'Input must be a positive integer.' });

        const user = await User.getByDiscordId(message.author.id);
        const inventory = await user.getInventory();

        if (inventory && inventory.hasTicket()) {
            inputTicketEmbed.setFields({ 
                name: wrapInCodeBlock('NOTICE', 'single'),
                value: wrapInCodeBlock(`You currently have ${inventory.ticket_quantity} ticket listed. This process will overwrite existing list.`)
            });
        }

        await response.edit({ embeds: [inputTicketEmbed], components: [] });

        await collectUserMessage(response, message);
    } catch (error) {
        await handleError(error, __filename);
    }
}

async function collectUserMessage(response, message) {    
    try {
        const filterMessage = (collectedMessage) => collectedMessage.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter: filterMessage, max: COLLECTOR_MAX, time: COLLECTOR_TIME});

        await storeCommandSession(collector, response, message);

        collector.on('collect', async (collected) => {
            if (!isIntegerAndPositive(collected.content)) {
                if (collected.content.startsWith(PREFIX)) return;

                await collected.reply('Please input a valid input!');

                return; 
            }

            const insertedTicketEmbed = EmbedBuilder.from(response.embeds[0])
                .setColor(COLOR_SECONDARY)
                .setDescription(null)
                .setFields(
                    { name: 'You\'ve inserted the following', value: wrapInCodeBlock(collected.content + ' Tickets') }
                );

            const saveActionRow = new ActionRowBuilder()
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

            await response.edit({
                embeds: [insertedTicketEmbed],
                components: [saveActionRow],
            }); 

            await saveUserTicketInteraction(collector, collected, response, message);
        });

        collector.on('end', async (_, reason) => {
            await handleCollectorEnd(response, message, reason);
        });
    } catch (error) {
        await logError(error, response, __filename);
    }
}

async function saveUserTicketInteraction(collector, collected, response, message) {
    try {        
        const filterInteraction = (interaction) => interaction.user.id === message.author.id;
        const interaction = await response.awaitMessageComponent({ filter: filterInteraction, time: COLLECTOR_TIME }); 

        if (interaction.isButton()) {
            if (interaction.customId === 'cancel') collector.stop('cancel-by-user');
            
            if (interaction.customId === 'save') { 
                const savedEmbed = EmbedBuilder.from(response.embeds[0])
                    .setColor(COLOR_SUCCESS);

                await new InventoryService().saveTicket(collected.content, message.author.id);

                await response.edit({
                    content: wrapInBold('Record have been saved.'),
                    embeds: [savedEmbed],
                    components: [],
                });
            }

            if (!collector.ended) collector.stop();
        }
    } catch (error) {
        await logError(error, response, __filename);
    }
}

async function handleCollectorEnd(response, message, reason) {
    console.log('End Reason:', reason);

    try {
        const defaultFailedEmbed = EmbedBuilder.from(response.embeds[0]).setColor(COLOR_ERROR);
        
        if (reason === 'time') {
            await response.edit({ 
                content: wrapInBold('Timed out! Please try again.'),
                embeds: [defaultFailedEmbed],
                components: [],
            });
        }

        if (reason === 'cancel-by-user') {
            await response.edit({
                content: wrapInBold(`${message.author} has cancelled this action.`),
                embeds: [defaultFailedEmbed],
                components: [],
            })
        }

        const recordDeleteStatus = storage.delete(message.author.id);
        
        // Debugging Purposes
        if (!recordDeleteStatus) {
            console.error(`Failed to delete record from storage. Record deleted or does not exist? (Nessage ID: ${message.id})`);
        } 
    } catch (error) {
        await handleError(error, __filename);
    }
}

async function constructUserField(index, user) { 
    const number = wrapInCodeBlock(addSuffix(index, '. '), 'single');
    const mention = `<@${user.discord_id}>`;

    const inventory = await user.getInventory();
    const ticket = inventory ? inventory.ticket_quantity : 0;

    if (ticket === 0 || ticket === null) {
        return `${number} ${mention} - not listed` 
    }

    return `${number} ${mention} - ${ticket}`;
}

async function constructUsersField(users) {
    const usersField = await Promise.all(users.map((user, index) => 
        constructUserField(index + 1, user)
    ));

    return usersField.join('\n');
}

async function storeCommandSession(collector, response, message) {
    await storage.set(
        message.author.id,
        {
            command: module.exports.name,
            message: { id: response.id },
            channel: { id: response.channelId },
            collector: collector,
        }
    );
}