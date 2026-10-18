function logger(req, res, next) {
    console.log(`[Docker-Backend] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
    next();
}

module.exports = logger;
