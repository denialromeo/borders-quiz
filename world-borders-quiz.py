import json, random

def random_country():
    countries = list(data['continental']['old-world']) + list(data['continental']['new-world'])
    return random.choice(countries)

def neighbors(country):
    if country in data['continental']['new-world']:
        return data['continental']['new-world'][country]
    else:
        return data['continental']['old-world'][country]

# bfs stands for "breadth-first search". Google this if unfamiliar.
def bfs(country):
    visited = {country: 0}
    bfs_queue = [country]
    while bfs_queue != []:
        v = bfs_queue.pop(0)
        for neighbor in neighbors(v):
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

    possible_wrong_answers = neighbors(country)
    if (len(possible_wrong_answers) > 3):
        possible_wrong_answers = random.sample(possible_wrong_answers, 3)

    a = bfs(country)

    if difficulty == 'easy':
        answer = random.choice(list(filter(lambda c: a[c] >= 4, a)))
    if difficulty == 'hard':
        answer = random.choice(list(filter(lambda c: a[c] == 2, a)))

    choices = possible_wrong_answers + [answer]
    random.shuffle(choices)

    for idx, choice in enumerate(choices):
        s += '\t{0}. {1}\n'.format(chr(idx + 65), choice)

    print(s)

if __name__ == '__main__':
    with open('borders.json') as data_file:
        data = json.load(data_file)