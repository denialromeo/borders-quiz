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

function load_url(newLocation) {
    window.location.href = newLocation
    window.location.reload()
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
            message += "<a onclick='load_url(this.href)' href='#?"
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

function dict_name(territory) {
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

    return quiz_modes_metadata()[dict_name(territory)].default_zoom_level
}

function geocode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: {"key": google_maps_api_key, "address": address}, async: false, success: function (r) { json = r }})
    return json
}

function coordinates(address) {

    address += quiz_modes_metadata()[dict_name(address)].geocode_append

    // To give the best view of the borders we want to show on the embedded map.
    tweaked_addresses = {
        'Afghanistan_': 'FATA Pakistan',
        'China_': 'Nepal',
        'China__': 'Gilgit-Baltistan',
        'Georgia': 'Georgia Country',
        'Georgia__': 'Georgia Country',
        'India': 'Nepal',
        'India_': 'Dharakh India',
        'India__': 'Gomo Co Tibet',
        'Iran_': 'Sefidabeh',
        'Italy': 'San Marino',
        'Mexico__': "Baja California",
        'North Korea_': 'Cheorwon South Korea',
        'Pacific Ocean': "Cooperstown California",
        'Punjab_': 'Punjab Pakistan',
        'Russia_': 'Ulan Bator',
        'Washington': 'Washington State'
    }
    
    if (tweaked_addresses[address]) {
        address = tweaked_addresses[address]
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
    // China and Russia make the "graph distance" answer mechanic a little pointless.
    // If India and Poland are just three countries apart (India → China → Russia → Poland),
    // a question asking if they border each other is a bit too easy.
    if (['China', 'Russia'].contains(neighbor)) {
        return true
    }
    // China as bordering India poses the same problem.
    if (neighbor == 'China_') {
        return true
    }
    // East and West Europe are a bit too easy to discern between. So we block all roads through Germany and Italy.
    if (['Germany', 'Italy'].contains(neighbor)) {
        if (!['Denmark', 'Vatican City', 'San Marino'].contains(territory)) {
            return true
        }
    }
    // Morocco borders Spain through Ceuta. Algeria pretty obviously doesn't border Spain.
    if (neighbor == 'Morocco') {
        return true
    }
    if (neighbor == 'Spain') {
        if (!['Portugal'].contains(territory)) {
            return true
        }
    }
    // Turkey similarly borders a few obviously different regions, so let's block roads through it.
    if (neighbor == 'Turkey') {
        return true
    }
    // Likewise for Canada and Mexico when called from a U.S. state. Washington and Maine both border Canada,
    // but are on opposite sides of the country.
    if (['Canada_', 'Mexico_'].contains(neighbor)) {
        if (territory != 'Alaska') {
            return true
        }
    }
    // Likewise for the U.S. when called from Canada. Alberta and New Brunswick are on opposite sides of the country.
    if (neighbor == 'United States (Continental)') {
        return true
    }
    // Brazil borders every country in South America except Ecuador and Chile!
    if (neighbor == 'Brazil') {
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
// If not, must add case to this function or game will break.
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
    // These are needed because otherwise there'd be no possible answers and we'd hit a game-breaking bug.
    //
    // This is also our only chance to include island countries, which we can't put in borders.json.
    if (['United Kingdom', 'Ireland'].contains(territory)) {
        possible_answers = ['France', 'Netherlands', 'Belgium']
    }
    else if (['Dominican Republic', 'Haiti'].contains(territory)) {
        possible_answers = ['Cuba', 'Jamaica']
    }
    else if (['Ehime', 'Tokushima'].contains(territory)) {
        possible_answers = ['Okinawa', 'Hokkaido']
    }
    // These are just to play with the player by giving them less obvious answers.
    else if (['Finland', 'Sweden', 'Norway'].contains(territory)) {
        possible_answers = ['Denmark', 'Iceland', 'Greenland']
    }
    else if (['Canada'].contains(territory)) {
        possible_answers = ['Greenland']
    }
    else if (['North Korea', 'South Korea'].contains(territory)) {
        possible_answers = ['Japan']
    }
    else if (['Mongolia'].contains(territory)) {
        possible_answers = ['Kazakhstan']
    }
    else if (['China'].contains(territory)) {
        possible_answers = possible_answers.concat(['Taiwan'])
    }
    else if (['Vietnam'].contains(territory)) {
        possible_answers = possible_answers.concat(['Philippines'])
    }
    else if (['San Marino'].contains(territory)) {
        possible_answers = ['Vatican City']
    }
    else if (['Vatican City'].contains(territory)) {
        possible_answers = ['San Marino']
    }
    else if (['Malaysia'].contains(territory)) {
        possible_answers = possible_answers.concat(['Singapore', 'Philippines'])
    }
    else if (['Indonesia'].contains(territory)) {
        possible_answers = possible_answers.concat(['Singapore', 'Australia', 'New Zealand', 'Fiji'])
    }
    else if (['New South Wales', 'Victoria', 'South Australia'].contains(territory)) {
        possible_answers = possible_answers.concat(['Tasmania'])
    }
    else if (['Nova Scotia', 'New Brunswick'].contains(territory)) {
        possible_answers = possible_answers.concat(['Prince Edward Island'])
    }
    else if (['Italy', 'Libya', 'Tunisia'].contains(territory)) {
        possible_answers = possible_answers.concat(['Malta'])
    }
    else if (['Mauritania', 'Senegal', 'The Gambia', 'Guinea-Bissau', 'Guinea'].contains(territory)) {
        possible_answers = possible_answers.concat(['Cape Verde'])
    }
    else if (['Nigeria', 'Cameroon', 'Equatorial Guinea', 'Gabon'].contains(territory)) {
        possible_answers = possible_answers.concat(['São Tomé and Principe'])
    }
    else if (['Mozambique', 'Tanzania'].contains(territory)) {
        possible_answers = possible_answers.concat(['Madagascar', 'Comoros', 'Seychelles', 'Mauritius'])
    }
    else if (['Saudi Arabia', 'Qatar', 'United Arab Emirates'].contains(territory)) {
        possible_answers = possible_answers.concat(['Bahrain'])
    }
    else if (['Israel', 'Lebanon', 'Syria', 'Turkey'].contains(territory)) {
        possible_answers = possible_answers.concat(['Cyprus'])
    }
    else if (['India', 'Bangladesh'].contains(territory)) {
        possible_answers = possible_answers.concat(['Sri Lanka', 'Maldives'])
    }
    else if (['Venezuela'].contains(territory)) {
        possible_answers = possible_answers.concat(['Trinidad and Tobago'])
    }
    ////
    var answer = choice(possible_answers)
    return {territory: territory, answer: answer, wrong_answers: wrong_answers, chosen:""}
}

function prepend_the(territory, capitalize_the=false) {
    var the = (capitalize_the ? "The " : "the ")
    var should_prepend_the = [ 'Australian Capital Territory',
                               'Baltic Sea',
                               'Black Sea',
                               'Caspian Sea',
                               'Central African Republic',
                               'Democratic Republic of the Congo',
                               'Dominican Republic',
                               'Federally Administered Tribal Areas',
                               'Islamabad Capital Territory',
                               'Maldives',
                               'Mediterranean Sea',
                               'Mississippi River',
                               'Netherlands',
                               'Northern Territory',
                               'Northwest Territories',
                               'Pacific Ocean',
                               'Persian Gulf',
                               'Philippines',
                               'Red Sea',
                               'Republic of the Congo',
                               'Seychelles',
                               'State of Mexico',
                               'United Arab Emirates',
                               'United Kingdom',
                               'United States (Continental)',
                               'United States',
                               'Western Sahara',
                               'Yukon Territory' ]
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

function pretty_print(territory, capitalize_the=false) {
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
    var total_seconds = Math.floor(raw_date/1000)
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

    var a = neighbors(territory)

    var s = ""
    if (a.length == 0) {
        s = "nothing!"
    }
    else if (a.length == 1) {
        s = " only " + pretty_print(a[0]) + "."
    }
    else if (a.length == 2) {
        s = (pretty_print(a[0]) + " and " + pretty_print(a[1])) + "."
    }
    else {
        for (i = 0; i < a.length - 1; i++) {
            s += pretty_print(a[i])
            s += ", "
        }
        s += ("and " + pretty_print(a[a.length - 1]) + ".")
    }

    return (pretty_print(territory, true) + " borders " + s)
}

function embed_map(question_info, score, start_time) {
    question_info.chosen = question_info.chosen.replace(/\'/g,'&#39;')
    question_info.answer = question_info.answer.replace(/\'/g,'&#39;')
    var territory = (question_info.chosen == question_info.answer ? question_info.chosen : question_info.territory)

    var coordinates_ = coordinates(territory)
    var zoom = google_maps_zoom_level(territory)

    var url = quiz_modes_metadata()[dict_name(territory)].map_embed_base_url
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
        message += quiz_modes_metadata()[dict_name(territory)].click_message
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
    question += "<i>"
    question += "Correct: "
    question += score.correct
    question += "&nbsp;&nbsp;Wrong: "
    question += score.wrong
    question += "</i>"
    question += "<br><span id='timer'>"
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
    question += quiz_modes_metadata()[dict_name(question_info.territory)].title
    question += "</div>"
    question += "<div id='"
    question += (on_mobile_device() ? "question-text-mobile" : "question-text")
    question += "'>"
    question += "<p>Which of these does not border "
    question += pretty_print(question_info.territory)
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
    while (neighbors(territory).length == 0) {
        territory = choice(territories())
    }
    return territory
}

function next_question(question_info, score, start_time) {
    if (!question_info) {
        question_info = build_question(random_territory())
    }
    embed_question(question_info, score, start_time)
}