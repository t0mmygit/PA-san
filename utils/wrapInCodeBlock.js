module.exports = function wrapInCodeBlock(string, type = 'multi') {
    if (type === 'single') {
        return `\`${string}\``; 
    }

    return `\`\`\`${string}\`\`\``;
}