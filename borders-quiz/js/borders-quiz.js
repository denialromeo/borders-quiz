var container_id = "game-container"
var timer_id = "timer"
var timer_process_id = 0
var google_maps_api_key = "AIzaSyBg5esZrKJYIXrvFfgu1TIApJupbEPmcTk"
var borders_json_path = "/borders-quiz/json/borders.json"
var google_maps_zoom_levels_json_path = "/borders-quiz/json/google_maps_zoom_levels.json"

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

function parse_url() {
    var fields =  URI(window.location.href).fragment(true)
    var modes = []
    if (fields.countries) {
        modes = modes.concat("countries")
    }
    if (fields.usa_states) {
        modes = modes.concat("usa_states")
    }
    if (fields.india_states) {
        modes = modes.concat("india_states")
    }
    if (fields.pakistan_administrative_units) {
        modes = modes.concat("pakistan_administrative_units")
    }
    if (fields.canada_provinces) {
        modes = modes.concat("canada_provinces")
    }
    if (fields.mexico_states) {
        modes = modes.concat("mexico_states")
    }
    if (fields.china_provinces) {
        modes = modes.concat("china_provinces")
    }
    if (fields.japan_prefectures) {
        modes = modes.concat("japan_prefectures")
    }
    if (fields.australia_states) {
        modes = modes.concat("australia_states")
    }
    if (fields.south_korea_provinces) {
        modes = modes.concat("south_korea_provinces")
    }
    if (fields.california_counties) {
        modes = modes.concat("california_counties")
    }
    if (modes.length == 0) { // Default behavior when app visited.
        modes = ["countries"]
    }
    return modes
}

function territories() {
    var json = {}
    $.ajax({ url: borders_json_path, async: false, success: function (r) { json = r } })
    var territories_ = []
    var modes = parse_url()
    for (i = 0; i < modes.length; i++) {
        territories_ = territories_.concat(Object.keys(json[modes[i]]))
    }
    return territories_
}

function neighbors(territory) {
    var json = {}
    $.ajax({ url: borders_json_path, async: false, success: function (r) { json = r } })
    for (var dict in json) {
        if (json[dict][territory]) {
            return json[dict][territory]
        }
    }
    return []
}

