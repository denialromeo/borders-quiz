const $ = require("jquery")
const URI = require("urijs")

const { build_question, current_quiz_modes, neighbors } = require("../build-question/build-question.js")

const random = require("../build-question/random.js")
const { map_embed_url } = require("./map-embed-url.js")
const { Timer } = require("./timer.js")

const game_css = require("./game.css").toString()

const game_settings = Object.freeze(require("./game-settings.json"))
const quiz_modes = Object.freeze(require("./quiz-modes.json"))

const game_iframe = document.getElementById("game-container")

const score = { correct: 0, wrong: 0 }
const timer = new Timer()

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

const url_parameters = Object.freeze(new URI(window.location.href).search(true))

function on_mobile_device() {
    return $(document).width() <= 760
}

function neighbors_augmented(territory) {
    if (territory !== undefined && territory.startsWith("_")) { // For overview map at start of quiz.
        territory = territory.slice(1)
    }
    return neighbors(territory)
}

function format_for_display(territory, capitalize_the) {
    var the = ""
    if (game_settings.should_prepend_the.some(regex => new RegExp(regex).exec(territory) !== null)) {
        the = capitalize_the ? "The " : "the "
    }
    if (on_mobile_device() && territory in game_settings.truncations_for_mobile) {
        territory = game_settings.truncations_for_mobile[territory]
    }
    territory = territory.replace(/_/g,'').replace(/\s/g,'&nbsp;').replace(/-/g, '&#8209;')
    return (the + territory)
}

function embed(src) {     
    game_iframe.srcdoc = `<html><head><style>${game_css}</style></head><body>${src}</body></html>`
}

