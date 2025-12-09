// src/utils/errorHandler.js
module.exports = (err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    const response = {
        error: true,
        message: err.message || 'Internal Server Error'
    };
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }
    res.status(status).json(response);
};