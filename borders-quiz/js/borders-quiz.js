var game_iframe = document.getElementById("game-container")
var game_css_path = "/borders-quiz/css/borders-quiz.css"
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var quiz_modes_settings_json_path = "/borders-quiz/json/quiz_modes.json"
var settings_json_path = "/borders-quiz/json/settings.json"

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

quiz_modes_settings_json = null
function quiz_modes_settings() {
    if (quiz_modes_settings_json == null) {
        $.ajax({ url: quiz_modes_settings_json_path, async: false, success: function (r) { quiz_modes_settings_json = r } })
    }
    return quiz_modes_settings_json
}

function current_quiz_modes() {
    var parameters =  URI(window.location.href).fragment(true)
    var current_quiz_modes_ = []
    for (var quiz_mode in quiz_modes_settings()) {
        if (parameters[quiz_mode]) {
            current_quiz_modes_.push(quiz_mode)
        }
    }
    if (current_quiz_modes_.length == 0) { // Default behavior when app visited.
        all_quiz_modes = Object.keys(quiz_modes_settings())
        return [all_quiz_modes[all_quiz_modes.length - 1]]
    }
    return current_quiz_modes_
}

function game_page_bottom_message() {
    var modes_json = quiz_modes_settings()
    var current_quiz_modes_ = current_quiz_modes()

    message  = "<p>You can also try these quiz modes!</p>"
    message += "<ul>"
    for (var quiz_mode in modes_json) {
        if (current_quiz_modes_.contains(quiz_mode)) {
            continue 
        }
        message += "<li>"
            message += "<a onclick='window.location.replace(this.href);window.location.reload()' href='#?" + quiz_mode + "=true'>"
                message += modes_json[quiz_mode].anthem
            message += "</a>&nbsp;"
            message += modes_json[quiz_mode].description
        message += "</li>"
    }
    message += "</ul>"
    
    return message
}

var borders_json = null
function borders() {
    if (borders_json == null) {
        $.ajax({ url: borders_json_path, async: false, success: function (r) { borders_json = r } })
    }
    return borders_json
}

function territories() {
    var territories_ = []
    var current_quiz_modes_ = current_quiz_modes()
    for (i = 0; i < current_quiz_modes_.length; i++) {
        territories_ = territories_.concat(Object.keys(borders()[current_quiz_modes_[i]]))
    }
    return territories_
}

function neighbors(territory) {
    var all_borders = borders()
    for (var country in all_borders) {
        if (all_borders[country][territory]) {
            return all_borders[country][territory].slice() // slice() makes a copy of the array so we don't mess with the original.
        }
    }
    return []
}

function quiz_mode_of(territory) {
    var all_borders = borders()
    for (var quiz_mode in all_borders) {
        if (all_borders[quiz_mode][territory]) {
            return quiz_mode
        }
    }
    return "countries"
}

var settings_json = null
function settings() {
    if (settings_json == null) {
        $.ajax({ url: settings_json_path, async: false, success: function (r) { settings_json = r } })
    }
    return settings_json
}

function google_maps_zoom_level(territory) {
    var custom_zoom_levels = settings().custom_zoom_levels
    if (custom_zoom_levels[territory] != null) {
        return custom_zoom_levels[territory]
    }
    return quiz_modes_settings()[quiz_mode_of(territory)].default_zoom_level
}

function geocode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: {"key": google_maps_api_key, "address": address}, async: false, success: function (r) { json = r }})
    return json
}

function coordinates(address) {
    var tweaked_addresses = settings().tweaked_addresses

    if (tweaked_addresses[address] != null) {
        address = tweaked_addresses[address]
    }
    else {
        address += quiz_modes_settings()[quiz_mode_of(address)].geocode_append
    }

    return geocode(address).results[0].geometry.location
}

