var game_iframe = document.getElementById("game-container")
var game_css_path = "/borders-quiz/css/borders-quiz.css"
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var google_maps_zoom_levels_json_path = "/borders-quiz/json/google_maps_zoom_levels.json"
var quiz_modes_json_path = "/borders-quiz/json/quiz_modes.json"
var quiz_settings_path = "/borders-quiz/json/settings.json"

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

quiz_modes_metadata_json = null
function quiz_modes_metadata() {
    if (!quiz_modes_metadata_json) {
        $.ajax({ url: quiz_modes_json_path, async: false, success: function (r) { quiz_modes_metadata_json = r } })
    }
    return quiz_modes_metadata_json
}

function parse_url() {
    var fields =  URI(window.location.href).fragment(true)
    var modes = []
    for (var mode in quiz_modes_metadata()) {
        if (fields[mode]) {
            modes.push(mode)
        }
    }
    if (modes.length == 0) { // Default behavior when app visited.
        all_modes = Object.keys(quiz_modes_metadata())
        return all_modes.slice(all_modes.length - 1, all_modes.length) // Last entry in quiz_modes.json.
    }
    return modes
}

function game_page_bottom_message() {
    var modes_json = quiz_modes_metadata()
    var fields = parse_url()

    message  = "<p>You can also try these quiz modes!</p>"
    message += "<ul>"
    for (var mode in modes_json) {
        if (fields.contains(mode)) {
            continue 
        }
        message += "<li>"
            message += "<a onclick='window.location.replace(this.href);window.location.reload()' href='#?" + mode + "=true'>"
                message += modes_json[mode].anthem
            message += "</a>&nbsp;"
            message += modes_json[mode].description
        message += "</li>"
    }
    message += "</ul>"
    
    return message
}

var borders_json = null
function territories() {
    if (!borders_json) {
        $.ajax({ url: borders_json_path, async: false, success: function (r) { borders_json = r } })
    }
    var territories_ = []
    var modes = parse_url()
    for (i = 0; i < modes.length; i++) {
        territories_ = territories_.concat(Object.keys(borders_json[modes[i]]))
    }
    return territories_
}

function neighbors(territory) {
    if (!borders_json) {
        $.ajax({ url: borders_json_path, async: false, success: function (r) { borders_json = r } })
    }
    for (var dict in borders_json) {
        if (borders_json[dict][territory]) {
            return borders_json[dict][territory].slice() // slice() makes a copy of the array so we don't mess with the original.
        }
    }
    return []
}

function quiz_mode_of(territory) {
    if (!borders_json) {
        $.ajax({ url: borders_json_path, async: false, success: function (r) { borders_json = r } })
    }
    for (var dict in borders_json) {
        if (borders_json[dict][territory]) {
            return dict
        }
    }

    return "countries"
}

var google_maps_zoom_levels_json = null
function google_maps_zoom_level(territory) {
    if (!google_maps_zoom_levels_json) {
        $.ajax({ url: google_maps_zoom_levels_json_path, async: false, success: function (r) { google_maps_zoom_levels_json = r } })
    }
    if (google_maps_zoom_levels_json[territory]) {
        return google_maps_zoom_levels_json[territory]
    }

    return quiz_modes_metadata()[quiz_mode_of(territory)].default_zoom_level
}

function geocode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: {"key": google_maps_api_key, "address": address}, async: false, success: function (r) { json = r }})
    return json
}

