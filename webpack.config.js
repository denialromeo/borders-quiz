module.exports = {
	entry: "./index.js",
	output: {
		path: __dirname + "/dist",
		filename: "borders-quiz.js"
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				exclude: /node_modules/,
				use: 'css-loader',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['babel-preset-env']
					}
				}
			}
		]
	},
	devServer: {
		port:8000
	},
};
