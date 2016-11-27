const path = require('path');
const webpack = require('webpack');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const argv = require('./array-to-key-value').arrayToKeyValue(process.argv.slice(2));
const src = path.resolve(process.cwd(), 'src');
const dist = path.resolve(process.cwd(), 'dist');
const publicPath = '/';
const isDev = process.env.NODE_ENçV !== 'production' && !argv['env.prod'];
const isProd = !isDev;
const isHot = argv['hot'] || false;
const ifDev = plugin => addPlugin(isDev, plugin);
const ifProd = plugin => addPlugin(isProd, plugin);
const ifHot = plugin => addPlugin(isDev, plugin);
const addPlugin = (add, plugin) => add ? plugin : undefined;
const removeEmpty = array => array.filter(i => !!i);

const host = 'localhost';
const port = process.env.PORT || argv.port || 3000;

module.exports = {
  context: src,
  // Developer tool to enhance debugging, source maps
  // http://webpack.github.io/docs/configuration.html#devtool
  // source map can be turned on/off in UglifyJsPlugin
  devtool: isProd ? 'source-map' : 'cheap-module-eval-source-map',
  bail: isProd, // Don't attempt to continue if there are any errors.
  cache: !isProd,
  target: 'web', // Make web variables accessible to webpack, e.g. window. This is a default value; just be aware of it
  resolve: {
    modules: [
      'src',
      'node_modules',
    ],
    extensions: ['.js', '.jsx', '.json', '.css', '.sass', '.scss', '.html']
  },
  entry: {
    app: [
      './main.scss',
      './index.js',
    ].concat((isHot ? [
      // Webpack2: remove any reference to webpack/hot/dev-server or webpack/hot/only-dev-server
      // from your webpack config. Instead, use the reload config option.
      // reload - Set to true to auto-reload the page when webpack gets stuck. (React: use reload=false)
      // See: https://github.com/glenjamin/webpack-hot-middleware
      //'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true',
      `webpack-hot-middleware/client?path=http://${host}:${port}/__webpack_hmr&timeout=20000`,
    ] : [] )),
    vendor: [
      './vendor.scss',
      'moment'
      // +++ other 3'rd party
    ]
  },
  output: {
    filename: isProd ? 'bundle.[name].[chunkhash].js' : 'bundle.[name].js', // Don't use hashes in dev mode
    chunkFilename: isProd ? 'bundle.[name].[chunkhash].chunk.js' : 'bundle.[name].chunk.js',
    path: dist,
    pathinfo: !isProd,
    publicPath: publicPath,
  },
  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        enforce: 'pre',
        loader: 'eslint-loader',
        include: [src],
        exclude: [/node_modules/],
      },
      {
        test: /\.js[x]?$/,
        include: [src],
        exclude: [/node_modules/],
        loader: 'babel-loader',
      },
      {
        // Enables HMR. Extra step is needed in './src/index.js'
        test: /\.html$/,
        loader: 'html-loader', // loader: 'html', // loader: 'raw' // html vs raw: what's the difference??
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.(jpg|jpeg)$/,
        loader: 'url-loader?name=[name].[ext]&limit=8192&mimetype=image/jpg'
      },
      {
        test: /\.gif$/,
        loader: 'url-loader?name=[name].[ext]&limit=8192&mimetype=image/gif'
      },
      {
        test: /\.png$/,
        use: 'url-loader?name=[name].[ext]&limit=8192&mimetype=image/png'
      },
      {
        test: /\.svg$/,
        loader: 'url-loader?name=[name].[ext]&limit=8192&mimetype=image/svg+xml'
      },
      {
        test: /\.woff?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['url-loader?name=[name].[ext]&limit=100000&mimetype=application/font-woff']
      },
      {
        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['url-loader?name=[name].[ext]&limit=100000&mimetype=application/font-woff2']
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: ['file-loader?name=[name].[ext]&limit=100000&mimetype=application/octet-stream']
      },
      {
        test: /\.otf(\?.*)?$/,
        loader: 'file-loader?name=[name].[ext]&limit=10000&mimetype=font/opentype'
      },
    ].concat( !isHot
      ? [ {
        // No HMR. Creates external CSS
        test: /\.css$/,
        include: [
          src,
          path.resolve(__dirname, 'node_modules')
        ],
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: ['css-loader?sourceMap', 'postcss-loader', 'resolve-url-loader']
        })
      },
      {
        // No HMR. Creates external CSS
        test: /\.s?(a|c)ss$/,
        include: [
          src,
          path.resolve(__dirname, 'node_modules')
        ],
        loader: ExtractTextPlugin.extract({
          fallbackLoader: 'style-loader',
          loader: [
            {
              loader: 'css-loader', query: { sourceMap: true }
            },
            'postcss-loader',
            'resolve-url-loader',
            {
              loader: 'sass-loader', query: { sourceMap: isProd ? 'compressed' : 'expanded' }
            }
          ]
        })
      } ]
      : [ {
        // Enables HMR. Inlines CSS in html head
        test: /\.css$/,
        include: [
          src,
          path.resolve(__dirname, 'node_modules')
        ],
        use: [
          'style-loader',
          // urls does not work when using sourceMap.
          // See: https://github.com/webpack/css-loader/issues/216
          // See: https://github.com/webpack/css-loader/issues/296
          // See: http://stackoverflow.com/questions/37288886/webpack-background-images-not-loading
          'css-loader', // { loader: 'css', query: { sourceMap: true } },
          'postcss-loader',
          'resolve-url-loader',
        ]
      },
      {
        // Enables HMR. Inlines CSS in html head
        test: /\.s?(a|c)ss$/,
        include: [
          src,
          path.resolve(__dirname, 'node_modules')
        ],
        use: [
          'style-loader',
          'css-loader', // { loader: 'css', query: { sourceMap: true } }, // urls does not work when using sourceMap, see: comments above
          'postcss-loader',
          'resolve-url-loader',
          { loader: 'sass-loader', query: { sourceMap: isProd ? 'compressed' : 'expanded' } },
        ]
      },
    ])
  },
  plugins: removeEmpty([
    // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
    // inside your code for any environment checks; UglifyJS will automatically
    // drop any unreachable code.
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),

    new webpack.ProvidePlugin({
      // make fetch available
      // See: http://mts.io/2015/04/08/webpack-shims-polyfills/
      // fetch: 'exports?self.fetch!whatwg-fetch',
      'fetch': 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch',
    }),

    // Module ids are full names
    // Outputs more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),

    // Hook into the compiler to extract progress information.
    //new webpack.ProgressPlugin(),

    new webpack.LoaderOptionsPlugin({
      // See: https://github.com/postcss/postcss-loader/issues/125
      // See: http://pastebin.com/Lmka3rju
      minimize: isProd,
      debug: !isProd,
      stats: {
        colors: true
      },
      options: {
        context: src,
        output: {
          path: dist,
        },
        postcss: [
          precss,
          autoprefixer({
            browsers: [
              'last 2 versions',
              'ie >= 11',
            ],
          }),
        ],
      },
      eslint: {
        failOnWarning: false,
        failOnError: true
      },
    }),

    // Order the modules and chunks by occurrence. This saves space,
    // because often referenced modules and chunks get smaller ids.
    new webpack.optimize.OccurrenceOrderPlugin(),

    // Avoid publishing files when compilation fails
    new webpack.NoErrorsPlugin(),

    // Minify and optimize the index.html
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: true,
      favicon: 'favicon.png',
      minify: isProd ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : {},
    }),

    new ExtractTextPlugin({
      filename: isProd ? 'styles.[name].[chunkhash].css' : 'styles.[name].css',
      disable: false,
      allChunks: true
    }),

    new StyleLintPlugin({
      // https://github.com/vieron/stylelint-webpack-plugin
      // http://stylelint.io/user-guide/example-config/
      configFile: '.stylelintrc',
      context: 'src',
      files: '**/*.s?(a|c)ss',
      syntax: 'scss',
      failOnError: false
    }),

    new CopyWebpackPlugin([
      //{ from: 'favicon.png' },
      { from: 'assets', to: 'assets' }
    ]),

    // Tell webpack we want Hot Module Reloading.
    ifHot(new webpack.HotModuleReplacementPlugin({
      multiStep: true, // Enable multi-pass compilation for enhanced performance in larger projects.
    })),

    // Finetuning 'npm run build:prod'
    // Note: remove '-p' from "build:prod" in package.json
    ifProd(new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      children: true,
      minChunks: 2,
      async: true,
    })),

    // Merge all duplicate modules
    ifProd(new webpack.optimize.DedupePlugin()),

    // saves a couple of kBs
    ifProd(new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
      quiet: true
    })),

    ifProd(new webpack.optimize.UglifyJsPlugin({
      //compressor: {
      //  screw_ie8: true,
      //  warnings: false
      //},
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
      },
      output: {
        comments: false
      },
      sourceMap: true
    }))
    // End: finetuning 'npm run build:prod'
  ]),

  /*
  devServer: {
    port: port,
    hot: true,
    inline: true,
    historyApiFallback: true,
    progress: true,
    stats: {
      colors: true,
      chunkModules: false,
      assets: false
    },
    proxy: proxyPort ? {
      // Our api server
      '/api/*': {
      target: `http://localhost:${proxyPort}`,
      secure: false
      }
    } : {}
  },
  */
};
