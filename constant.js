const { ActivityType, Colors } = require('discord.js');

module.exports = {
    PREFIX: 'PA!', // Make it dynamic for each guild config
    BOT_STATUS: 'idle',
    ACTIVITY_TYPE: ActivityType.playing,
    ACTIVITY_NAME: process.env.NODE_ENV === 'production' ? 'as Alto Otogi' : 'the guitar',
    COLOR_ERROR: Colors.Red,
    COLOR_SUCCESS: Colors.Green,
    COLOR_INFO: Colors.Aqua,
    COLOR_SECONDARY: Colors.LightGrey,
    COLLECTOR_MAX: 10,
    COLLECTOR_TIME: process.env.NODE_ENV === 'production' ? 60_000 : 10_000,
};