var container_id = "game-container"
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var google_maps_zoom_levels_json_path = "/borders-quiz/json/google_maps_zoom_levels.json"

function parse_url() {
    var fields =  URI(window.location.href).fragment(true)
    if ($.isEmptyObject(fields)) {
    	return ['america_states', 'countries']
    }
    else {
    	var dict_names = []
    	if (fields.america_states) {
    		dict_names = dict_names.concat("america_states")
    	}
    	if (fields.countries) {
    		dict_names = dict_names.concat("countries")
    	}
    	if (fields.india_states) {
    		dict_names = dict_names.concat("india_states")
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
    var coordinates = geocode(address).results[0].geometry.location
    return (coordinates.lat + ',' + coordinates.lng)
}

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
        keep_china = ['Mongolia', 'North Korea', 'South Korea']
        if (keep_china.indexOf(territory) < 0) {
            return true
        }
    }
    if (neighbor == 'Russia') {
        return true
    }
    // Likewise for Canada and Mexico when called from a U.S. state. Washington and Maine both border Canada,
    // but are on opposite sides of the country.
    if (['Canada ', 'Mexico '].indexOf(neighbor) >= 0) {
        keep_canada = ['Alaska']
        if (keep_canada.indexOf(territory) < 0) {
            return true
        }
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
    if (['United Kingdom', 'Ireland'].indexOf(territory) >= 0) {
        possible_answers = ['France', 'Netherlands', 'Belgium']
    }
    if (['Dominican Republic', 'Haiti'].indexOf(territory) >= 0) {
        possible_answers = ['Cuba', 'Jamaica']
    }
    // This is just to play with the user, since most countries bordering Russia obviously don't border Scandinavia.
    if (['Finland', 'Sweden', 'Norway'].indexOf(territory) >= 0) {
        possible_answers = ['Denmark', 'Iceland']
    }
    var answer = choice(possible_answers)
    return {territory: territory, answer: answer, wrong_answers: wrong_answers, chosen:null}
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
        return ['United Kingdom', 'United States', 'Netherlands', 'Central African Republic', 'United Arab Emirates', 'Democratic Republic of the Congo', 'Dominican Republic', 'Mediterranean Sea', 'Mississippi River', 'Republic of the Congo'].indexOf(territory) >= 0
    }
    return (should_prepend_the() ? the : "")
}

function pretty_print(territory, start_of_sentence=false) {
    var the = prepend_the(territory, start_of_sentence)
    territory = $.trim(territory).replace(/\s/g,'&nbsp;')
    return (the + territory)
}

// Only for testing.
function test_question(s) {
   a = build_question(s)
   a.chosen = a.answer
   next_question(a)
}
// Above code can be freely removed.

function embed(src) {     
    document.getElementById(container_id).srcdoc=src
    document.getElementById(container_id).style = "border: 2px solid black"
}

function embed_map(question_info) {
    var territory = ""
    if (!question_info.chosen) {
        question_info.chosen = question_info.territory
    }
    question_info.chosen = question_info.chosen.replace(/'/g,'&#39;')
    if (question_info.chosen == question_info.answer) {
        territory = question_info.chosen
    }
    else {
        territory = question_info.territory
    }
    zoom = google_maps_zoom_level(territory)
    if (territory == 'Georgia') {
        var formatted = coordinates(territory + ' country')
    }
    else {
        var formatted = coordinates(territory)
    }
    var url = URI("https://www.google.com/maps/embed/v1/view").search({"key": google_maps_api_key, "zoom": zoom, "center": formatted}).toString()
    var map = ""
    if ($(document).width() > 760) {
        map = "<iframe width='80%' height='350' frameborder='0' src='" + url + "' ></iframe>"
    }
    // Hacky way of styling on mobile.
    else {
        map = "<iframe width='80%' height='200' frameborder='0' src='" + url + "' ></iframe>"
    }

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

    var content = "<center><p style='font-family:Helvetica'>"
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
                next_button.onclick = function() { return next_question() }
                next_button.innerHTML = "Next"
            }
            else {
                next_button.onclick = function() { return next_question(question_info) }
                next_button.innerHTML = "Try Again"
            }
    	}
    }
    next_question_button()
}

function embed_question(question_info) {
    var choices = shuffle(question_info.wrong_answers.concat(question_info.answer))
    question  = "<div style='padding-left:20%;padding-top:20%;font-size:20px;font-family:Helvetica'>"
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
    question += "</div>"
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
                    embed_map(question_info)
                }
            }
        }
    }
    detect_player_choice()
}

function next_question(question_info=null) {
    if (question_info) {
        embed_question(question_info)
    }
    else {
        embed_question(build_question(choice(territories())))
    }
}