const { readdirSync } = require("fs");
const { join } = require("path");

module.exports = async (interaction) => {
    const path = join(process.cwd(), "modals");
    const files = readdirSync(path).filter((file) => file.endsWith(".js"));

    console.table(files);
    const fileName = interaction.customId.concat(".js");

    if (!files.includes(fileName)) {
        await interaction.reply({ content: "Something went wrong!" });
        console.log("Files does not include modal Id!");

        return;
    }

    require(`@modals/${fileName}`)(interaction);
};
