const { User, Inventory } = require('@models/index');

class InventoryService {
    constructor() {
        this.inventory = Inventory;
    }

    async createInventory(value, discordId) {
        try {
            const user = await User.getByDiscordId(discordId);

            const inventory = await this.inventory.create(value);

            inventory.setUser(user);

            return inventory;
        } catch (error) {
            // TODO: Handle in other file | Proper error handling?
            console.error(`Error creating inventory: ${error.message}`);
        }
    }

    async saveTicket(ticket, discordId) {
        try {
            const user = await User.getByDiscordId(discordId);
            const inventory = await user.getInventory();

            if (inventory) {
                inventory.setTicketQuantity(ticket);

                return;
            }

            await this.createInventory({ ticket_quantity: ticket }, discordId);
        } catch (error) {

        }
    }

    async hasTicket(discordId) {
        const user = await User.getByDiscordId(discordId);
 
        const inventory = await user.getInventory();

        return inventory.hasTicket();
    }
}

module.exports = InventoryService;