const random = require("./random.js")

const borders = require("./borders.json")
const question_settings = require("./question-settings.json")

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

const default_quiz_mode = Object.keys(borders).pop()

function neighbors(territory) {
    for (var quiz_mode in borders) {
        if (borders[quiz_mode][territory] != undefined) {
            return borders[quiz_mode][territory].slice() // slice() makes a copy of the array so we don't mess up the original.
        }
    }
    return []
}

// If a territory has no neighbors, we can't make a question from it!
function valid(territory) {
    return neighbors(territory).length > 0
}

function all_quiz_modes() {
    return Object.keys(borders)
}

function current_quiz_modes(url_parameters) {
    var url_modes = all_quiz_modes().filter(mode => url_parameters[mode] !== undefined)
    return url_modes.length == 0 ? [default_quiz_mode] : url_modes
}

function current_quiz_modes_territories(url_parameters) {
    return current_quiz_modes(url_parameters)
          .map(mode => Object.keys(borders[mode]))
          .reduce((arr, next_arr) => arr.concat(next_arr))
          .filter(valid)
}

// India, Pakistan, Bangladesh - http://danielmoore.us/borders-quiz?custom=India|Pakistan|Bangladesh
// All U.S. states starting with N - http://danielmoore.us/borders-quiz?usa-states&custom=^N
function custom_territories(url_parameters) {
    if (url_parameters["custom"] != undefined) {
        var custom_regex = new RegExp(url_parameters["custom"])
        var matched_territories = current_quiz_modes_territories(url_parameters).filter(t => custom_regex.exec(t) != null)
        if (matched_territories.length > 0) {
            return matched_territories
        }
    }
    return []
}

// Iran and its bordering countries - http://danielmoore.us/borders-quiz?start=Iran&depth=1
// Countries in Africa - http://danielmoore.us/borders-quiz?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco
function limited_territories(url_parameters) {
    if (valid(url_parameters["start"])) {
        var depth = isNaN(url_parameters["depth"]) ? 1 : url_parameters["depth"]
        var exclude_paths_through = url_parameters["exclude-paths-through"] != undefined ?
                                    url_parameters["exclude-paths-through"].split(";") : []
        var filter_search = exclude_paths_through.length > 0
        return Object.keys(breadth_first_search(url_parameters["start"], depth, filter_search, exclude_paths_through))
    }
    return []
}

var territories_ = []
function territories(url_parameters) {
    var territories_methods = [custom_territories, limited_territories, current_quiz_modes_territories]
    if (territories_.length == 0) {
        for (let i = 0; i < territories_methods.length; i += 1) {
            territories_ = territories_methods[i](url_parameters)
            if (territories_.length > 0) {
                break
            }
        }
    }
    return territories_
}

// Countries quiz with only 2 choices - http://danielmoore.us/borders-quiz?num-choices=2
function num_choices(url_parameters) {
    var num_choices = url_parameters["num-choices"]
    return (isNaN(num_choices) || num_choices < 2) ? 4 : num_choices
}

// This prunes the breadth-first search. It really does a good job of removing obvious answers.
function ignore_paths_through(start, through, exclude_paths_through=[]) {
    if (exclude_paths_through.length > 0) {
        return exclude_paths_through.contains(through)
    }
    return (question_settings.exclude_paths_through.contains(through) && !question_settings.unless_started_from.contains(start))
}

// Google "breadth-first search" if unfamiliar.
function breadth_first_search(territory, depth, filter_search=true, exclude_paths_through=[]) {
    var territory_distance_dict = { [territory]: 0 }
    var bfs_queue = [territory]
    while (bfs_queue.length > 0) {
        var v = bfs_queue.shift()
        if (territory_distance_dict[v] == depth) {
            return territory_distance_dict // Terminates BFS at given depth.
        }
        neighbors(v).forEach(function(neighbor) {
            if (territory_distance_dict[neighbor] == undefined) {
                territory_distance_dict[neighbor] = territory_distance_dict[v] + 1
                if (!filter_search || !ignore_paths_through(territory, neighbor, exclude_paths_through)) {
                    bfs_queue.push(neighbor)
                }
            }
        })
    }
    return territory_distance_dict
}

function build_question(url_parameters) {
    const territory = random.choice(territories(url_parameters))
    const num_wrong_answers = num_choices(url_parameters) - 1

    const answer_distance = 2
    var territory_distance_dict = breadth_first_search(territory, answer_distance)
    var possible_answers = Object.keys(territory_distance_dict).filter(t => territory_distance_dict[t] == answer_distance)

    if (question_settings.replace_possible_answers[territory] != undefined) {
        possible_answers = question_settings.replace_possible_answers[territory]
    }
    else if (question_settings.add_possible_answers[territory] != undefined) {
        possible_answers = possible_answers.concat(question_settings.add_possible_answers[territory])
    }

    var answer = random.choice(possible_answers)
    var wrong_answers = random.sample(neighbors(territory), num_wrong_answers)

    return { territory: territory, answer: answer, wrong_answers: wrong_answers }
}

// Exports
Object.assign(exports, {
    build_question: build_question,
    borders: borders,
    current_quiz_modes: current_quiz_modes,
    neighbors: neighbors
})