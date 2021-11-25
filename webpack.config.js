const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const Copy = require('copy-webpack-plugin');
const {merge} = require('webpack-merge');

const dist = path.join(__dirname, 'dist');
const drawPath = path.resolve(__dirname, 'node_modules/@olympeio/draw');

const common = {
    entry: './src/main.js',
    output: {path: dist, globalObject: 'this'},
    mode: 'development',
    devtool: 'source-map',
    module: {
        rules: [
            {test: /\.js$/, enforce: "pre", use: "source-map-loader", exclude: path.resolve(__dirname, 'node_modules/stellar-sdk')},
            {test: /\.js$/, enforce: "pre", use: "webpack-import-glob-loader"}
        ]
    },
    resolve: {
        alias: {
            '@olympeio': path.resolve(__dirname, 'node_modules/@olympeio')
        }
    },
    plugins: [
        new CleanWebpackPlugin(),
        new Copy({patterns: [
            {from: 'res/version.json', to: 'version.json'}
        ]})
    ]
};

const server = {
    devServer: {
        port: 8888,
        client: {
            overlay: {
                warnings: false
            }
        },
        static: {
            directory: dist
        },
        devMiddleware: {
            writeToDisk: true
        }
    }
};

const draw = {
    resolve: {
        alias: {olympe: drawPath}
    },
    plugins: [
        new Copy({patterns: [
            {from: 'res/index.html', to: 'index.html'},
            {from: drawPath + '/images', to: 'images'},
            {from: drawPath + '/fonts', to: 'fonts'},
            {from: drawPath + '/css', to: 'css'},
            {from: drawPath + '/doc', to: 'doc'}
        ]})
    ]
};
const drawLocal = {
    name: 'draw-local',
    plugins: [
        new Copy({
            patterns: [
                {from: 'res/oConfig-local.json', to:'oConfig.json'}
            ]
        })
    ]
}
const drawDist = {
    name: 'draw-dist',
    plugins: [
        new Copy({
            patterns: [
                {from: 'res/oConfig-dist.json', to:'oConfig.json'}
            ]
        })
    ]
}

const node = {
    entry: './src/main-node.js',
    target: 'node',
    output: {path: path.join(__dirname, 'dist-node'), globalObject: 'this'},
    resolve: {
        alias: {olympe: path.resolve(__dirname, 'node_modules/@olympeio/runtime-node')}
    }
};
const nodeLocal = {
    name: 'node-local',
    plugins: [
        new Copy({
            patterns: [
                {from: 'res/oConfig-local.json', to:'oConfig.json'}
            ]
        })
    ]
}
const nodeDist = {
    name: 'node-dist',
    plugins: [
        new Copy({
            patterns: [
                {from: 'res/oConfig-dist.json', to:'oConfig.json'}
            ]
        })
    ]
}

module.exports = [merge(common, server, draw, drawLocal), merge(common, server, draw, drawDist), merge(common, node, nodeLocal), merge(common, node, nodeDist)];
