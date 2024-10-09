const { Events } = require('discord.js');

module.exports = (client) => {
    client.on(Events.Error, error => {
        console.error('[Error Event]', error);
    });

    client.on(Events.Warn, warn => {
        console.error('[Warn Event]', warn);
    });

    client.on(Events.Debug, debug => {
        console.error('[Debug Event]', debug);
    });
}