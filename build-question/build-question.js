const random = require("./random.js")

const borders = require("./borders.json")
const question_settings = require("./question-settings.json")

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

const default_quiz_mode = Object.keys(borders).pop()

function quiz_mode_of(territory) {
    const quiz_mode = Object.keys(borders).find(mode => territory in borders[mode])
    return (quiz_mode !== undefined ? quiz_mode : default_quiz_mode)
}

function neighbors(territory) {
    var quiz_mode = quiz_mode_of(territory)
    // slice() makes a copy of the array so we don't mess up the original.
    return (territory in borders[quiz_mode] ? borders[quiz_mode][territory].slice() : undefined)
}

// If a territory has no neighbors, we can't make a question from it!
function valid(territory) {
    return territory !== undefined && neighbors(territory).length > 0
}

function all_quiz_modes() {
    return Object.keys(borders)
}

function current_quiz_modes(url_parameters) {
    if ("all" in url_parameters) {
        return all_quiz_modes()
    }
    var current_modes = all_quiz_modes().filter(mode => mode in url_parameters)
    return current_modes.length === 0 ? [default_quiz_mode] : current_modes
}

function current_quiz_modes_territories(url_parameters) {
    return current_quiz_modes(url_parameters)
          .map(mode => Object.keys(borders[mode]))
          .reduce((arr, next_arr) => arr.concat(next_arr)) // [[1,2], [3,4]] -> [1, 2, 3, 4]
          .filter(valid)
}

// Iran and its bordering countries - http://danielmoore.us/borders-quiz?start=Iran
// Countries in Africa - http://danielmoore.us/borders-quiz?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco
function neighboring_territories(url_parameters) {
    if (url_parameters["start"] !== undefined && url_parameters["start"].split(";").some(valid)) {
        var depth = isNaN(url_parameters["depth"]) ? 1 : Number(url_parameters["depth"])
        var exclude_paths_through = "exclude-paths-through" in url_parameters ?
                                    url_parameters["exclude-paths-through"].split(";") : []
        var filter_search = exclude_paths_through.length > 0
        var territory_distance_dict = url_parameters["start"].split(";").filter(valid)
                                     .map(s => breadth_first_search(s, depth, filter_search, exclude_paths_through))
                                     .reduce((dict, next_dict) => Object.assign(dict, next_dict))
        if ("exclude" in url_parameters) {
            url_parameters["exclude"].split(";").forEach(terr => delete territory_distance_dict[terr])
        }
        if ("include" in url_parameters) {
            url_parameters["include"].split(";").filter(valid).forEach(terr => territory_distance_dict[terr] = undefined)
        }
        return Object.keys(territory_distance_dict).filter(valid)
    }
    return []
}

// India, Pakistan, Bangladesh - http://danielmoore.us/borders-quiz?custom=India|Pakistan|Bangladesh
// All U.S. states starting with N - http://danielmoore.us/borders-quiz?usa-states&custom=^N
function custom_territories(url_parameters) {
    if ("custom" in url_parameters) {
        var custom_regex = new RegExp(url_parameters["custom"])
        return current_quiz_modes_territories(url_parameters).filter(t => custom_regex.exec(t) !== null)
    }
    return []
}

// The pool of territories from which to pick the one to ask a question about.
var pool = []
function territories(url_parameters) {
    var territories_methods = [custom_territories, neighboring_territories, current_quiz_modes_territories]
    territories_methods.forEach(function(method) {
        if (pool.length === 0) {
            var possible_pool = method(url_parameters)
            if (possible_pool.length > 0) { pool = possible_pool }
            if (pool.length > 0) { console.log("This quiz is asking questions about ", pool.sort()) }
        }
    })
    return pool
}

// Countries quiz with only 2 choices - http://danielmoore.us/borders-quiz?num-choices=2
function num_choices(url_parameters) {
    var num_choices = url_parameters["num-choices"]
    return (isNaN(num_choices) || num_choices < 2) ? 4 : Number(num_choices)
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
        var v = bfs_queue.shift() // Array.prototype.shift() is O(n), but when depth is low, no problem.
        if (territory_distance_dict[v] === depth) {
            return territory_distance_dict // Terminates BFS at given depth.
        }
        neighbors(v).forEach(function(neighbor) {
            if (!(neighbor in territory_distance_dict)) {
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
    var possible_answers = Object.keys(territory_distance_dict).filter(t => territory_distance_dict[t] === answer_distance)

    if (territory in question_settings.replace_possible_answers) {
        possible_answers = question_settings.replace_possible_answers[territory]
    }
    else if (territory in question_settings.add_possible_answers) {
        possible_answers = possible_answers.concat(question_settings.add_possible_answers[territory])
    }

    var answer = random.choice(possible_answers)
    var wrong_answers = random.sample(neighbors(territory), num_wrong_answers)

    return { quiz_mode: quiz_mode_of(territory), territory: territory, answer: answer, wrong_answers: wrong_answers }
}

// Exports
Object.assign(exports, {
    build_question: build_question,
    current_quiz_modes: current_quiz_modes,
    neighbors: neighbors,
    valid: valid
})