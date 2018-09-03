const borders = require('./borders.json')
const { build_question, valid } = require('./build-question.js')

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

/* This tests if the adjacency lists in borders.json encode complete graphs.
 *
 * Borders are always undirected graphs, so this is a simple way of checking if we missed something.
 *
 * (Example: If the United States borders Mexico but Mexico doesn't border the U.S., that's an error!)
 */
function is_complete_graph(quiz_mode) {
	var vertex_neighbors_dict = borders[quiz_mode]
	var complete = true
	for (var v in vertex_neighbors_dict) {
		vertex_neighbors_dict[v].forEach(function(n) {
			try {
				if (!vertex_neighbors_dict[n].contains(v)) {
					complete = false
					console.log(`${v} is not in ${n}'s neighbors!`)
				}
			}
			catch (TypeError) {
				console.log(`${n} has no key!`)
				process.exit()
			}
		})
	}
	console.log(complete)
}

Object.keys(borders).forEach(function(quiz_mode) {
	console.log(quiz_mode)
	is_complete_graph(quiz_mode)
	console.log()
})

/* This tests whether there are any duplicate keys in borders.json.
 *
 * (If Suffolk in England and Suffolk County in New York are both labeled Suffolk, we'll run into an error
 *  where the England quiz randomly jumps to New York for a question!)
 */
function all_keys() {
	return Object.keys(borders)
	      .map(mode => Object.keys(borders[mode]))
	      .reduce((arr, next_arr) => arr.concat(next_arr))
	      .sort()
}

function duplicate_keys(keys) {
	var duplicates = []
	for (let i = 0; i < keys.length - 1; i++) {
		if (keys[i] == keys[i + 1]) {
			duplicates.push(keys[i])
		}
	}
	return duplicates
}

var duplicates = duplicate_keys(all_keys())

if (duplicates.length > 0) {
	console.log(`Duplicates: ${duplicates}. Please fix!`)
}

/* This tests if any territories are impossible to create questions for.
 *
 * If this raises an error, please add a relevant entry to replace_possible_answers in question-settings.json.
 */
var impossible_questions = all_keys()
                          .filter(valid)
                          .map(key => build_question({"start": key, "depth": 0, "no-cache": true}))
                          .filter(q => q.answer == undefined)
                          .map(q => q.territory)


if (impossible_questions.length > 0) {
	console.log(`Error when building questions for: ${impossible_questions}. Please fix!`)
}