module.exports = function isIntegerAndPositive(string) {
    const number = Number(string);

    return Number.isInteger(number) && number > 0;
}