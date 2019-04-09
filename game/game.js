const $ = require("jquery")
const URI = require("urijs")

const { build_question, current_quiz_modes, neighbors } = require("../build-question/build-question.js")

const random = require("../build-question/random.js")
const { map_embed_url } = require("./map-embed-url.js")
const { Timer } = require("./timer.js")

const game_settings = Object.freeze(require("./game-settings.json"))
const quiz_modes = Object.freeze(require("./quiz-modes.json"))

const game_container = document.getElementById("game-container")

const score = { correct: 0, wrong: 0 }
const timer = new Timer()

/** The URL query string parsed as an object. ?custom=Algeria becomes {"custom":"Algeria"} */
const url_parameters = Object.freeze(new URI(window.location.href).search(true))

/** "Monkey patches" Array with a method that returns whether the array contains a given item. */
Array.prototype.contains = function(item) { return this.indexOf(item) >= 0 }

/**
 * Returns whether the game is being viewed on a mobile device.
 */
function on_mobile_device() { return $(document).width() <= 760 }

/**
 * Displays given content to the player.
 * @param {string} content The content to display.
 */
function display(content) {
    game_container.innerHTML = content
}

/**
 * Formats a given territory for display to the user and returns the formatted territory.
 * @param {string}  territory      The territory to format (e.g. "United States").
 * @param {boolean} capitalize_the Whether to capitalize "the" if the territory starts with it
 *                                 (e.g. "The United States" or "the United States").
 */
function format_for_display(territory, capitalize_the) {
    var the = ""
    if (game_settings.should_prepend_the.some(regex => new RegExp(regex).exec(territory) !== null)) {
        the = (capitalize_the ? "The " : "the ")
    }
    if (on_mobile_device() && territory in game_settings.abbreviations_for_mobile) {
        territory = game_settings.abbreviations_for_mobile[territory]
    }
    territory = territory.replace(/_/g,'').replace(/\s/g,'&nbsp;').replace(/-/g, '&#8209;')
    return (the + territory)
}

/**
 * Displays the given question.
 * @param {Object} question Example - { quiz_mode: "countries", territory: "Denmark", answer: "Belgium", wrong_answers: ["Germany"] }
 */
function display_question(question=build_question(url_parameters)) {
    const { quiz_mode, wrong_answers, answer, territory } = question
    const choices = Object.freeze(random.shuffle(wrong_answers.concat(answer)))
    const title_text = ("title" in url_parameters ? url_parameters["title"] : quiz_modes[quiz_mode].title)
    var content = `<div id='question-container'>
                      <div id='quiz_title'>${title_text}</div>
                      <div id='${(on_mobile_device() ? "question-text-mobile" : "question-text")}'>
                          <p>Which of these does not border ${format_for_display(territory, false)}?</p>
                          <form>`
                              for (let i = 0; i < choices.length; i += 1) {
                                  const choice = choices[i]
                                  const letter = `&emsp;${String.fromCharCode(i + 65)}. `
                                  content  += `<input type='radio' id="${choice}" value="${choice}" name='choice'>
                                               <label for="${choice}">${letter}${format_for_display(choice, true)}</label><br>`
                              }
              content += `</form>
                      </div>
                   </div>
                   <p id='score-and-timer'>
                       <em id='score'>Correct: ${score.correct}&nbsp;&nbspWrong: ${score.wrong}</em><br>
                       <span id='timer'>${timer.formatted_time}</span>
                   </p>`

    display(content)

    function begin_timing() {
        const timer_dom_node = document.getElementById("timer")
        if (timer_dom_node === null) {
            window.requestAnimationFrame(begin_timing);
        }
        else {
            timer.start(function(time) { timer_dom_node.innerHTML = time })
        }
    }
    begin_timing()

    function detect_player_choice() {
        const choices = document.getElementsByName("choice")
        if (choices.length === 0) {
            window.requestAnimationFrame(detect_player_choice)
        }
        else {
            Array.from(choices).forEach(choice => choice.onclick = function() { display_normal_map(question, this.id) })
        }
    }
    detect_player_choice()
}

/**
 * Displays the map screens shown at the start of the game and after each question.
 * @param {string}   title_text          The text to display at the top of the screen.
 * @param {string}   embedded_map_url    The Google Maps embed URL to display to the user.
 * @param {string}   bottom_text         The text to display at the bottom of the screen.
 * @param {string}   next_button_text    The text to display on the "next" button.
 * @param {function} next_button_onclick The callback to run when the "next" button is clicked.
 * @param {string}   user_hint           The text to display at the bottom right corner of the screen.
 */
function display_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint) {
    var content = `<div id='${on_mobile_device() ? "map-container-mobile" : "map-container"}'>
                    <center>
                        <p>${title_text}</p>
                        <iframe id='${on_mobile_device() ? "map-mobile" : "map"}' scrolling='no'
                                frameborder=0 src='${embedded_map_url}'></iframe>
                        <p id=borders-sentence>${bottom_text}</p>
                        <button id='next'>${next_button_text}</button>
                        ${on_mobile_device() ? `` : `<p id='user-hint'>${user_hint}</p>`}
                    </center>
                   </div>`

    display(content)

    function set_next_button() {
        const next_button = document.getElementById("next")
        if (next_button === null) {
            window.requestAnimationFrame(set_next_button)
        }
        else {
            next_button.onclick = next_button_onclick
        }
    }
    set_next_button()
}

