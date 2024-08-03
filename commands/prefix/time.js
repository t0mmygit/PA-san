const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Current Malaysia Time!'),
    async execute(message) {
        const roleId = '1079087570291539988';
        const role = message.guild.roles.cache.get(roleId);

        const malaysiaDateTime = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kuala_Lumpur',
            weekday: 'long',
            hour: 'numeric',
            minute: 'numeric'
        });

        // Check current day and time
        const currentWeekDay = new Date().getDay();
        const currentHour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric' });
        const currentMinute = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur', minute: 'numeric' });

        if (currentWeekDay == 6) {
            message.channel.send(`Current date and time in Malaysia: ${malaysiaDateTime}`);
        }

        // console.log(currentWeekDay);
        // console.log(currentTime);
    }
};