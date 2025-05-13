const { unorderedList } = require("@discordjs/formatters");

module.exports = (requiredPermissions) => async (interaction) => {
    // Focuses on guild permissions.
    const member = interaction.member;
    const missing = member.permissions.missing(requiredPermissions);

    if (missing.length > 0) {
        await interaction.reply({
            content: constructContent(missing),
            ephemeral: true,
        });
    }

    return missing.length === 0;
};

function constructContent(permissions) {
    return `You are missing required user permissions: \n${unorderedList(permissions)}`;
}
