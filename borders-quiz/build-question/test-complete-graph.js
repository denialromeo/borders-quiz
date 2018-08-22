// This simple script tests whether the adjacency lists in borders.json encode complete graphs.
//
// Borders are always undirected graphs, so this is a simple way of checking if we missed something.
//
// Example Usage: node test_complete_graph.js
const borders = require('./borders.json')

Array.prototype.contains = function(s) { return this.indexOf(s) >= 0 }

function is_complete_graph(quiz_mode) {
	var vertex_neighbors_dict = borders[quiz_mode]
	var complete = true
	for (var v in vertex_neighbors_dict) {
		vertex_neighbors_dict[v].forEach(function(n) {
			if (!vertex_neighbors_dict[n].contains(v)) {
				complete = false
				console.log(`${v} is not in ${n}'s neighbors!`)
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