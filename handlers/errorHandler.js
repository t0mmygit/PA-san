const {
    DiscordAPIError,
    DiscordjsError,
    DiscordjsErrorCodes,
    EmbedBuilder,
} = require("discord.js");
const { basename } = require("node:path");
const { COLOR_ERROR } = require("@/constant.js");
const { inlineCode, codeBlock, subtext } = require("@discordjs/formatters");
const webhook = require("@handlers/webhookHandler");

// TODO: Handle 'deleted' collector error. (When collecting, user/some sort event that cause the message to be deleted.)
async function handleError(error, file, response = "none") {
    console.error("Error Handled:", error);
    if (error instanceof DiscordjsError) {
        handleDiscordjsError(error, response);
    }

    if (error instanceof DiscordAPIError) {
        handleDiscordAPIError(error, response);
    }

    const errorEmbed = constructErrorEmbed(error, file);
    await webhook.send({ embeds: [errorEmbed] });
}

function handleDiscordjsError(error, response) {
    if (error.code === DiscordjsErrorCodes.InteractionCollectorError) {
        console.log("Interaction Collector Error (Not Handled Yet).");
    }
}

async function handleDiscordAPIError(error, response) {
    if (error.code == 50013) {
        const message = await response.channel.send({
            content: `Insufficient permissions! Please contact the server administrator. \n${subtext("Message will be deleted in 5 seconds.")}`,
        });

        setTimeout(() => message.delete(), 5000);
    }
}

function readableTimestamp() {
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    };

    return new Date().toLocaleString("en-US", options);
}

function constructErrorEmbed(error, file) {
    return new EmbedBuilder()
        .setColor(COLOR_ERROR)
        .setTitle(basename(file))
        .setFields({
            name: error.code || "Unknown Error Code",
            value:
                constructErrorEmbedFieldValue(error) || "No error definition.",
        })
        .setFooter({ text: `Issued on ${readableTimestamp()}` });
}

function constructErrorEmbedFieldValue(error) {
    let errors = [];

    if (!error) {
        return "No error definition.";
    }

    if (error.code) errors.push(inlineCode("code") + error.code);
    if (error.message) errors.push(inlineCode("message") + error.message);
    if (error.stack) errors.push(codeBlock(error.stack));

    // TODO: Handle getOwnProperties errors.

    return errors.join("\n");
}

module.exports = {
    handleError,
};
