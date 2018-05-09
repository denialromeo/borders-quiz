import json, sys

borders_json_path = 'json/borders.json'

def is_complete_graph(vertex_neighbors_dict):
    complete = True
    for v in vertex_neighbors_dict:
        for n in vertex_neighbors_dict[v]:
            if v not in vertex_neighbors_dict[n]:
                complete = False
                print('{} is not in {}\'s neighbors!'.format(v, n))
    print(complete)

def get_dict(key):
    with open(borders_json_path) as data_file:
        data = json.load(data_file)
        return data[key]

# This simple script tests whether a given dictionary encodes a complete graph.
#
# Borders are always undirected graphs, so this is a simple way of checking if we missed something.
#
# Example Usage: python test_complete_graph.py india_states
if __name__ == '__main__':
    key = sys.argv[1]
    is_complete_graph(get_dict(key))