var tweaked_addresses_json = null
function coordinates(address) {
    if (!tweaked_addresses_json) {
        $.ajax({ url: quiz_settings_path, async: false, success: function (r) { tweaked_addresses_json = r.tweaked_addresses } })
    }

    if (tweaked_addresses_json[address] != null) {
        address = tweaked_addresses_json[address]
    }
    else {
        address += quiz_modes_metadata()[quiz_mode_of(address)].geocode_append
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
function shuffle(l) {
    for (var j=l.length-1; j>0; j--) { 
        l.swap(j, random(j+1)) 
    }
    return l
}
function sample(l, k) {
    for (var j=0; j < l.length; j++) {
        l.swap(j, random(l.length))
    }
    return l.slice(0,k)
}
function choice(l) {
    return l[random(l.length)]
}
////

function remove_neighbors_of_neighbor_from_bfs(territory, neighbor) {

    // Brazil borders all but two countries in South America, so to give tighter answer choices,
    // we exclude its neighbors from graph searches.
    remove_paths_through = [ "Brazil", "Canada_", "China", "China_", "Germany", "Italy", "Mexico_",
                             "Morocco", "Russia", "Spain", "Turkey", "United States (Continental)"]

    // But some territories only border that one territory, so we need to keep those paths in the loop,
    // or the game will break.
    unless_started_from = ["Alaska", "Denmark", "Portugal", "San Marino", "Vatican City"]

    if (remove_paths_through.contains(neighbor) && !unless_started_from.contains(territory)) {
        return true
    }
    
    return false
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

var add_possible_answers = null
var replace_possible_answers = null
function build_question(territory) {
    var num_wrong_answers = 3
    var wrong_answers = sample(neighbors(territory), num_wrong_answers)
    var possible_answers = []
    var bfs_depth = 2
    var territory_distance_dict = breadth_first_search(territory, bfs_depth)
    for (var t in territory_distance_dict) {
        if (territory_distance_dict[t] == bfs_depth) {
            possible_answers.push(t)
        }
    }
    
    if (add_possible_answers == null) {
        $.ajax({ url: quiz_settings_path, async: false, success: function (r) { add_possible_answers = r.add_possible_answers } })
    }
    if (replace_possible_answers == null) {
        $.ajax({ url: quiz_settings_path, async: false, success: function (r) { replace_possible_answers = r.replace_possible_answers } })
    }

    if (add_possible_answers[territory]) {
        possible_answers = possible_answers.concat(add_possible_answers[territory])
    }
    else if (replace_possible_answers[territory]) {
        possible_answers = replace_possible_answers[territory]
    }

    var answer = choice(possible_answers)
    return { territory: territory, answer: answer, wrong_answers: wrong_answers, chosen:"" }
}

var should_prepend_the = null
function prepend_the(territory, capitalize_the=false) {
    var the = (capitalize_the ? "The " : "the ")
    if (should_prepend_the == null) {
        $.ajax({ url: quiz_settings_path, async: false, success: function (r) { should_prepend_the = r.should_prepend_the } })
    }
    return ((should_prepend_the.contains(territory) ? the : "") + territory)
}

var abbreviations_json = null
function truncate_for_mobile(territory) {
    if (on_mobile_device()) {
        if (!abbreviations_json) {
            $.ajax({ url: quiz_settings_path, async: false, success: function (r) { abbreviations_json = r.abbreviations_for_mobile } })
        }
        return (abbreviations_json[territory] != null ? abbreviations_json[territory] : territory)
    }
    return territory
}

function pretty_print(territory, capitalize_the) {
    territory = truncate_for_mobile(territory)
    territory = prepend_the(territory, capitalize_the)
    territory = territory.replace(/_/g,'').replace(/\s/g,'&nbsp;').replace(/-/g, '&#8209;')
    return territory
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
var timer_process_id = 0
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
    if (timer_dom_node) {
        timer_dom_node.innerHTML = time_elapsed
    }
}
function start_timer(start_time, timer_dom_node) {
    clearInterval(timer_process_id)
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

var dont_sort_neighbors_json = null
function bottom_message(territory) {

    if (dont_sort_neighbors_json == null) {
        $.ajax({ url: quiz_settings_path, async: false, success: function (r) { dont_sort_neighbors_json = r.dont_sort_neighbors } })
    }

    var a = neighbors(territory)
    if (!dont_sort_neighbors_json.contains(territory)) {
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
    return "<p id='click-the-states-message'>" + quiz_modes_metadata()[quiz_mode_of(territory)].click_message + "</p>"
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
    var url = quiz_modes_metadata()[quiz_mode_of(territory)].map_embed_base_url
    var coordinates_ = coordinates(territory)
    var zoom = google_maps_zoom_level(territory)
    url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()

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
        question += "<div id='quiz_title'>" + truncate_for_mobile(quiz_modes_metadata()[quiz_mode_of(question_info.territory)].title) + "</div>"
        question += "<div id='" + (on_mobile_device() ? "question-text-mobile" : "question-text") + "'>"
            question += "<p>Which of these does not border " + pretty_print(question_info.territory) + "?</p>"
            question += "<form>"
                for (i = 0; i < choices.length; i++) {
                    var choice = choices[i]
                    var letter = String.fromCharCode(i + 65)
                    // Do not remove the escaped double-quotes or game will break on territories like "Cote d'Ivoire".
                    question += "<input type='radio' id=\"" + choice + "\" value=\"" + choice + "\" name='choice'>"
                    question += "<label for=\"" + choice + "\">&emsp;" + letter + ". " + pretty_print(choice, true) + "</label><br>"
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
    var territory = choice(territories())
    while (neighbors(territory).length == 0) { // To avoid grabbing an island.
        territory = choice(territories())
    }
    return territory
}

// A sample question_info object is
// { territory: "United States", answer: "Guatemala", wrong_answers: ["Mexico", "Canada"], chosen:""}
function next_question(question_info, score, start_time) {
    if (!question_info) {
        question_info = build_question(random_territory())
    }
    embed_question(question_info, score, start_time)
}