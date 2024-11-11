const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    app: ['@babel/polyfill', './src/app.js'],
  },
  
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
      // Shaders
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader'],
      },
    ],
  },
  
  plugins: [new CompressionPlugin()],

  devServer: {
    proxy: {
      '/api/search': {
        target: 'https://vercel-docker.onrender.com', 
        secure: false,  // Disable SSL verification for development
        changeOrigin: true, // Change the origin of the host header to the target URL
        logLevel: 'debug'  // Log proxy details for debugging purposes
      }
    },
    contentBase: path.join(__dirname, ''),
    compress: true,
    watchContentBase: true,
    port: 8080,
    host: '0.0.0.0', // Allow access via your IP address
    disableHostCheck: true, // Disable host check for development
  },

  node: {
    fs: 'empty',
  },
};
