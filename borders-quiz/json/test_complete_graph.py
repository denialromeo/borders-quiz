# This simple script tests whether a given adjacency matrix encodes a complete graph.
#
# Borders are always undirected graphs, so this is a simple way of checking if we missed something.
#
# Example Usage: python test_complete_graph.py india-states
import json, sys

borders_json_path = 'borders.json'

def is_complete_graph(vertex_neighbors_dict):
    complete = True
    for v in vertex_neighbors_dict:
        for n in vertex_neighbors_dict[v]:
            if v not in vertex_neighbors_dict[n]:
                complete = False
                print('{} is not in {}\'s neighbors!'.format(v, n))
    print(complete)

def get_matrix(key):
    with open(borders_json_path) as data_file:
        data = json.load(data_file)
        return data[key]

if __name__ == '__main__':
    try:
        is_complete_graph(get_matrix(sys.argv[1]))
    except IndexError:
        print("Example Usage: python test_complete_graph.py india-states")