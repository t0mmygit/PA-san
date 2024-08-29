const { ActionRowBuilder, 
        ButtonBuilder, 
        ButtonStyle,
        EmbedBuilder, 
        Events,
        ModalBuilder,
        TextInputBuilder,
        TextInputStyle    
    } = require('discord.js');

module.exports = {
    async execute(client, message) {
        const menuEmbed = new EmbedBuilder()
            .setColor(0x252525)
            .setTitle('Main Menu')
            .setDescription('Select the button to proceed.')
            .setTimestamp()
            .setFooter(
                { 
                    text: 'Requested by ' + message.author.username, 
                    iconURL: 'https://cdn.discordapp.com/avatars/' + message.author.id + "/" + message.author.avatar + '.png' 
                });
            
        const modal = new ModalBuilder()
            .setCustomId('MyModal')
            .setTitle('Sell your Ticket') 

        const ticketInput = new TextInputBuilder()
			.setCustomId('ticketInput')
			.setLabel('Quantity')
            .setMinLength(1)
            .setMaxLength(3)
			.setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter ticket quantity...')
            .setRequired(true);

		const noteInput = new TextInputBuilder()
			.setCustomId('noteInput')
			.setLabel('Additional Notes')
			.setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter notes...');

		const firstActionRow = new ActionRowBuilder().addComponents(ticketInput);
		const secondActionRow = new ActionRowBuilder().addComponents(noteInput);

		modal.addComponents(firstActionRow, secondActionRow);

        const ticket = new ButtonBuilder()
			.setCustomId('ticket')
			.setLabel('Submit')
			.setStyle(ButtonStyle.Primary);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

        const rowMenu = new ActionRowBuilder()
			.addComponents(cancel, ticket);

        const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm')
			.setStyle(ButtonStyle.Success);

        const rowProcess = new ActionRowBuilder()
            .addComponents(cancel, confirm);

       const response = await message.reply({
            embeds: [menuEmbed],
            components: [rowMenu]
        });

        const filter = (interaction) => interaction.user.id === message.author.id;
        const confirmation = await response.awaitMessageComponent({ filter: filter, time: 60_000 });

        try {

            if (confirmation.customId === 'ticket') {
                await confirmation.showModal(modal);

                client.on(Events.InteractionCreate, async interaction => {
                    if (!interaction.isModalSubmit()) return;
                    
                    if (interaction.customId === 'MyModal') {
                        const ticket = interaction.fields.getTextInputValue('ticketInput');
                        const notes = interaction.fields.getTextInputValue('noteInput');
                        
                        console.log({ ticket, notes });

                        await message.reply({ content: 'Your submission was received successfully!' });
                    } else {
                        await message.reply({ content: `notModal?`});
                    }
                });
                
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: 'Action cancelled', components: [] });
            }
        } catch (error) {
            console.log(error);
        }
        
    }
}