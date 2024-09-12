const Inventory = require('@models/Inventory');
const User = require('@models/User');

class InventoryService {
    constructor() {
        this.inventory = Inventory;
    }

    async createInventory(value, userId) {
        try {
            const inventory = await this.inventory.create(value);

            // TODO: UserService Instead
            const user = await User.findOne({ where: { discord_id: userId }});

            inventory.setUser(user);

            return inventory;
        } catch (error) {
            // TODO: Handle in other file | Proper error handling?
            console.error(`Error creating inventory: ${error.message}`);
        }
    }
}

module.exports = InventoryService;