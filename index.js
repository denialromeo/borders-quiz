require("babel-polyfill")

const $ = require("jquery")

var { start_game, other_quiz_modes_message } = require("./borders-quiz/game/game.js")

$(document).ready(function() {
	start_game()
})
document.write(other_quiz_modes_message())
