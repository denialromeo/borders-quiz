const $ = require("jquery")

var { first_question, other_quiz_modes_message } = require("./game.js")

$(document).ready(function() {
	first_question()
})
document.write(other_quiz_modes_message())