// Taken from http://web.archive.org/web/20120326084113/http://www.merlyn.demon.co.uk/js-shufl.htm
Array.prototype.swap = function(j, k) {
  var t = this[j] ; this[j] = this[k] ; this[k] = t
}
function random(x) {
  return Math.floor(x*(Math.random()%1)) 
}
function shuffle(a) {
    for (var j=a.length-1; j>0; j--) { 
        a.swap(j, random(j+1)) 
    }
    return a
}
function sample(a, k) {
    for (var j=0; j < a.length; j++) {
        a.swap(j, random(a.length))
    }
    return a.slice(0,k)
}
function choice(a) {
    return a[random(a.length)]
}
////

// This is an optional method for pruning the breadth-first search.
// Performance improvement is minimal, but it really does a good job of removing obvious answers.
function remove_neighbors_of_neighbor_from_bfs(territory, neighbor) {

    // Brazil borders all but two countries in South America, so to give tighter answer choices,
    // we exclude its neighbors from graph searches. Similar rationale for other members.
    remove_paths_through = [ "Brazil", "Canada_", "China", "China_", "Egypt", "Germany", "Iran", "Italy",
                             "Morocco", "Russia", "Spain", "Turkey", "United States (Continental)"]

    // But some territories only border that one territory, so we need to keep those paths in the loop,
    // or the game will break.
    unless_started_from = ["Alaska", "Denmark", "Portugal", "San Marino", "Vatican City"]

    return (remove_paths_through.contains(neighbor) && !unless_started_from.contains(territory))
}

function breadth_first_search(territory, depth) {
    var territory_distance_dict = { [territory]: 0 }
    var bfs_queue = [territory]
    while (bfs_queue.length > 0) {
        var v = bfs_queue.shift()
        var neighbors_ = neighbors(v)
        for (var i = 0; i < neighbors_.length; i++) {
            var neighbor = neighbors_[i]
            if (territory_distance_dict[neighbor] == null) {
                territory_distance_dict[neighbor] = territory_distance_dict[v] + 1
                if (territory_distance_dict[neighbor] > depth) {
                    return territory_distance_dict // Terminate BFS at given depth.
                }
                if (!remove_neighbors_of_neighbor_from_bfs(territory, neighbor)) {
                    bfs_queue.push(neighbor)
                }
            }
        }
    }
    return territory_distance_dict
}

function build_question(territory) {
    var num_wrong_answers = 3
    var wrong_answers = sample(neighbors(territory), num_wrong_answers)
    var answer_distance = 2
    var territory_distance_dict = breadth_first_search(territory, answer_distance)
    var possible_answers = []
    for (var t in territory_distance_dict) {
        if (territory_distance_dict[t] == answer_distance) {
            possible_answers.push(t)
        }
    }

    var add_possible_answers = settings().add_possible_answers
    var replace_possible_answers = settings().replace_possible_answers
    
    if (add_possible_answers[territory]) {
        possible_answers = possible_answers.concat(add_possible_answers[territory])
    }
    else if (replace_possible_answers[territory]) {
        possible_answers = replace_possible_answers[territory]
    }

    var answer = choice(possible_answers)
    return { territory: territory, answer: answer, wrong_answers: wrong_answers, chosen: "" }
}

function prepend_the(territory, capitalize_the=false) {
    var the = (capitalize_the ? "The " : "the ")
    var should_prepend_the = settings().should_prepend_the
    return (should_prepend_the.contains(territory) ? the : "")
}

function truncate_for_mobile(territory) {
    if (on_mobile_device()) {
        var abbreviations = settings().abbreviations_for_mobile
        return (abbreviations[territory] != null ? abbreviations[territory] : territory)
    }
    return territory
}

function pretty_print(territory, capitalize_the) {
    var the = prepend_the(territory, capitalize_the)
    territory = truncate_for_mobile(territory)
    territory = territory.replace(/_/g,'').replace(/\s/g,'&nbsp;').replace(/-/g, '&#8209;')
    return (the + territory)
}

