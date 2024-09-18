const process = new Map();

module.exports = {
    get: (key) => process.get(key),
    set: (key, value) => process.set(key, value),
    delete: (key) => process.delete(key),
    has: (key) => process.has(key),
}