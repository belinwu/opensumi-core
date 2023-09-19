const path = require('path');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { ProgressPlugin } = require('webpack');

const tsconfigPath = path.join(__dirname, '../../configs/ts/references/tsconfig.extension.json');

/** @type { import('webpack').Configuration } */
module.exports = {
  entry: path.join(__dirname, './src/hosted/worker.host-preload.ts'),
  output: {
    filename: 'worker-host.js',
    path: path.resolve(__dirname, 'lib/'),
    // library: `extend-browser-worker-${pkg.name}`,
    // libraryTarget: 'umd'
  },
  target: 'webworker',
  optimization: {
    minimize: false,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      net: false,
    },
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader', options: { onlyCompileBundledFiles: true, configFile: tsconfigPath } },
      // css won't be bundled
      { test: /\.css$/, loader: 'null-loader' },
    ],
  },
  plugins: [!process.env.CI && new ProgressPlugin(), new NodePolyfillPlugin()].filter(Boolean),
};
