const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('Expose those who is gay!')
        .addUserOption(option => 
            option
                .setName('target')
                .setDescription(`The target's username`)
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');    
        console.log(`Target: ${target}`);           

        const no = new ButtonBuilder()
            .setCustomId('no')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger);

        const yes = new ButtonBuilder()
            .setCustomId('yes')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
			.addComponents(no, yes);

        const response = await interaction.reply({
            content: `Are you sure ${target} is gay?`,
            components: [row],
        });

        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

            if (confirmation.customId === 'yes') {
                await confirmation.reply(`${target} has been declared as gay!`);
            } else {
                await confirmation.reply({ content: `${target} is not gay!`, components: [] });
            }
        } catch (error) {
            console.log(error);
            await interaction.reply(`There is an error while running this code: \n\`${error.message}\``)
        }
    },
};