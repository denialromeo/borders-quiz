const $ = require("jquery")

var { first_question, game_page_bottom_message } = require("./game.js")

$(document).ready(function() {
	first_question()
})
document.write(game_page_bottom_message())