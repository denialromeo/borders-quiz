import json, random

# bfs stands for "breadth-first search". Google this if unfamiliar.
def bfs(country):
    visited = {country: 0}
    bfs_queue = [country]
    while bfs_queue != []:
        v = bfs_queue.pop(0)
        for neighbor in countries_and_neighbors[v]:
            if neighbor not in visited:
                visited[neighbor] = visited[v] + 1
                # Everything borders China and Russia, skewing quiz difficulty.
                keep_china_russia = ['Finland', 'Sweden', 'Norway', 'Mongolia', 'North Korea', 'South Korea']
                if neighbor in ['China', 'Russia'] and country not in keep_china_russia:
                    pass
                else:
                    bfs_queue.append(neighbor)
    return visited

def question(country, difficulty):
    s = "\nWhich of these countries does not border {0}?\n\n".format(country)

    possible_wrong_answers = countries_and_neighbors[country]
    if (len(possible_wrong_answers) > 3):
        possible_wrong_answers = random.sample(possible_wrong_answers, 3)

    distances = bfs(country)

    if difficulty == 'easy':
        answer = random.choice(list(filter(lambda c: distances[c] >= 4, distances)))
    if difficulty == 'hard':
        answer = random.choice(list(filter(lambda c: distances[c] == 2, distances)))

    choices = possible_wrong_answers + [answer]
    random.shuffle(choices)

    for idx, choice in enumerate(choices):
        s += '\t{0}. {1}\n'.format(chr(idx + 65), choice)

    print(s)

if __name__ == '__main__':
    with open('borders.json') as data_file:
        data = json.load(data_file)
        countries_and_neighbors = data['continental']
        while True:
            question(random.choice(list(countries_and_neighbors)), 'hard')
            print('Press "Enter" key for next question.', end='')
            input()