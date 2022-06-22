module.exports = (_, { mode }) => ({
  entry: {
    main: "./src/main.js",
  },
  devServer: {
    host: "0.0.0.0",
    hot: true,
  },
  devtool: mode === "development" ? "eval-source-map" : "source-map",
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {}
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      },
      {
        test: /\.glsl$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "raw-loader"
          }
        ]
      }
    ],
  },
})