// Only for testing.
function test_map(t) {
    embed_map(build_question(t), {correct:0,wrong:0}, Date.now())
}
function test_question(t) {
    test_map(t)
    function next_question_button() {
        var next_button = game_iframe.contentWindow.document.getElementById("next")
        if (!next_button) {
            window.requestAnimationFrame(next_question_button);
        }
        next_button.click()
    }
    next_question_button()
}
function test_remove_neighbors_of_neighbor_from_bfs() {
    console.log(remove_neighbors_of_neighbor_from_bfs("Alaska", "Canada_") == false)
    console.log(remove_neighbors_of_neighbor_from_bfs("Guyana", "Brazil") == true)
    console.log(remove_neighbors_of_neighbor_from_bfs("Germany", "Italy") == true)
}
// Above code can be freely removed.

// Timer code.
var timer_process_id = null
function format_time(raw_date) {
    function prepend_zero(time) {
        return (time < 10 ? "0" + time : time)
    }
    var total_seconds = Math.round(raw_date/1000)
    var hours = prepend_zero(Math.floor(total_seconds/60/60))
    var minutes = prepend_zero(Math.floor((total_seconds/60) % 60))
    var seconds = prepend_zero(Math.floor(total_seconds % 60))
    var time = minutes + ":" + seconds
    return (hours > 0 ? hours + ":" + time : time)
}
function update_dom_time(start_time, timer_dom_node) {
    var time_elapsed = format_time(Date.now() - start_time)
    if (timer_dom_node != null) {
        timer_dom_node.innerHTML = time_elapsed
    }
}
function start_timer(start_time, timer_dom_node) {
    if (timer_process_id != null) {
        clearInterval(timer_process_id)
    }
    timer_process_id = setInterval(function() { update_dom_time(start_time, timer_dom_node) }, 1000)
    return start_time
}
////

function on_mobile_device() {
    return $(document).width() <= 760
}

function embed(src) {     
    game_iframe.srcdoc ="<head><link rel='stylesheet' href='" + game_css_path + "'/></head><body>" + src + "</body>"
}

function bottom_message(territory) {

    var dont_sort_neighbors = settings().dont_sort_neighbors

    var a = neighbors(territory)
    if (!dont_sort_neighbors.contains(territory)) {
        a.sort()
    }

    for (i = 0; i < a.length; i++) {
        a[i] = pretty_print(a[i])
    }

    var s = ""
    if (a.length == 0) {
        s = "nothing!"
    }
    else if (a.length == 1) {
        s = "only " + a[0] + "."
    }
    else if (a.length == 2) {
        s = a[0] + " and " + a[1] + "."
    }
    else {
        for (i = 0; i < a.length - 1; i++) {
            s += (a[i] + ", ")
        }
        s += "and " + a[a.length - 1] + "."
    }

    return (pretty_print(territory, true) + " borders " + s)
}

function bottom_right_message_map(territory) {
    return "<p id='click-the-states-message'>" + quiz_modes_settings()[quiz_mode_of(territory)].click_message + "</p>"
}

function top_message(question_info) {
    if (question_info.chosen == question_info.answer) {
        return ("Correct! " + pretty_print(question_info.chosen, true) + " does not border " + pretty_print(question_info.territory) + "!")
    }
    else {
        return ("Sorry! " + pretty_print(question_info.territory, true) + " does border " + pretty_print(question_info.chosen) + "!")
    }
}

