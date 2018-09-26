module.exports = {
	entry: "./borders-quiz/main.js",
	output: {
		path: __dirname + "/js",
		filename: "borders-quiz.js"
	},
	module: {
		rules: [
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
	}
};