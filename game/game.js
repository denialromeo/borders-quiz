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

Array.prototype.contains = function(item) { return this.indexOf(item) >= 0 }

const url_parameters = Object.freeze(new URI(window.location.href).search(true))

function on_mobile_device() { return $(document).width() <= 760 }

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

function embed_question(question=build_question(url_parameters)) {
    const { quiz_mode, wrong_answers, answer, territory } = question
    var choices = random.shuffle(wrong_answers.concat(answer))
    var title_text
    if ("title" in url_parameters) {
        title_text = url_parameters["title"]
    }
    else {
        title_text = quiz_modes[quiz_mode].title
    }
    var content = `<div id='${on_mobile_device() ? "question-container-mobile" : "question-container"}'>
                      <div id='quiz_title'>${title_text}</div>
                      <div id='${(on_mobile_device() ? "question-text-mobile" : "question-text")}'>
                          <p>Which of these does not border ${format_for_display(territory, false)}?</p>
                          <form>`
                              for (let i = 0; i < choices.length; i += 1) {
                                  var choice = choices[i]
                                  var letter = `&emsp;${String.fromCharCode(i + 65)}. `
                                  content  += `<input type='radio' id="${choice}" value="${choice}" name='choice'>
                                               <label for="${choice}">${letter}${format_for_display(choice, true)}</label><br>`
                              }
              content += `</form>
                      </div>
                      <p id='score_and_timer'>
                          <em id='score'>Correct: ${score.correct}&nbsp;&nbspWrong: ${score.wrong}</em><br>
                          <span id='timer'>${timer.formatted_time}</span>
                      </p>
                   </div>`

    embed(content)

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
            Array.from(choices).forEach(choice => choice.onclick = function() { embed_normal_map(question, this.id) })
        }
    }
    detect_player_choice()
}

function borders_sentence(territory, neighboring_territories) {
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

function embed_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint) {
    var content = `<div id='${on_mobile_device() ? "map-container-mobile" : "map-container"}'>
                    <center>
                        <p>${title_text}</p>
                        <iframe id='${on_mobile_device() ? "map-mobile" : "map"}' scrolling='no'
                                frameborder=0 src='${embedded_map_url}'></iframe>
                        <p>${bottom_text}</p>
                        <button id='next'></button>
                        ${on_mobile_device() ? `` : `<p id='user-hint'>${user_hint}</p>`}
                    </center>
                   </div>`

    embed(content)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function set_next_button() {
        var next_button = game_iframe.contentWindow.document.getElementById("next")
        if (next_button === null) {
            window.requestAnimationFrame(set_next_button)
        }
        else {
            next_button.innerHTML = next_button_text
            next_button.onclick = next_button_onclick
        }
    }
    set_next_button()
}

function embed_start_map(quiz_mode, territory) {
    var title_text
    if ("title" in url_parameters) {
        title_text = url_parameters["title"]
    }
    else {
        title_text = format_for_display(territory, true)
    }
    var embedded_map_url = map_embed_url(quiz_mode, territory, url_parameters, true, on_mobile_device())
    if (territory !== undefined && territory.startsWith("_")) { territory = territory.slice(1) }
    var neighboring_territories = neighbors(territory)
    var bottom_text
    if ("starting_message" in quiz_modes[quiz_mode]) { 
        bottom_text = quiz_modes[quiz_mode].starting_message
    }
    else if (neighboring_territories === undefined || neighboring_territories.length === 0) {
        bottom_text = "Get a feel for what's where!"
    }
    else {
        bottom_text = borders_sentence(territory, neighboring_territories)
    }
    var next_button_text = "Start"
    var next_button_onclick = function() { embed_question() }
    const user_hint = territory in game_settings.user_hint ? game_settings.user_hint[subject] : quiz_modes[quiz_mode].click_message
    embed_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint)
}

function embed_normal_map(question, chosen) {
    const { quiz_mode, answer, territory } = question
    const subject = chosen === answer ? chosen : territory
    const title_text = right_or_wrong_message(chosen, answer, territory)
    const embedded_map_url = map_embed_url(quiz_mode, subject, url_parameters, false, on_mobile_device())
    const bottom_text = borders_sentence(subject, neighbors(subject))
    const next_button_text = chosen === answer ? "Next" : "Try Again"
    const next_button_onclick = chosen === answer ? function() { score.correct += 1; embed_question() } 
                                                  : function() { score.wrong += 1; embed_question(question) }
    const user_hint = subject in game_settings.user_hint ? game_settings.user_hint[subject] : quiz_modes[quiz_mode].click_message
    embed_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint)
}

function unused_quiz_modes() {
    return Object.keys(quiz_modes).filter(mode => !current_quiz_modes(url_parameters).contains(mode))
}

function other_quiz_modes_message() {
    var message = `<span style="display:block;margin-bottom:15px;"/>`
    if (unused_quiz_modes().length > 0) {
        message += `<div style="font-family:Helvetica">
                        <p>You can also try these quiz modes!</p>
                        <ul class='unused-quiz-modes'>`
            unused_quiz_modes().forEach(mode =>
                message += `<li>
                                <a target='_self' href='?${mode}'>${quiz_modes[mode].anthem}</a>&nbsp;
                                ${quiz_modes[mode].description}
                            </li>`)
            message += `</ul>
                    </div>`
    }
    return message
}

// Let's go!!!!!!!
function start_game() {
    const starting_address = [url_parameters["start-map"], quiz_modes[current_quiz_modes(url_parameters)[0]].starting_map]
                            .find(address => address !== undefined)
    if ("no-start-map" in url_parameters || starting_address === undefined || current_quiz_modes(url_parameters).length > 1 ||
        (("custom" in url_parameters || "start" in url_parameters) && !("start-map" in url_parameters))) {
        embed_question()
    }
    else {
        try {
            embed_start_map(current_quiz_modes(url_parameters)[0], starting_address)
        }
        catch(e) {
            embed_question()
        }
    }
    $(game_iframe).after(other_quiz_modes_message())
}
////

// Exports
Object.assign(exports, {
    start_game: start_game
})