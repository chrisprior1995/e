var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: './index.js',
    output: {
        path: path.join(__dirname, './public/res'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
            { test: /\.(sass|scss)$/, loader: ExtractTextPlugin.extract({ fallback: "style-loader", use: 'css-loader!sass-loader' }) },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        scss: 'vue-style-loader!css-loader!sass-loader!',
                        sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
                    },
                }
            },
        ]
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.js'
        }
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            title: 'My Page',
            hash: true,
            template: __dirname + '/index.html',
            filename: __dirname + '/public/index.html',
        }),
        new ExtractTextPlugin('styles.css')
    ]
};
