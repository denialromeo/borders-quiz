var container_id = "game-container"
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var google_maps_zoom_levels_json_path = "/borders-quiz/json/google_maps_zoom_levels.json"

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

function parse_url() {
    var fields =  URI(window.location.href).fragment(true)
    if ($.isEmptyObject(fields)) { // Default behavior.
    	return ["countries"]
    }
    else {
    	var dict_names = []
    	if (fields.usa_states) {
    		dict_names = dict_names.concat("usa_states")
    	}
    	if (fields.countries) {
    		dict_names = dict_names.concat("countries")
    	}
    	if (fields.india_states) {
    		dict_names = dict_names.concat("india_states")
    	}
        if (fields.canada_provinces) {
            dict_names = dict_names.concat("canada_provinces")
        }
    	return dict_names
    }
}

function territories() {
    var json = {}
    $.ajax({ url: borders_json_path, async: false, success: function (r) { json = r } })
    var combined_keys = []
    var dict_names = parse_url()
    for (i = 0; i < dict_names.length; i++) {
    	combined_keys = combined_keys.concat(Object.keys(json[dict_names[i]]))
    }
    return combined_keys
}

function neighbors(territory) {
    var json = {}
    $.ajax({ url: borders_json_path, async: false, success: function (r) { json = r } })
    var combined_keys = []
    for (var dict in json) {
    	if (json[dict][territory]) {
    		return json[dict][territory]
    	}
    }
    return []
}

function google_maps_zoom_level(territory) {
    var json = {}
    $.ajax({ url: google_maps_zoom_levels_json_path, async: false, success: function (r) { json = r } })
    return (json[territory] ? json[territory] : 5)
}

function geocode(address) {
    var url = "https://maps.googleapis.com/maps/api/geocode/json"
    var json = {}
    $.ajax({ url: url, data: {"key": google_maps_api_key, "address": address}, async: false, success: function (r) { json = r }})
    return json
}

function coordinates(address) {
    if (address == 'China ') {
        address = 'Nepal' // We're only interested in China's border with India.
    }
    if (address == 'India') {
        address = 'Nepal' // For a clearer view of India's northern borders.
    }
    if (address == 'Italy') {
        address = 'San Marino' // For a clearer view of Italy's northern borders.
    }
    var coordinates = geocode(address).results[0].geometry.location
    return (coordinates.lat + ',' + coordinates.lng)
}

// Taken from http://web.archive.org/web/20120326084113/http://www.merlyn.demon.co.uk/js-shufl.htm
function random(x) {
  return Math.floor(x*(Math.random()%1)) 
}
Array.prototype.swap = function(j, k) {
  var t = this[j] ; this[j] = this[k] ; this[k] = t
}
function shuffle(l) {
    for (var j=l.length-1; j>0; j--) { 
        l.swap(j, random(j+1)) 
    }
    return l
}
function sample(l, k) {
    if (!l) {
        return []
    }
    for (var j=0; j < l.length; j++) {
        l.swap(j, random(l.length))
    }
    return l.slice(0,k)
}
function choice(l) {
    return l[random(l.length)]
}

