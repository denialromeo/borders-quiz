var game_iframe = document.getElementById("game-container")
var game_css_path = "/borders-quiz/css/borders-quiz.css"
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var google_maps_zoom_levels_json_path = "/borders-quiz/json/google_maps_zoom_levels.json"
var quiz_modes_json_path = "/borders-quiz/json/quiz_modes.json"

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
            message += "<a onclick='window.location.href=this.href;window.location.reload()' href='#?"
            message += mode
            message += "=true'>"
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
            return borders_json[dict][territory]
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

function coordinates(address) {

    // To give the best view of the borders we want to show on the embedded map.
    tweaked_addresses = {
        "Afghanistan_": "FATA Pakistan",
        "Arizona_": "Arizona USA",
        "California_": "California State",
        "China_": "Nepal",
        "China__": "Gilgit-Baltistan",
        "China___": "Mongolia",
        "France_": "Burgen Germany",
        "Georgia": "Georgia Country",
        "Georgia__": "Georgia Country",
        "India": "Nepal",
        "India_": "Dharakh India",
        "India__": "Gomo Co Tibet",
        "Iran_": "Sefidabeh",
        "Italy": "San Marino",
        "Maldives": "Addu City",
        "Mexico__": "Baja California",
        "New Mexico_": "New Mexico State",
        "North Korea_": "Cheorwon South Korea",
        "Pacific Ocean": "Cooperstown California",
        "Punjab_": "Punjab Pakistan",
        "Russia_": "Ulan Bator",
        "Scotland": "Dumfries Scotland",
        "Texas_": "Texas State",
        "Washington": "Washington State"
    }
    
    if (tweaked_addresses[address]) {
        address = tweaked_addresses[address]
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
    // we exclude it from graph searches.
    remove_paths_through = [ "Brazil", "Canada_", "China", "China_", "Germany", "Italy", "Mexico_",
                             "Morocco", "Russia", "Spain", "Turkey", "United States (Continental)"]

    // But some territories only border that one territory, so we need to keep those paths in the loop.
    unless_started_from = { "Canada_": ["Alaska"],
                            "Germany": ["Denmark"],
                            "Italy": ["Vatican City", "San Marino"],
                            "Spain": ["Portugal"]
                          }

    if (remove_paths_through.contains(neighbor)) {
        if (unless_started_from[neighbor]) {
            return !unless_started_from[neighbor].contains(territory)
        }
        return true
    }
    
    return false
}

function breadth_first_search(territory, depth) {
    var territory_distance_dict = { [territory]:0 }
    var bfs_queue = [territory]
    while (bfs_queue.length > 0) {
        var v = bfs_queue.shift()
        var neighbors_ = neighbors(v)
        for (var i = 0; i < neighbors_.length; i++) {
            var neighbor = neighbors_[i]
            if (territory_distance_dict[neighbor] == null) {
                territory_distance_dict[neighbor] = territory_distance_dict[v] + 1
                if (territory_distance_dict[neighbor] == depth + 1) {
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

// Constraint: Input must have at least one bordering territory and one two territories away.
// If input has no territories two away, add entry to replace_possible_answers or game will break.
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
    
    // Note that all of the added territories are islands.
    var add_possible_answers = {
        "Bangladesh": ["Maldives", "Sri Lanka"],
        "Cameroon": ["São Tomé and Principe"],
        "China": ["Taiwan"],
        "Equatorial Guinea": ["São Tomé and Principe"],
        "Gabon": ["São Tomé and Principe"],
        "Guinea": ["Cape Verde"],
        "Guinea-Bissau": ["Cape Verde"],
        "India": ["Maldives", "Sri Lanka"],
        "Indonesia": ["Australia", "Fiji", "New Zealand", "Singapore"],
        "Israel": ["Cyprus"],
        "Italy": ["Malta"],
        "Lebanon": ["Cyprus"],
        "Libya": ["Malta"],
        "Malaysia": ["Philippines", "Singapore"],
        "Mauritania": ["Cape Verde"],
        "Mozambique": ["Comoros", "Madagascar", "Mauritius", "Seychelles"],
        "New Brunswick": ["Prince Edward Island"],
        "New South Wales": ["Tasmania"],
        "Nigeria": ["São Tomé and Principe"],
        "Nova Scotia": ["Prince Edward Island"],
        "Qatar": ["Bahrain"],
        "Saudi Arabia": ["Bahrain"],
        "Senegal": ["Cape Verde"],
        "South Australia": ["Tasmania"],
        "Syria": ["Cyprus"],
        "Tanzania": ["Comoros", "Madagascar", "Mauritius", "Seychelles"],
        "The Gambia": ["Cape Verde"],
        "Tunisia": ["Malta"],
        "Turkey": ["Cyprus"],
        "United Arab Emirates": ["Bahrain"],
        "Venezuela": ["Trinidad and Tobago"],
        "Victoria": ["Tasmania"],
        "Vietnam": ["Philippines"]
    }

    var replace_possible_answers = {
        "Canada": ["Greenland"],
        "Dominican Republic": ["Cuba", "Jamaica"], // If removed, game will break.
        "Ehime": ["Hokkaido", "Okinawa"], // If removed, game will break.
        "Finland": ["Denmark", "Greenland", "Iceland"],
        "Haiti": ["Cuba", "Jamaica"], // If removed, game will break.
        "Ireland": ["Belgium", "France", "Netherlands"], // If removed, game will break.
        "Mongolia": ["Kazakhstan"],
        "North Korea": ["Japan"],
        "Norway": ["Denmark", "Greenland", "Iceland"],
        "San Marino": ["Vatican City"],
        "South Korea": ["Japan"],
        "Sweden": ["Denmark", "Greenland", "Iceland"],
        "Tokushima": ["Hokkaido", "Okinawa"], // If removed, game will break.
        "United Kingdom": ["Belgium", "France", "Netherlands"], // If removed, game will break.
        "Vatican City": ["San Marino"]
    }

    if (add_possible_answers[territory]) {
        possible_answers = possible_answers.concat(add_possible_answers[territory])
    }
    else if (replace_possible_answers[territory]) {
        possible_answers = replace_possible_answers[territory]
    }

    var answer = choice(possible_answers)
    return {territory: territory, answer: answer, wrong_answers: wrong_answers, chosen:""}
}

function prepend_the(territory, capitalize_the=false) {
    var the = (capitalize_the ? "The " : "the ")
    var should_prepend_the = [ "Australian Capital Territory",
                               "Baltic Sea",
                               "Black Sea",
                               "Caspian Sea",
                               "Central African Republic",
                               "Democratic Republic of the Congo",
                               "Dominican Republic",
                               "Federally Administered Tribal Areas",
                               "Islamabad Capital Territory",
                               "Maldives",
                               "Mediterranean Sea",
                               "Mississippi River",
                               "Netherlands",
                               "Netherlands_",
                               "Northern Territory",
                               "Northwest Territories",
                               "Pacific Ocean",
                               "Persian Gulf",
                               "Philippines",
                               "Red Sea",
                               "Republic of the Congo",
                               "Seychelles",
                               "State of Mexico",
                               "United Arab Emirates",
                               "United Kingdom",
                               "United States (Continental)",
                               "United States",
                               "Western Sahara",
                               "Yukon Territory" ]
    return ((should_prepend_the.contains(territory) ? the : "") + territory)
}

function truncate_for_mobile(territory) {
    if (on_mobile_device()) {
        abbreviations = {
            "Australian Capital Territory": "ACT",
            "Azad Jammu and Kashmir": "AJK",
            "Bosnia and Herzegovina": "Bosnia",
            "Central African Republic": "CAR",
            "Democratic Republic of the Congo": "DRC",
            "Dominican Republic": "Dominican Rep.",
            "Federally Administered Tribal Areas": "FATA",
            "Islamabad Capital Territory": "ICT",
            "Khyber Pakhtunkhwa": "KP",
            "Mediterranean Sea": "Mediterranean",
            "Neimongol (Inner Mongolia)": "Neimongol",
            "Newfoundland and Labrador": "NL",
            "Northern Territory": "NT",
            "Northwest Territories": "NW Territories",
            "Papua New Guinea": "New Guinea",
            "Republic of the Congo": "ROC",
            "São Tomé and Principe": "São Tomé",
            "United Arab Emirates": "UAE",
            "United Kingdom": "UK",
            "United States (Continental)": "USA Mainland",
            "Western Sahara": "W. Sahara"
        }
        return (abbreviations[territory] ? abbreviations[territory] : territory)
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
    embed_map(build_question(t), {correct:0,wrong:0})
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
// Above code can be freely removed.

// Timer code.
var timer_process_id = 0
var timer_id = "timer"
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
function timer(start_time) {
    var time_elapsed = format_time(Date.now() - start_time)
    var timer_span = game_iframe.contentWindow.document.getElementById(timer_id)
    if (timer_span) {
        timer_span.innerHTML = time_elapsed
    }
}
function start_timer(start_time=Date.now()) {
    clearInterval(timer_process_id)
    timer_process_id = setInterval(function() { timer(start_time) }, 1000)
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

    var a = neighbors(territory).slice().sort()
    for (i = 0; i < a.length; i++) {
        a[i] = pretty_print(a[i], false)
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

function embed_map(question_info, score, start_time) {
    question_info.chosen = question_info.chosen.replace(/\'/g,'&#39;')
    question_info.answer = question_info.answer.replace(/\'/g,'&#39;')
    var territory = (question_info.chosen == question_info.answer ? question_info.chosen : question_info.territory)

    var url = quiz_modes_metadata()[quiz_mode_of(territory)].map_embed_base_url
    var coordinates_ = coordinates(territory)
    var zoom = google_maps_zoom_level(territory)
    url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()

    var map_id = on_mobile_device() ? "map-mobile" : "map"
    var map = "<iframe id='" + map_id + "' scrolling='no' frameborder=0 src='" + url + "'></iframe>"

    function top_message() {
        var success = question_info.chosen == question_info.answer
        if (success) {
            return ("Correct! " + pretty_print(question_info.chosen, true) + " does not border " + pretty_print(question_info.territory) + "!")
        }
        else {
            return ("Sorry! " + pretty_print(question_info.territory, true) + " does border " + pretty_print(question_info.chosen) + "!")
        }
    }

    function bottom_right_message_map(territory) {
        var message = "" 
        message += "<p id='click-the-states-message'>"
        message += quiz_modes_metadata()[quiz_mode_of(territory)].click_message
        message += "</p>"
        return message 
    }

    content  = "<div id='"
    content += (on_mobile_device() ? "map-container-mobile" : "map-container")
    content += "'>"
    content += "<center>"
    content += "<p>"
    content += top_message()
    content += "</p>"
    content += map
    content += "<p>"
    content += bottom_message(territory)
    content += "</p>"
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
        if (!next_button) {
            window.requestAnimationFrame(next_question_button);
        }
        else {
            if (question_info.chosen == question_info.answer) {
                score.correct += 1
                next_button.onclick = function() { return next_question(null, score, start_time) }
                next_button.innerHTML = "Next"
            }
            else {
                score.wrong += 1
                next_button.onclick = function() { return next_question(question_info, score, start_time) }
                next_button.innerHTML = "Try Again"
            }
        }
    }
    next_question_button()
}

function bottom_right_message(score, start_time) {
    question = "" 
    question += "<p id='score_and_timer'>"
        question += "<i id='score'>"
            question += "Correct: "
            question += score.correct
            question += "&nbsp;&nbsp;Wrong: "
            question += score.wrong
        question += "</i><br>"
        question += "<span id='timer'>"
            question += format_time(Date.now() - start_time)
        question += "</span>"
    question += "</p>"
    function time() {
        var timer_node = game_iframe.contentWindow.document.getElementById("timer")
        if (!timer_node) {
            window.requestAnimationFrame(time);
        }
        else {
            start_timer(start_time)
        }
    }
    time()
    return question 
}

function embed_question(question_info, score, start_time) {
    var choices = shuffle(question_info.wrong_answers.concat(question_info.answer))
    var question_container_id = on_mobile_device() ? "question-container-mobile" : "question-container"
    question  = "<div id='" + question_container_id + "'>"
        question += "<div id='quiz_title'>"
            question += quiz_modes_metadata()[quiz_mode_of(question_info.territory)].title
        question += "</div>"
        question += "<div id='"
        question += (on_mobile_device() ? "question-text-mobile" : "question-text")
        question += "'>"
            question += "<p>Which of these does not border "
            question += pretty_print(question_info.territory, false)
            question += "?</p>"
            question += "<form>"
                for (i = 0; i < choices.length; i++) {
                    var choice = choices[i]
                    var letter = String.fromCharCode(i + 65)
                    question += "<input type='radio' id='"
                    question += choice
                    question += "' value='"
                    question += choice
                    question += "' name='choice'><label for='"
                    question += choice
                    question += "'>&emsp;"
                    question += letter
                    question += ". "
                    question += pretty_print(choice, true)
                    question += "</label><br>"
                }
            question += "</form>"
        question += "</div>"
        question += bottom_right_message(score, start_time)
    question += "</div>"

    embed(question)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function detect_player_choice() {
        var choices = game_iframe.contentWindow.document.getElementsByName("choice")
        if (!choices[0]) {
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