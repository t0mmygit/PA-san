const extensions = ['jpg', 'png'];

module.exports = function addExtension(string, extension) {
    if (!extensions.includes(extension)) {
        console.error(`Invalid extension: ${extension}`);
    }
    
    return string + '.' + extension;
}