const Joi = require("joi");

const schema = Joi.object({
    allowDeleteByReaction: Joi.boolean().default(false),
    allowUserMessages: Joi.boolean().default(true),
});

module.exports = schema;