function remove_neighbor_from_search(territory, neighbor) {
    // China and Russia make the "graph distance" difficulty mechanic a little pointless.
    // If India and Poland are just three countries apart (India → China → Russia → Poland),
    // a question asking if they border each other is a bit too easy.
    //
    // So China and Russia are removed from graph searches except when started from countries which
    // exclusively border China and/or Russia.
    if (neighbor == 'China') {
        if (!['Mongolia', 'North Korea', 'South Korea'].contains(territory)) {
            return true
        }
    }
    if (neighbor == 'Russia') {
        return true
    }
    // China as bordering India poses the same problem.
    if (neighbor == 'China ') {
        return true
    }
    // Likewise for Canada and Mexico when called from a U.S. state. Washington and Maine both border Canada,
    // but are on opposite sides of the country.
    if (['Canada ', 'Mexico '].contains(neighbor)) {
        if (territory != 'Alaska') {
            return true
        }
    }
    // Too many of Canada's provinces border the U.S.
    if (neighbor == 'United States (Continental)') {
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
                if (!remove_neighbor_from_search(territory, neighbor)) {
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
    // These are just to play with the player by giving them less obvious answers.
    else if (['Finland', 'Sweden', 'Norway'].contains(territory)) {
        possible_answers = ['Denmark', 'Iceland']
    }
    else if (['North Korea', 'South Korea'].contains(territory)) {
        possible_answers = ['Japan']
    }
    else if (territory == 'Mongolia') {
        possible_answers = ['Kazakhstan']
    }
    else if (['Malaysia', 'Indonesia'].contains(territory)) {
        possible_answers = possible_answers.concat(['Singapore'])
    }
    else if (['Saudi Arabia', 'Qatar', 'United Arab Emirates'].contains(territory)) {
        possible_answers = possible_answers.concat(['Bahrain'])
    }
    ////
    var answer = choice(possible_answers)
    return {territory: territory, answer: answer, wrong_answers: wrong_answers, chosen:""}
}

function neighbors_to_sentence(territory) {
    var s = ""
    var neighbors_ = neighbors(territory)
    if (neighbors_.length == 0) {
        return " nothing!"
    }
    if (neighbors_.length == 1) {
        s += " only "
        s += pretty_print(neighbors_[0])
    }
    else if (neighbors_.length == 2) {
        s += (pretty_print(neighbors_[0]) + " and " + pretty_print(neighbors_[1]))
    }
    else {
        for (i = 0; i < neighbors_.length - 1; i++) {
            s += pretty_print(neighbors_[i])
            s += ", "
        }
        s += "and "
        s += pretty_print(neighbors_[neighbors_.length - 1])
    }
    return (s + ".")
}

function prepend_the(territory, start_of_sentence=false) {
    var the = start_of_sentence ? "The " : "the "
    function should_prepend_the() {
        return ['Red Sea', 'Western Sahara', 'Baltic Sea', 'Caspian Sea', 'Black Sea', 'United States (Continental)', 'Northwest Territories', 'Yukon Territory', 'United Kingdom', 'United States', 'Netherlands', 'Central African Republic', 'United Arab Emirates', 'Democratic Republic of the Congo', 'Dominican Republic', 'Mediterranean Sea', 'Mississippi River', 'Republic of the Congo'].contains(territory)
    }
    return (should_prepend_the() ? the : "")
}

function pretty_print(territory, start_of_sentence=false) {
    var the = prepend_the(territory, start_of_sentence)
    territory = $.trim(territory).replace(/\s/g,'&nbsp;')
    return (the + territory)
}

// Only for testing.
function test_map(t) {
    embed_map(build_question(t), {correct:0,wrong:0})
}
function test_question(t) {
    test_map(t)
    function next_question_button() {
        var next_button = document.getElementById(container_id).contentWindow.document.getElementsByName("next")[0]
        if (document.getElementById(container_id).contentWindow.document.getElementsByName("next").length == 0) {
            window.requestAnimationFrame(next_question_button);
        }
        next_button.click()
    }
    next_question_button()
}
// Above code can be freely removed.

function embed(src) {     
    document.getElementById(container_id).srcdoc=src
    document.getElementById(container_id).style = "border: 2px solid black"
}

function embed_map(question_info, score) {
    question_info.chosen = question_info.chosen.replace(/\'/g,'&#39;')
    question_info.answer = question_info.answer.replace(/\'/g,'&#39;')
    var territory = (question_info.chosen == question_info.answer ? question_info.chosen : question_info.territory)
    var zoom = google_maps_zoom_level(territory)
    var coordinates_ = (territory == 'Georgia' ? coordinates(territory + ' country') : coordinates(territory))
    var url = URI("https://www.google.com/maps/embed/v1/view").search({"key": google_maps_api_key, "zoom": zoom, "center": coordinates_}).toString()

    // Hacky way of styling on mobile.
    var map_height = ($(document).width() > 760 ? 350 : 200)
    var map_width = "80%"
    var map = "<iframe width='"
    map += map_width
    map += "' height='"
    map += map_height
    map += "' frameborder='0' src='"
    map += url
    map += "'></iframe>"

    function top_message() {
        var success = " does not border "
        var failure = " does border "
        if (question_info.chosen == question_info.answer) {
            return ("Correct! " + pretty_print(question_info.chosen, true) + success + pretty_print(question_info.territory) + "!")
        }
        else {
            return ("Sorry! " + pretty_print(question_info.territory, true) + failure + pretty_print(question_info.chosen) + "!")
        }
    }

    var content = "<center>"
    content += "<p style='font-family:Helvetica'>"
    content += top_message()
    content += "</p>"
    content += map
    content += "<p style='font-family:Helvetica'>"
    content += pretty_print(territory, true)
    content += " borders "
    content += neighbors_to_sentence(territory)
    content += "</p>"
    content += "<button name='next'></button>"
    content += "</center>"
    embed(content)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function next_question_button() {
        if (document.getElementById(container_id).contentWindow.document.getElementsByName("next").length == 0) {
            window.requestAnimationFrame(next_question_button);
        }
        else {
            var next_button = document.getElementById(container_id).contentWindow.document.getElementsByName("next")[0]
            if (question_info.chosen == question_info.answer) {
                score.correct += 1
                next_button.onclick = function() { return next_question(null, score) }
                next_button.innerHTML = "Next"
            }
            else {
                score.wrong += 1
                next_button.onclick = function() { return next_question(question_info, score) }
                next_button.innerHTML = "Try Again"
            }
    	}
    }
    next_question_button()
}

function embed_question(question_info, score) {
    var choices = shuffle(question_info.wrong_answers.concat(question_info.answer))
    question  = "<div style='padding-left:15%;padding-top:17%;font-size:20px;font-family:Helvetica'>"
    question += "<table style='table-layout:fixed'>"
    question += "<tr>"
    question += "<p>Which of these does not border "
    question += pretty_print(question_info.territory)
    question += "?</p>"
    question += "<td style='height:100px'>"
    question += "<div>"
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
    question += "</td>"
    question += "</tr>"
    question += "</table>"
    question += "</div>"

    // question += "<div style='float:right;padding-top:20%;padding-right:5%;font-size:15px;font-family:Helvetica'>"
    // question += "<p>"
    // question += "<i>"
    // question += "Correct: "
    // question += score.correct
    // question += "&nbsp;&nbsp;Wrong: "
    // question += score.wrong
    // question += "</i>"
    // question += "</p>"
    // question += "</div>"
    
    embed(question)

    // Taken from https://swizec.com/blog/how-to-properly-wait-for-dom-elements-to-show-up-in-modern-browsers/swizec/6663
    function detect_player_choice() {
        if (document.getElementById(container_id).contentWindow.document.getElementsByName("choice").length == 0) {
            window.requestAnimationFrame(detect_player_choice);
        }
        else {
            var choices = document.getElementById(container_id).contentWindow.document.getElementsByName("choice")
            for (i = 0; i < choices.length; i++) {
                choices[i].onclick = function() {
                    question_info.chosen = this.id
                    embed_map(question_info, score)
                }
            }
        }
    }
    detect_player_choice()
}

function next_question(question_info=null, score={correct:0, wrong:0}) {
    if (question_info) {
        embed_question(question_info, score)
    }
    else {
        embed_question(build_question(choice(territories())), score)
    }
}