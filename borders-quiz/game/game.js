const $ = require("jquery")
const URI = require("urijs")

const { build_question, current_quiz_modes, neighbors } = require("../build-question/build-question.js")

const random = require("../build-question/random.js")
const { Timer } = require("./timer.js")

const google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
const game_css_path = "/borders-quiz/game/borders-quiz.css"

const quiz_modes = require("./quiz-modes.json")
const game_settings = require("./game-settings.json")

const game_iframe = document.getElementById("game-container")

var score = { correct: 0, wrong: 0 }
var timer = new Timer()

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

const url_parameters = Object.freeze(new URI(window.location.href).search(true))

function geocode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: { key: google_maps_api_key, address: address }, async: false, success: r => json = r })
    return json
}

function coordinates(quiz_mode, address) {
    if (game_settings.recenter_map[address] != undefined) {
        address = game_settings.recenter_map[address]
    }
    else if (neighbors(address).length > 0) {
        address += quiz_modes[quiz_mode].geocode_append
    }
    return geocode(address).results[0].geometry.location
}

function google_maps_zoom_level(quiz_mode, territory) {
    var possible_zoom_levels = [url_parameters["z"], game_settings.custom_zoom_levels[territory], quiz_modes[quiz_mode].default_zoom_level]
    var zoom_level = possible_zoom_levels.find(zl => zl != undefined)
    if (on_mobile_device() && zoom_level > 2) {
        zoom_level -= 1
    }
    return zoom_level
}

function map_embed_url(quiz_mode, territory) {
    var url = new URI(quiz_modes[quiz_mode].map_embed_base_url)
    const { lat, lng } = coordinates(quiz_mode, territory)
    return url.addSearch({ "lat": lat, "lng": lng, "z": google_maps_zoom_level(quiz_mode, territory) }).toString()
}

function prepend_the(territory, capitalize_the) {
    var the = (capitalize_the ? "The " : "the ")
    return (game_settings.should_prepend_the.contains(territory) ? the : "")
}

function truncate_for_mobile(territory) {
    if (on_mobile_device() && game_settings.truncations_for_mobile[territory] != undefined) {
        return game_settings.truncations_for_mobile[territory]
    }
    return territory
}

function pretty_print(territory, capitalize_the) {
    var the = prepend_the(territory, capitalize_the)
    territory = truncate_for_mobile(territory)
    territory = territory.replace(/_/g,'').replace(/\s/g,'&nbsp;').replace(/-/g, '&#8209;')
    return (the + territory)
}

function on_mobile_device() {
    return $(document).width() <= 760
}

function embed(src) {     
    game_iframe.srcdoc ="<html><head><link rel='stylesheet' href='" + game_css_path + "'/></head><body>" + src + "</body></html>"
}

function embed_question(question_info) {
    const { quiz_mode, wrong_answers, answer, territory } = question_info
    var choices = random.shuffle(wrong_answers.concat(answer))
    var question  = `<div id='${on_mobile_device() ? "question-container-mobile" : "question-container"}'>
                        <div id='quiz_title'>${quiz_modes[quiz_mode].title}</div>
                        <div id='${(on_mobile_device() ? "question-text-mobile" : "question-text")}'>
                            <p>Which of these does not border ${pretty_print(territory, false)}?</p>
                            <form>`
                                for (let i = 0; i < choices.length; i += 1) {
                                    var choice = choices[i]
                                    var letter = `&emsp;${String.fromCharCode(i + 65)}. `
                                    // Do not replace the double-quotes or game will break on territories like "Cote d'Ivoire".
                                    question += `<input type='radio' id="${choice}" value="${choice}" name='choice'>
                                                 <label for="${choice}">${letter}${pretty_print(choice, true)}</label><br>`
                                }
               question += `</form>
                        </div>
                        <p id='score_and_timer'>
                            <i id='score'>Correct: ${score.correct}&nbsp;&nbspWrong: ${score.wrong}</i><br>
                            <span id='timer'>${timer.formatted_time}</span>
                        </p>
                    </div>`

    embed(question)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function begin_timing() {
        var timer_dom_node = game_iframe.contentWindow.document.getElementById("timer")
        if (timer_dom_node == undefined) {
            window.requestAnimationFrame(begin_timing);
        }
        else {
            timer.start_timer(function(time) { timer_dom_node.innerHTML = time })
        }
    }
    begin_timing()

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function detect_player_choice() {
        var choices = game_iframe.contentWindow.document.getElementsByName("choice")
        if (choices.length == 0) {
            window.requestAnimationFrame(detect_player_choice)
        }
        else {
            choices.forEach(choice =>
                choice.onclick = function() {
                    question_info.chosen = this.id
                    embed_map(question_info)
                }
            )
        }
    }
    detect_player_choice()
}

