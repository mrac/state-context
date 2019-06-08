const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    devtool: 'source-map',
    target: 'web',
    entry: './package/src/index.tsx',
    output: {
        filename: 'index.js',
        path: path.join(__dirname, 'package', 'dist'),
        libraryTarget: 'commonjs'
    },
    externals: {
        react: 'react'
    },
    optimization: {
        sideEffects: false,
        minimizer: [new TerserPlugin({
            terserOptions: {
                mangle: true,
                keep_classnames: true,
                keep_fnames: true,
            },
            sourceMap: true
        })]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'awesome-typescript-loader',
                    options: {
                        configFileName: 'tsconfig.json'
                    }
                },
            }
        ]
    }
};
