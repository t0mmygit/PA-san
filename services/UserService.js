const { User } = require('@models/index');

class UserService {
    constructor() {
        this.user = User;
    }

    async getUser(userId) {
        const user = await this.user.findOne({ where: { discord_id: userId }});

        return user;
    }
}

module.exports = UserService;