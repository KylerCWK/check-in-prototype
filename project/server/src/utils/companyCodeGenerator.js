// Company code generator utility
function generateCompanyCode() {
    const prefix = 'BOOK';
    const timestamp = Math.floor(Date.now() / 1000).toString(36);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${random}-${timestamp}`;
}

module.exports = {
    generateCompanyCode
};