function borders_sentence(territory) {

    var neighbors_ = neighbors(territory)
    if (!game_settings.dont_sort_neighbors.contains(territory)) {
        neighbors_.sort()
    }

    neighbors_ = neighbors_.map(n => pretty_print(n, false))

    var sentence = `${pretty_print(territory, true)} borders `
    if (neighbors_.length == 0) {
        sentence += `nothing!`
    }
    else if (neighbors_.length == 1) {
        sentence += `only ${neighbors_[0]}.`
    }
    else if (neighbors_.length == 2) {
        sentence += `${neighbors_[0]} and ${neighbors_[1]}.`
    }
    else {
        var last = neighbors_.pop()
        neighbors_.forEach(n => sentence += `${n}, `)
        sentence += `and ${last}.`
    }

    return sentence
}

function right_or_wrong_message(chosen, answer, territory) {
    return chosen == answer ?
           `Correct! ${pretty_print(chosen, true)} does not border ${pretty_print(territory, false)}!`
         : `Sorry! ${pretty_print(territory, true)} does border ${pretty_print(chosen, false)}!`
}

function embed_map(question_info, called_from_question=true) {
    const { quiz_mode, chosen, answer, territory } = question_info
    const subject = (chosen == answer ? chosen : territory)

    var content = `<div id='${on_mobile_device() ? "map-container-mobile" : "map-container"}'>
                    <center>
                        <p>${called_from_question ? right_or_wrong_message(chosen, answer, territory) : pretty_print(subject, true)}</p>
                        <iframe id='${on_mobile_device() ? "map-mobile" : "map"}' scrolling='no' frameborder=0 src='${map_embed_url(quiz_mode, subject)}'></iframe>
                        <p>${(neighbors(subject).length == 0 && !called_from_question) ? "Get a feel for what's where!" : borders_sentence(subject) }</p>
                        <button id='next'></button>
                        ${on_mobile_device() ? `` : `<p id='click-message'>${quiz_modes[quiz_mode].click_message}</p>`}
                    </center>
                   </div>`

    embed(content)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function next_question_button() {
        var next_button = game_iframe.contentWindow.document.getElementById("next")
        if (next_button == undefined) {
            window.requestAnimationFrame(next_question_button)
        }
        else {
            if (chosen == answer) {
                score.correct += 1
                next_button.innerHTML = "Next"
                next_button.onclick = function() { next_question() }
            }
            else {
                score.wrong += 1
                next_button.innerHTML = "Try Again"
                next_button.onclick = function() { next_question(question_info) }
            }
        }
    }
    next_question_button()
}

// A sample question_info object is
// { territory: "United States", answer: "Guatemala", wrong_answers: ["Mexico", "Canada"] }
function next_question(question_info=build_question(url_parameters)) {
    embed_question(question_info)
}

// To give the player a chance to browse the map before they begin.
// http://danielmoore.us/borders-quiz?california-counties&start-map=Taco+Bell+Fremont+CA
function start_map() {
    timer.pause_timer()
    const custom_address = url_parameters["start-map"]
    if (custom_address != undefined) {
        score.correct -= 1
        embed_map({ quiz_mode: current_quiz_modes(url_parameters)[0],
                    territory: custom_address,
                    answer: custom_address,
                    wrong_answers: [],
                    chosen: custom_address },
                  false)
    }
}
////

function first_question() {
    next_question()
    start_map()
}

function unused_quiz_modes(url_parameters) {
    return Object.keys(quiz_modes).filter(mode => !current_quiz_modes(url_parameters).contains(mode))
}

function other_quiz_modes_message() {
    var message  = ""
    if (unused_quiz_modes(url_parameters).length > 0) {
        message += `<p>You can also try these quiz modes!</p>
                    <ul class='unused-quiz-modes'>`
        unused_quiz_modes(url_parameters).forEach(mode =>
            message += `<li>
                            <a target='_self' href='?${mode}'>${quiz_modes[mode].anthem}</a>&nbsp;
                            ${quiz_modes[mode].description}
                        </li>`
        )
        message += `</ul>`
    }
    return message
}

// Exports
Object.assign(exports, {
    first_question: first_question,
    other_quiz_modes_message: other_quiz_modes_message
})