const Inventory = require('@models/Inventory');
const User = require('@models/User');

class InventoryService {
    constructor() {
        this.inventory = Inventory;
    }

    async createInventory(value, user) {
        try {
            const inventory = await this.inventory.create(value);

            inventory.setUser(User.findOne({ where: { discordId: user.id} }));

            return inventory;
        } catch (error) {
            // TODO: Handle in other file
            console.error(`Error creating inventory: ${error.message}`);
        }
    }
}

module.exports = InventoryService;