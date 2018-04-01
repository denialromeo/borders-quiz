import json, random, sys

def neighbors(country):
	if country in data['continental']['new-world']:
		return data['continental']['new-world'][country]
	else:
		return data['continental']['old-world'][country]

def grab_marbles_from_bag(num_marbles, bag):
	for i in range(num_marbles):
		r = random.randint(i, len(bag) - 1)
		bag[i], bag[r] = bag[r], bag[i]
	return bag[0:num_marbles]

class Node:
	def __init__(self, country):
		self.neighbors = neighbors(country)
		self.distance = sys.maxsize

def bfs(country):
	s = Node(country)
	s.distance = 0
	bfs_queue = [country]
	visited = {country: s}
	while bfs_queue != []:
		v = visited[bfs_queue.pop(0)]
		for neighbor in v.neighbors:
			if neighbor not in visited:
				visited[neighbor] = Node(neighbor)
				bfs_queue.append(neighbor)
				visited[neighbor].distance = v.distance + 1
	return visited

if __name__ == '__main__':
	with open('borders.json') as data_file:
		data = json.load(data_file)