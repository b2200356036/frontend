/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const Visualizer = require('webpack-visualizer-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
    .BundleAnalyzerPlugin;
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const config = require('./webpack.config.dcr.js');

module.exports = webpackMerge.smart(config, {
    mode: 'production',
    output: {
        filename: `[chunkhash]/graun.[name].dcr.js`,
        chunkFilename: `[chunkhash]/graun.[name].dcr.js`,
    },
    devtool: 'source-map',
    plugins: [
        new Visualizer({
            filename: './dcr-webpack-stats.html',
        }),
        new BundleAnalyzerPlugin({
            reportFilename: './dcr-bundle-analyzer-report.html',
            analyzerMode: 'static',
            openAnalyzer: false,
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        new UglifyJSPlugin({
            parallel: true,
            sourceMap: true,
        }),
    ],
    optimization: {
        splitChunks: {
            cacheGroups: {
                // any @guardian/* module over 30kb gets its own chunk
                packages: {
                    test(module) {
                        return (
                            module.size() > 30000 &&
                            module
                                .identifier()
                                .includes('node_modules/@guardian/')
                        );
                    },
                    chunks: 'all',
                    priority: 40,
                    minSize: 0,
                    reuseExistingChunk: true,
                    name(module) {
                        return `guardian-package.${module.identifier().split('node_modules/@guardian/')[1].split('/')[0]}`
                    },
                },

                // all non-@guardian modules get their own chunk
                vendors: {
                    chunks: 'all',
                    // prebid and video.js are so big webpack gives them their own chunk
                    // make sure they dont get into vendors
                    test: /node_modules\/(?!@guardian|prebid|video\.js)/,
                    priority: 30,
                    name: 'vendors',
                    reuseExistingChunk: true,
                },
            }
        },
    },
});