/**
 * Returns a sentence explaining a territory's borders (e.g. "The United States borders Canada and Mexico.").
 * @param {string}   territory               The subject territory.
 * @param {string[]} neighboring_territories An array of the territories bordering the territory.
 */
function borders_sentence(territory, neighboring_territories) {
    if (!game_settings.dont_sort_neighbors.contains(territory)) {
        neighboring_territories.sort()
    }
    neighboring_territories = neighboring_territories.map(n => format_for_display(n, false))

    var sentence = format_for_display(territory, true)
    sentence    += (game_settings.plural.contains(territory) ? ` border ` : ` borders `)

    switch(neighboring_territories.length) {
        case 0:
            sentence += `nothing!`
            break
        case 1:
            sentence += `only ${neighboring_territories[0]}.`
            break
        case 2:
            sentence += `${neighboring_territories[0]} and ${neighboring_territories[1]}.`
            break
        default:
            const last = neighboring_territories.pop()
            sentence += `${neighboring_territories.join(", ")}, and ${last}.`
    }

    return sentence
}

/**
 * Displays the map shown at the start of the game.
 * @param {string} quiz_mode The key to look up in quiz-modes.json.
 * @param {string} territory The address to map.
 */
function display_start_map(quiz_mode, territory) {
    const title_text = ("title" in url_parameters ? url_parameters["title"] : format_for_display(territory, true))
    const embedded_map_url = map_embed_url(quiz_mode, territory, url_parameters, true, on_mobile_device())
    if (territory !== undefined && territory.startsWith("_")) { territory = territory.slice(1) }
    const neighboring_territories = neighbors(territory)
    let bottom_text
    if ("starting_message" in quiz_modes[quiz_mode] && !("start-map" in url_parameters)) {
        bottom_text = quiz_modes[quiz_mode].starting_message
    }
    else if (neighboring_territories === undefined || neighboring_territories.length === 0) {
        bottom_text = "Get a feel for what's where!"
    }
    else {
        bottom_text = borders_sentence(territory, neighboring_territories)
    }
    const next_button_text = "Start"
    const next_button_onclick = function() { display_question() }
    const user_hint = (territory in game_settings.user_hint ? game_settings.user_hint[subject] : quiz_modes[quiz_mode].user_hint)
    display_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint)
}

/**
 * Displays the map shown after the player answers a question.
 * @param {Object} question Example - { quiz_mode: "countries", territory: "Denmark", answer: "Belgium", wrong_answers: ["Germany"] }
 * @param {string} chosen   The answer the player chose.
 */
function display_normal_map(question, chosen) {
    const { quiz_mode, answer, territory } = question
    const subject = (chosen === answer ? chosen : territory)
    const does_or_do = (!game_settings.plural.contains(subject) ? "does" : "do")
    const title_text = chosen === answer ?
                       `Correct! ${format_for_display(chosen, true)} ${does_or_do} not border ${format_for_display(territory, false)}!`
                     : `Sorry! ${format_for_display(territory, true)} ${does_or_do} border ${format_for_display(chosen, false)}!`
    const embedded_map_url = map_embed_url(quiz_mode, subject, url_parameters, false, on_mobile_device())
    const bottom_text = borders_sentence(subject, neighbors(subject))
    const next_button_text = (chosen === answer ? "Next" : "Try Again")
    const next_button_onclick = chosen === answer ? function() { score.correct += 1; display_question() }
                                                  : function() { score.wrong += 1; display_question(question) }
    const user_hint = (subject in game_settings.user_hint ? game_settings.user_hint[subject] : quiz_modes[quiz_mode].user_hint)
    display_map(title_text, embedded_map_url, bottom_text, next_button_text, next_button_onclick, user_hint)
}

/**
 * Returns the other quiz modes a player can choose as an HTML string.
 */
function other_quiz_modes_html() {
    var html  = `<span style="display:block;margin-bottom:15px;"/>`
    const other_quiz_modes = Object.keys(quiz_modes).filter(mode => !current_quiz_modes(url_parameters).contains(mode))
    if (other_quiz_modes.length > 0) {
        html += `<div style="font-family:Helvetica">
                        <p id='other-quiz-modes'>You can also try these quiz modes!</p>
                        <ul>`
            other_quiz_modes.forEach(function(mode) {
                const description = on_mobile_device() ? quiz_modes[mode].description.split("'")[0] : quiz_modes[mode].description
                html += `<li>
                            <a target='_self' href='?${mode}'>${quiz_modes[mode].anthem}</a>&nbsp;(${description}.)
                         </li>`})
            html += `</ul>
                 </div>`
    }
    return html
}

/**
 * Starts the game.
 */
function start_game() {
    const starting_quiz_mode = current_quiz_modes(url_parameters)[0]
    const starting_address = [url_parameters["start-map"], quiz_modes[starting_quiz_mode].starting_map]
                            .find(address => address !== undefined)
    if ("no-start-map" in url_parameters || starting_address === undefined || current_quiz_modes(url_parameters).length > 1 ||
        (("custom" in url_parameters || "start" in url_parameters) && !("start-map" in url_parameters))) {
        display_question()
    }
    else {
        try {
            display_start_map(starting_quiz_mode, starting_address)
        }
        catch(e) {
            display_question()
        }
    }
    $(game_container).after(other_quiz_modes_html())
}

// Exports
Object.assign(exports, {
    start_game: start_game
})