function embed_question(question_info) {
    const { quiz_mode, wrong_answers, answer, territory } = question_info
    var choices = random.shuffle(wrong_answers.concat(answer))
    var question = `<div id='${on_mobile_device() ? "question-container-mobile" : "question-container"}'>
                       <div id='quiz_title'>${quiz_modes[quiz_mode].title}</div>
                       <div id='${(on_mobile_device() ? "question-text-mobile" : "question-text")}'>
                           <p>Which of these does not border ${format_for_display(territory, false)}?</p>
                           <form>`
                               for (let i = 0; i < choices.length; i += 1) {
                                   var choice = choices[i]
                                   var letter = `&emsp;${String.fromCharCode(i + 65)}. `
                                   question += `<input type='radio' id="${choice}" value="${choice}" name='choice'>
                                                <label for="${choice}">${letter}${format_for_display(choice, true)}</label><br>`
                               }
              question += `</form>
                       </div>
                       <p id='score_and_timer'>
                           <em id='score'>Correct: ${score.correct}&nbsp;&nbspWrong: ${score.wrong}</em><br>
                           <span id='timer'>${timer.formatted_time}</span>
                       </p>
                    </div>`

    embed(question)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function begin_timing() {
        var timer_dom_node = game_iframe.contentWindow.document.getElementById("timer")
        if (timer_dom_node === null) {
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
        if (choices.length === 0) {
            window.requestAnimationFrame(detect_player_choice)
        }
        else {
            Array.from(choices).forEach(choice =>
                choice.onclick = function() {
                    embed_map(question_info, this.id)
                }
            )
        }
    }
    detect_player_choice()
}

function borders_sentence(territory) {

    var neighboring_territories = neighbors_augmented(territory)
    if (!game_settings.dont_sort_neighbors.contains(territory)) {
        neighboring_territories.sort()
    }
    neighboring_territories = neighboring_territories.map(n => format_for_display(n, false))

    var sentence = format_for_display(territory, true) + (game_settings.plural.contains(territory) ? ` border ` : ` borders `)

    if (neighboring_territories.length === 0) {
        sentence += `nothing!`
    }
    else if (neighboring_territories.length === 1) {
        sentence += `only ${neighboring_territories[0]}.`
    }
    else if (neighboring_territories.length === 2) {
        sentence += `${neighboring_territories[0]} and ${neighboring_territories[1]}.`
    }
    else {
        var last = neighboring_territories.pop()
        sentence += `${neighboring_territories.join(", ")}, and ${last}.`
    }

    return sentence
}

function right_or_wrong_message(chosen, answer, territory) {
    var subject = chosen === answer ? chosen : answer
    var does_or_do = !game_settings.plural.contains(subject) ? "does" : "do"
    return chosen === answer ?
           `Correct! ${format_for_display(chosen, true)} ${does_or_do} not border ${format_for_display(territory, false)}!`
         : `Sorry! ${format_for_display(territory, true)} ${does_or_do} border ${format_for_display(chosen, false)}!`
}

function embed_map(question_info, chosen, start_map_screen=false) {
    const { quiz_mode, answer, territory } = question_info
    const subject = (chosen === answer ? chosen : territory)

    let neighbors_message
    if (start_map_screen && "starting_message" in quiz_modes[quiz_mode]) {
        neighbors_message = quiz_modes[quiz_mode].starting_message
    }
    else if (start_map_screen && (neighbors_augmented(subject) === undefined || neighbors_augmented(subject).length === 0)) {
        neighbors_message = "Get a feel for what's where!"
    }
    else {
        neighbors_message = borders_sentence(subject)
    }

    var user_hint = subject in game_settings.user_hint ? game_settings.user_hint[subject] : quiz_modes[quiz_mode].click_message

    var content = `<div id='${on_mobile_device() ? "map-container-mobile" : "map-container"}'>
                    <center>
                        <p>${!start_map_screen ? right_or_wrong_message(chosen, answer, territory) : format_for_display(subject, true)}</p>
                        <iframe id='${on_mobile_device() ? "map-mobile" : "map"}' scrolling='no' frameborder=0 
                                src='${map_embed_url(quiz_mode, subject, url_parameters, start_map_screen, on_mobile_device())}'></iframe>
                        <p>${neighbors_message}</p>
                        <button id='next'></button>
                        ${on_mobile_device() ? `` : `<p id='click-message'>${user_hint}</p>`}
                    </center>
                   </div>`

    embed(content)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function next_question_button() {
        var next_button = game_iframe.contentWindow.document.getElementById("next")
        if (next_button === null) {
            window.requestAnimationFrame(next_question_button)
        }
        else {
            if (start_map_screen) {
                next_button.innerHTML = "Start"
                next_button.onclick = function() { next_question() }
            }
            else if (chosen === answer) {
                score.correct += 1
                next_button.innerHTML = "Next"
                next_button.onclick = function() { next_question() }
            }
            else if (chosen !== answer) {
                score.wrong += 1
                next_button.innerHTML = "Try Again"
                next_button.onclick = function() { next_question(question_info) }
            }
        }
    }
    next_question_button()
}

function next_question(question_info=build_question(url_parameters)) {
    embed_question(question_info)
}

function unused_quiz_modes() {
    return Object.keys(quiz_modes).filter(mode => !current_quiz_modes(url_parameters).contains(mode))
}

function other_quiz_modes_message() {
    var message  = `<span style="display:block;margin-bottom:15px;"/>`
    if (unused_quiz_modes().length > 0) {
        message += `<div style="font-family:Helvetica">
                        <p>You can also try these quiz modes!</p>
                        <ul class='unused-quiz-modes'>`
            unused_quiz_modes().forEach(mode =>
                message += `<li>
                                <a target='_self' href='?${mode}'>${quiz_modes[mode].anthem}</a>&nbsp;
                                ${quiz_modes[mode].description}
                            </li>`
            )
            message += `</ul>`
        message += `</div>`
    }
    return message
}

// Let's go!!!!!!!
function start_game() {
    if ("no-start-map" in url_parameters) {
        next_question()
    }
    else {
        var possible_starting_addresses = [url_parameters["start-map"], quiz_modes[current_quiz_modes(url_parameters)[0]].starting_map]
        const starting_address = possible_starting_addresses.find(address => address !== undefined)
        if (starting_address === undefined || current_quiz_modes(url_parameters).length > 1 ||
            (("custom" in url_parameters || "start" in url_parameters) && !("start-map" in url_parameters))) {
            next_question()
        }
        else {
            try {
                embed_map(Object.freeze({ quiz_mode: current_quiz_modes(url_parameters)[0],
                                          territory: starting_address,
                                          answer: starting_address,
                                          wrong_answers: [] }),
                          starting_address,
                          true)
            }
            catch(e) {
                next_question()
            }
        }
    }
    $(game_iframe).after(other_quiz_modes_message())
}
////

// Exports
Object.assign(exports, {
    start_game: start_game
})