const { SlashCommandBuilder, PermissionFlagsBits, bold } = require('discord.js');
const { Channel, Guild } = require('@models');
const schema = require('@schemas/channel-settings');
const { handleError } = require('@handlers/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disable-delete-by-reaction')
        .setDescription('Disable delete message by reaction for this channel.'),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (!isModerator(interaction.member)) {
                await interaction.followUp({ content: 'You do not have permission to use this command!' });   
                return;
            }

            await disableDeleteByReaction(interaction);

            await interaction.followUp({
                content: bold(`Delete by reaction now disabled!`)
            });
        } catch (error) {
            await handleError(error, __filename);
        }
    }
}

function isModerator(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator)
}

async function disableDeleteByReaction(interaction) {
    try {
        let channel = await Channel.findOne({ where: { discord_channel_id: interaction.channelId } });

        if (!channel) {
            const [guild] = await Guild.findOrCreate({ where: { server_id: interaction.guildId } });        
            
            channel = await guild.createChannel({
                discord_channel_id: interaction.channelId,
            });
        }

        const settings = schema.validate({ allowDeleteByReaction: false });
        console.table(settings);

        await channel.update({ settings: JSON.stringify(settings) });
    } catch (error) {
        await handleError(error, __filename);
    }
}