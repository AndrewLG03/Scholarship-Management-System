// backend/src/config/index.js
const transporter = require('./email');
const { pool } = require('./database');

module.exports = {
    transporter,
    pool
};
