import path from 'path';
import fs from 'fs';

const nodeModules = fs.readdirSync('node_modules')
  .filter(descriptor => descriptor !== '.bin')
  .reduce((modules, module) => ({ ...modules, [module]: `commonjs ${module}` }), {});

export default {
  entry: './src/server.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: './bundle.js',
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel' },
    ],
  },
  externals: nodeModules,
};
