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
        query: {
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
    // proxy: {
    //   '/advSearch': 'https://metaverse-portfolio-website.vercel.app/', // Assuming your server is running on port 3000
    // },
    contentBase: path.join(__dirname, ''),
    compress: true,
    watchContentBase: true,
    port: 8080,
    host: '0.0.0.0', //your ip address
    disableHostCheck: true, //coment these out for prod
  },
  node: {
    fs: 'empty',
  },
};
