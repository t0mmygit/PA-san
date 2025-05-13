const { unorderedList } = require("@discordjs/formatters");

module.exports = (requiredPermissions) => async (interaction) => {
    // Currently focuses on channel permissions. Guild permissions can be observed later.
    const application = interaction.guild.members.me;
    const appPermissions = interaction.channel.permissionsFor(application.id);
    const missing = appPermissions.missing(requiredPermissions);

    if (missing.length > 0) {
        await interaction.reply({
            content: constructContent(missing),
            ephemeral: true,
        });
    }

    return missing.length === 0;
};

function constructContent(permissions) {
    return `I'm missing required channel permissions: \n${unorderedList(permissions)}`;
}