function dict_name(territory) {
    var json = {}
    $.ajax({ url: borders_json_path, async: false, success: function (r) { json = r } })
    for (var dict in json) {
        if (json[dict][territory]) {
            return dict
        }
    }
    if (['Tasmania'].contains(territory)) {
        return "australia_states"
    }
    return ""
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
    if (dict_name(address) == 'japan_prefectures') {
        address += " Japan"
    }
    if (dict_name(address) == 'south_korea_provinces') {
        address += " South Korea"
    }

    // California's neighbors should be treated differently from California's counties.
    if (address == 'Pacific Ocean') {
        address = "Cooperstown California"
    }
    else if (address == 'Mexico__') {
        address = "Baja California"
    }
    else if (dict_name(address) == 'california_counties') {
        address += " County California"
    }

    if (dict_name(address) == 'australia_states') {
        address += " Australia"
    }
    if (address == 'Durango') {
        address += " Mexico"
    }
    if (address == 'México') {
        address += " State"
    }
    if (address == 'China_') {
        address = 'Nepal' // We're only interested in China's border with India.
    }
    if (address == 'China__') {
        address = 'Gilgit-Baltistan' // For the China-Pakistan border.
    }
    if (address == 'Punjab_') {
        address = 'Punjab Pakistan' // To distinguish from Punjab, India.
    }
    if (address == 'India_') {
        address = 'Dharakh India' // To see the full India-Pakistan border.
    }
    if (address == 'Afghanistan_') {
        address = 'FATA Pakistan' // For the Afghanistan-Pakistan border.
    }
    if (address == 'Iran_') {
        address = 'Sefidabeh' // For the Iran-Pakistan border.
    }
    if (address == 'Georgia') {
        address = 'Georgia country' // Not the U.S. state.
    }
    if (address == 'India') {
        address = 'Nepal' // For a clearer view of India's northern borders.
    }
    if (address == 'India__') {
        address = 'Gomo Co Tibet' // For a clearer view of the India-China border.
    }
    if (address == 'Russia_') {
        address = 'Ulan Bator' // For a clearer view of the Russia-China border.
    }
    if (address == 'Italy') {
        address = 'San Marino' // For a clearer view of Italy's northern borders.
    }
    if (address == 'Washington') {
        address = 'Washington State' // So we don't get the map for Washington, D.C.
    }
    if (address == 'North Korea_') {
        address = 'Cheorwon South Korea' // For a clear view of South Korea's northern border.
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
    var territories_to_prepend = ['Pacific Ocean', 'Federally Administered Tribal Areas', 'Islamabad Capital Territory', 'Persian Gulf', 'State of Mexico', 'Australian Capital Territory', 'Northern Territory', 'Maldives', 'Seychelles', 'Philippines', 'Red Sea', 'Western Sahara', 'Baltic Sea', 'Caspian Sea', 'Black Sea', 'United States (Continental)', 'Northwest Territories', 'Yukon Territory', 'United Kingdom', 'United States', 'Netherlands', 'Central African Republic', 'United Arab Emirates', 'Democratic Republic of the Congo', 'Dominican Republic', 'Mediterranean Sea', 'Mississippi River', 'Republic of the Congo']
    return (territories_to_prepend.contains(territory) ? the : "")
}

function truncate_for_mobile(territory) {
    if (on_mobile_device()) {
        if (territory == "Democratic Republic of the Congo") {
            return "DRC"
        }
        if (territory == "Republic of the Congo") {
            return "ROC"
        }
        if (territory == "Central African Republic") {
            return "CAR"
        }
        if (territory == "United Arab Emirates") {
            return "UAE"
        }
        if (territory == "Dominican Republic") {
            return "Dominican Rep."
        }
        if (territory == "Bosnia and Herzegovina") {
            return "Bosnia"
        }
        if (territory == "Papua New Guinea") {
            return "New Guinea"
        }
        if (territory == "Western Sahara") {
            return "W. Sahara"
        }
        if (territory == "United Kingdom") {
            return "UK"
        }
        if (territory == "São Tomé and Principe") {
            return "São Tomé"
        }
        if (territory == "Mediterranean Sea") {
            return "Mediterranean"
        }
        if (territory == "Neimongol (Inner Mongolia)") {
            return "Neimongol"
        }
        if (territory == "Australian Capital Territory") {
            return "ACT"
        }
        if (territory == "Northern Territory") {
            return "NT"
        }
        if (territory == "United States (Continental)") {
            return "USA Mainland"
        }
        if (territory == "Northwest Territories") {
            return "NW Territories"
        }
        if (territory == "Newfoundland and Labrador") {
            return "NL"
        }
        if (territory == "Federally Administered Tribal Areas") {
            return "FATA"
        }
        if (territory == "Islamabad Capital Territory") {
            return "ICT"
        }
        if (territory == "Azad Jammu and Kashmir") {
            return "AJK"
        }
        if (territory == "Khyber Pakhtunkhwa") {
            return "KP"
        }
    }
    return territory
}

function pretty_print(territory, capitalize_the=false) {
    var the = prepend_the(territory, capitalize_the)
    territory = truncate_for_mobile(territory)
    return (the + territory.replace(/_/g,'').replace(/\s/g,'&nbsp;'))
}

// Only for testing.
function test_map(t) {
    embed_map(build_question(t), {correct:0,wrong:0})
}
function test_question(t) {
    test_map(t)
    function next_question_button() {
        var next_button = document.getElementById(container_id).contentWindow.document.getElementById("next")
        if (!next_button) {
            window.requestAnimationFrame(next_question_button);
        }
        next_button.click()
    }
    next_question_button()
}
// Above code can be freely removed.

// Timer code.
function format_time(raw_date) {
    function prepend_zero(time) {
        return (time < 10 ? "0" + time : time)
    }
    var total_seconds = raw_date/1000
    var hours = prepend_zero(Math.floor(total_seconds/60/60))
    var minutes = prepend_zero(Math.floor((total_seconds/60) % 60))
    var seconds = prepend_zero(Math.floor(total_seconds % 60))
    var time = minutes + ":" + seconds
    return (hours > 0 ? hours + ":" + time : time)
}
function timer(start_time) {
    var time_elapsed = format_time(Date.now() - start_time)
    var timer_span = document.getElementById(container_id).contentWindow.document.getElementById("timer")
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
    document.getElementById(container_id).srcdoc ="<head><link rel='stylesheet' href='/borders-quiz/css/borders-quiz.css'/></head><body>" + src + "</body>"
    document.getElementById(container_id).style="border: 2px solid black;"
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
    var zoom = google_maps_zoom_level(territory)
    if (dict_name(territory) == 'japan_prefectures') {
        zoom = 7
    }
    else if (dict_name(territory) == 'south_korea_provinces') {
        zoom = 7
    }
    else if (dict_name(territory) == 'california_counties') {
        if (['Pacific Ocean', 'Oregon_', 'Mexico__', 'Nevada_', 'Arizona__'].contains(territory)) {
            zoom = 5
        }
        else {
            zoom = 7
        }
    }

    var coordinates_ = coordinates(territory)
    var url = ""
    if (dict_name(territory) == 'california_counties') {
        url = "https://fusiontables.google.com/embedviz?q=select+col4+from+1QxmdyxJWnq5IgFpS5zGv9M1v25l84InpK8y-yY_m&viz=MAP&h=false&t=1&l=col4"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'mexico_states') {
        url = "https://fusiontables.google.com/embedviz?q=select+col5+from+19KyBvfdcDLNkVwn466Aa9asNfTMsPhwsasNdimAP&viz=MAP&h=false&t=1&l=col5"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'japan_prefectures') {
        url = "https://fusiontables.google.com/embedviz?q=select+col2+from+1e1KEhbC1opeDS1IhQCVCyyR4X9U1D1eVB_gfmIdy&viz=MAP&h=false&t=1&l=col2"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'usa_states') {
        url = "https://fusiontables.google.com/embedviz?q=select+col3+from+1wm55ugZ3RffprAFPRklG254KDInGYwtYy_-5oQQX&viz=MAP&h=false&t=1&l=col3"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'china_provinces') {
        url = "https://fusiontables.google.com/embedviz?q=select+col12+from+1ZpUS_-CvOh40_HaHXJ4TGjfOO0n9VPglLpTtlFg9&viz=MAP&h=false&t=1&l=col12"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'india_states') {
        url = "https://fusiontables.google.com/embedviz?q=select+col3+from+1ic8zKmb8ROuFbiQMLXvdA6u9EPJaJjWq6pyZDC83&viz=MAP&h=false&t=1&l=col3"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'canada_provinces') {
        url = "https://fusiontables.google.com/embedviz?q=select+col4+from+1WLNv__CToy_grFi67jOIKJPmy5KlA0Ihh6j0sW0H&viz=MAP&h=false&t=1&l=col4"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'australia_states') {
        url = "https://fusiontables.google.com/embedviz?q=select+col2+from+1AyYgmyEMeKnAqdAGoeQCfkOROAGAQYnzlzvV92Bo&viz=MAP&h=false&t=1&l=col2"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else if (dict_name(territory) == 'pakistan_administrative_units') {
        url = "https://fusiontables.google.com/embedviz?q=select+col0+from+1CFcoHdOuF_S98-v5E8RuFOobTOFYzq6Gz4FfVoK5&viz=MAP&h=false&t=1&l=col0"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }
    else {
        url = "https://fusiontables.google.com/embedviz?q=select+col3+from+1rkqDW9ccbr840fEN9Ao5sq2fVrYXPkirKjnN4oyD&viz=MAP&h=false&t=1&l=col3"
        url = URI(url).addSearch({ "lat": coordinates_.lat, "lng": coordinates_.lng, "z": zoom }).toString()
    }

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
        if (dict_name(territory) == 'mexico_states') {
            message += "(Click the states!)"
        }
        else if (dict_name(territory) == 'india_states') {
            message += "(Click the states!)"
        }
        else if (dict_name(territory) == 'pakistan_administrative_units') {
            message += "(Click the administrative units!)"
        }
        else if (dict_name(territory) == 'australia_states') {
            message += "(Click the states!)"
        }
        else if (dict_name(territory) == 'china_provinces') {
            message += "(Click the provinces!)"
        }
        else if (dict_name(territory) == 'canada_provinces') {
            message += "(Click the provinces!)"
        }
        else if (dict_name(territory) == 'japan_prefectures') {
            message += "(Click the prefectures!)"
        }
        else if (dict_name(territory) == 'usa_states') {
            message += "(Click the states!)"
        }
        else if (dict_name(territory) == 'south_korea_provinces') {
            message += "(Clearer map <a href='https://en.wikipedia.org/wiki/Provinces_of_Korea#/media/File:Provinces_of_South_Korea_(numbered_map).png' target='_blank'>here</a>.)"
        }
        else if (dict_name(territory) == 'california_counties') {
            message += "(Click the counties!)"
        }
        else {
            message += "(Click the countries!)"
        }
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
        var next_button = document.getElementById(container_id).contentWindow.document.getElementById("next")
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
        var timer_node = document.getElementById(container_id).contentWindow.document.getElementById("timer")
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

function title(territory) {
    if (dict_name(territory) == 'countries') {
        return "World Countries"
    }
    if (dict_name(territory) == 'usa_states') {
        return "USA States"
    }
    if (dict_name(territory) == 'california_counties') {
        return "California Counties"
    }
    if (dict_name(territory) == 'mexico_states') {
        return "Mexico States"
    }
    if (dict_name(territory) == 'canada_provinces') {
        return "Canada Provinces"
    }
    if (dict_name(territory) == 'india_states') {
        return "India States"
    }
    if (dict_name(territory) == 'pakistan_administrative_units') {
        return "Pakistan Administrative Units"
    }
    if (dict_name(territory) == 'china_provinces') {
        return "China Provinces"
    }
    if (dict_name(territory) == 'japan_prefectures') {
        return "Japan Prefectures"
    }
    if (dict_name(territory) == 'australia_states') {
        return "Australia States"
    }
}

function embed_question(question_info, score, start_time) {
    var choices = shuffle(question_info.wrong_answers.concat(question_info.answer))
    var question_container_id = on_mobile_device() ? "question-container-mobile" : "question-container"
    question  = "<div id='" + question_container_id + "'>"
    question += "<div id='quiz_title'>"
    question += title(question_info.territory)
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
        var choices = document.getElementById(container_id).contentWindow.document.getElementsByName("choice")
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

function next_question(question_info, score, start_time) {
    if (question_info) {
        embed_question(question_info, score, start_time)
    }
    else {
        embed_question(build_question(choice(territories())), score, start_time)
    }
}