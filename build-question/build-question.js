const random = Object.freeze(require("./random.js"))

const borders = Object.freeze(require("./borders.json"))
const question_settings = Object.freeze(require("./question-settings.json"))

const all_quiz_modes    = Object.keys(borders)
const default_quiz_mode = all_quiz_modes[all_quiz_modes.length - 1]

/** "Monkey patches" Array with a method that returns whether the array contains a given item. */
Array.prototype.contains = function(item) { return this.indexOf(item) >= 0 }

/**
 * Returns the quiz mode of the given territory.
 * @param {string} territory The territory to find the quiz mode of.
 */
function quiz_mode_of(territory) {
    const quiz_mode = Object.keys(borders).find(mode => territory in borders[mode])
    return (quiz_mode !== undefined ? quiz_mode : default_quiz_mode)
}

/**
 * Returns an array of the territories bordering the given territory.
 * @param {string} territory The territory to find the neighbors of.
 */
function neighbors(territory) {
    const quiz_mode = quiz_mode_of(territory)
    return (territory in borders[quiz_mode] ? borders[quiz_mode][territory].slice() : undefined)
}

/**
 * Returns whether a given territory is a viable subject to make a question out of.
 * @param {string} territory The territory to test for validity.
 */
function valid(territory) {
    return (territory !== undefined && neighbors(territory).length > 0)
}

/**
 * Returns an array of the quiz modes in the current game.
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function current_quiz_modes(url_parameters) {
    if ("all" in url_parameters) {
        return all_quiz_modes
    }
    const current_modes = all_quiz_modes.filter(mode => mode in url_parameters)
    return (current_modes.length === 0 ? [default_quiz_mode] : current_modes)
}

/**
 * Returns an array of all territories from the current quiz modes that can be turned into questions.
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function current_quiz_modes_territories(url_parameters) {
    return current_quiz_modes(url_parameters)
          .map(mode => Object.keys(borders[mode]))
          .reduce((array, next_array) => array.concat(next_array))
          .filter(valid)
}

/**
 * Returns an array of all territories from the current quiz modes matching the regex in the given URL.
 * Example - All U.S. states starting with N - ?usa-states&custom=^N
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function custom_territories(url_parameters) {
    if ("custom" in url_parameters) {
        var custom_regex = new RegExp(url_parameters["custom"])
        return current_quiz_modes_territories(url_parameters).filter(t => custom_regex.exec(t) !== null)
    }
    return []
}

/**
 * Returns whether search paths through a territory should be investigated. (True if no, false if yes.)
 * This really does a good job of removing obvious answers.
 * @param {string}   start                 The territory the path starts from.
 * @param {string}   through               The territory the path goes through.
 * @param {string[]} exclude_paths_through An array of territories to exclude paths through.
 */
function ignore_paths_through(start, through, exclude_paths_through=[]) {
    if (exclude_paths_through.length > 0) {
        return exclude_paths_through.contains(through)
    }
    return (question_settings.exclude_paths_through.contains(through) && !question_settings.unless_started_from.contains(start))
}

/**
 * The algorithm at the core of the game. Performs a breadth-first search from a given territory to a given depth.
 * Returns a mapping of territories found and distances from the start.
 * @param {string}   territory             The territory the search starts from.
 * @param {number}   depth                 The depth to which to perform the search.
 * @param {boolean}  filter_search         Whether to exclude any search paths. (True if yes, false if no.)
 * @param {string[]} exclude_paths_through An array of territories to exclude search paths through.
 */
function breadth_first_search(territory, depth, filter_search=true, exclude_paths_through=[]) {
    var territory_distance_dict = { [territory]: 0 }
    var bfs_queue = [territory]
    while (bfs_queue.length > 0) {
        const v = bfs_queue.shift() // Array.prototype.shift() is O(n), but when depth is low, no problem.
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

/**
 * Returns an array of territories starting at a territory and including its neighbors, neighbors of neighbors, etc.
 * Example - Iran and its bordering countries - ?start=Iran
 * Example - Countries in Africa - ?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco
 * Example - Southern California Counties - ?california-counties&start=Orange;Santa+Barbara&include=Imperial
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function neighboring_territories(url_parameters) {
    if (url_parameters["start"] !== undefined && url_parameters["start"].split(";").some(valid)) {
        const depth = isNaN(url_parameters["depth"]) ? 1 : Number(url_parameters["depth"])
        const exclude_paths_through = "exclude-paths-through" in url_parameters ?
                                      url_parameters["exclude-paths-through"].split(";") : []
        const filter_search = exclude_paths_through.length > 0
        const territory_distance_dict = url_parameters["start"].split(";").filter(valid)
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

/**
 * Returns an array of territories from which to pick the one to ask a question about.
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
var pool = []
function territories(url_parameters) {
    var territories_methods = [custom_territories, neighboring_territories, current_quiz_modes_territories]
    territories_methods.forEach(function(method) {
        if (pool.length === 0) {
            const possible_pool = method(url_parameters)
            if (possible_pool.length > 0) { pool = possible_pool }
            if (pool.length > 0 && typeof window !== "undefined") { console.log("This quiz is asking questions about", pool.sort()) }
        }
    })
    return pool
}

/**
 * Returns the number of choices (the number of wrong answers + 1) the question should have.
 * Example - Countries quiz with only 2 choices - ?num-choices=2
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function num_choices(url_parameters) {
    const default_num_choices = 4
    const num_choices         = url_parameters["num-choices"]
    return ((isNaN(num_choices) || Number(num_choices) < 2) ? default_num_choices : Number(num_choices))
}

/**
 * Builds a question object and returns it.
 * @param {Object} url_parameters The URL query string parsed as an object.
 */
function build_question(url_parameters) {
    const territory = random.choice(territories(url_parameters))
    const num_wrong_answers = num_choices(url_parameters) - 1

    const answer_distance = 2
    const territory_distance_dict = breadth_first_search(territory, answer_distance)

    var possible_answers = Object.keys(territory_distance_dict).filter(t => territory_distance_dict[t] === answer_distance)
    if (territory in question_settings.replace_possible_answers) {
        possible_answers = question_settings.replace_possible_answers[territory]
    }
    else if (territory in question_settings.add_possible_answers) {
        possible_answers = possible_answers.concat(question_settings.add_possible_answers[territory])
    }

    const answer        = random.choice(possible_answers)
    const wrong_answers = random.sample(neighbors(territory), num_wrong_answers)

    return Object.freeze({ quiz_mode: quiz_mode_of(territory), territory: territory, answer: answer, wrong_answers: wrong_answers })
}

// Exports
Object.assign(exports, {
    build_question: build_question,
    current_quiz_modes: current_quiz_modes,
    neighbors: neighbors,
    quiz_mode_of: quiz_mode_of,
    valid: valid
})