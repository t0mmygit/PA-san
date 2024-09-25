module.exports = function addSuffix(string, suffix) {
    if (!isString(string) ) {
        string = string.toString();
    }

    return string.concat(suffix);
}

function isString(string) {
    return string instanceof String; 
}