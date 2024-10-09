require('module-alias/register');
require('dotenv').config();
require('@models/index');

const client = require('@handlers/clientSingletonHandler.js');

require('@handlers/commandHandler')(client);
require('@handlers/prefixCommandHandler')(client);

require('@events/clientReady')(client);
require('@events/messageCreate')(client);
require('@events/interactionCreate')(client);
require('@events/guildCreate')(client);
require('@events/messageReactionAdd')(client);

// Error handling
require('@events/errorEvents')(client);