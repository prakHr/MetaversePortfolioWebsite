const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api/search',
        createProxyMiddleware({
            target: 'https://vercel-docker.onrender.com',
            changeOrigin: true,
        })
    );
};