require("babel-polyfill")

require("!style-loader!css-loader!sass-loader!./game/game.scss")

const { start_game } = require("./game/game.js")

start_game()