function embed_map(question_info, score, start_time) {
    var territory = (question_info.chosen == question_info.answer ? question_info.chosen : question_info.territory)
    var url = quiz_modes_settings()[quiz_mode_of(territory)].map_embed_base_url
    var coordinates_ = coordinates(territory)
    var zoom_level = google_maps_zoom_level(territory)
    url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom_level }).toString()

    var map = "<iframe id='" + (on_mobile_device() ? "map-mobile" : "map") + "' scrolling='no' frameborder=0 src='" + url + "'></iframe>"

    content = "<div id='" + (on_mobile_device() ? "map-container-mobile" : "map-container") + "'>"
        content += "<center>"
            content += "<p>" + top_message(question_info) + "</p>"
            content += map
            content += "<p>" + bottom_message(territory) + "</p>"
            content += "<button id='next'></button>"
            if (!on_mobile_device()) {
                content += bottom_right_message_map(territory)
            }
        content += "</center>"
    content += "</div>"

    embed(content)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function next_question_button() {
        var next_button = game_iframe.contentWindow.document.getElementById("next")
        if (next_button == null) {
            window.requestAnimationFrame(next_question_button);
        }
        else {
            if (question_info.chosen == question_info.answer) {
                score.correct += 1
                next_button.innerHTML = "Next"
                next_button.onclick = function() { next_question(null, score, start_time) }
            }
            else {
                score.wrong += 1
                next_button.innerHTML = "Try Again"
                next_button.onclick = function() { next_question(question_info, score, start_time) }
            }
        }
    }
    next_question_button()
}

function bottom_right_message(score, start_time) {
    question = "" 
    question += "<p id='score_and_timer'>"
        question += "<i id='score'>"
            question += "Correct: " + score.correct + "&nbsp;&nbsp;"
            question += "Wrong: " + score.wrong
        question += "</i><br>"
        question += "<span id='timer'>" + format_time(Date.now() - start_time) + "</span>"
    question += "</p>"
    return question 
}

function embed_question(question_info, score, start_time) {
    var choices = shuffle(question_info.wrong_answers.concat(question_info.answer))
    var question_container_id = on_mobile_device() ? "question-container-mobile" : "question-container"
    question  = "<div id='" + question_container_id + "'>"
        question += "<div id='quiz_title'>" + truncate_for_mobile(quiz_modes_settings()[quiz_mode_of(question_info.territory)].title) + "</div>"
        question += "<div id='" + (on_mobile_device() ? "question-text-mobile" : "question-text") + "'>"
            question += "<p>Which of these does not border " + pretty_print(question_info.territory) + "?</p>"
            question += "<form>"
                for (i = 0; i < choices.length; i++) {
                    var choice = choices[i]
                    var letter = "&emsp;" + String.fromCharCode(i + 65) + ". "
                    // Do not remove the escaped double-quotes or game will break on territories like "Cote d'Ivoire".
                    question += "<input type='radio' id=\"" + choice + "\" value=\"" + choice + "\" name='choice'>"
                    question += "<label for=\"" + choice + "\">" + letter + pretty_print(choice, true) + "</label><br>"
                }
            question += "</form>"
        question += "</div>"
        question += bottom_right_message(score, start_time)
    question += "</div>"

    embed(question)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function begin_timing() {
        var timer_dom_node = game_iframe.contentWindow.document.getElementById("timer")
        if (timer_dom_node == null) {
            window.requestAnimationFrame(begin_timing);
        }
        else {
            start_timer(start_time, timer_dom_node)
        }
    }
    begin_timing()

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function detect_player_choice() {
        var choices = game_iframe.contentWindow.document.getElementsByName("choice")
        if (choices[0] == null) {
            window.requestAnimationFrame(detect_player_choice);
        }
        else {
            for (i = 0; i < choices.length; i++) {
                choices[i].onclick = function() {
                    question_info.chosen = this.id
                    embed_map(question_info, score, start_time)
                }
            }
        }
    }
    detect_player_choice()
}

function random_territory() {
    var territories_ = territories()
    var territory = choice(territories_)
    while (neighbors(territory).length == 0) { // To avoid grabbing an island.
        territory = choice(territories_)
    }
    return territory
}

// A sample question_info object is
// { territory: "United States", answer: "Guatemala", wrong_answers: ["Mexico", "Canada"], chosen:""}
function next_question(question_info=null, score={correct:0,wrong:0}, start_time=Date.now()) {
    if (question_info == null) {
        question_info = build_question(random_territory())
    }
    embed_question(question_info, score, start_time)
}