require("babel-polyfill")

require("!style-loader!css-loader!./game/game.css")

const { start_game } = require("./game/game.js")

start_game()