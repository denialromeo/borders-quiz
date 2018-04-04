import json, random

def state_neighbors_dict():
    with open('borders.json') as data_file:
        data = json.load(data_file)
        return data['states']

def random_state(state_neighbors_dict=state_neighbors_dict()):
	return random.choice(list(state_neighbors_dict))

# bfs stands for "breadth-first search". Google this if unfamiliar.
def bfs(state, state_neighbors_dict=state_neighbors_dict()):
    state_distance_dict = {state: 0}
    bfs_queue = [state]
    while bfs_queue != []:
        v = bfs_queue.pop(0)
        for neighbor in state_neighbors_dict[v]:
            if neighbor not in state_distance_dict:
                state_distance_dict[neighbor] = state_distance_dict[v] + 1
                # China and Russia make the "graph distance" difficulty mechanic a little pointless.
                # If India and Poland are just three countries apart (India → China → Russia → Poland),
                # a "Hard" question asking if they border each other is a bit too easy.
                #
                # So China and Russia are removed from graph searches except when started from countries which 
                # exclusively border China and/or Russia.
                keep_china_russia = ['Finland', 'Sweden', 'Norway', 'Mongolia', 'North Korea', 'South Korea']
                if neighbor in ['China', 'Russia'] and state not in keep_china_russia:
                    pass
                else:
                    bfs_queue.append(neighbor)
    return state_distance_dict

def question(state, difficulty, state_neighbors_dict=state_neighbors_dict()):
    s = "\nWhich of these does not border {0}?\n\n".format(state)

    possible_wrong_answers = state_neighbors_dict[state]
    if (len(possible_wrong_answers) > 3):
        possible_wrong_answers = random.sample(possible_wrong_answers, 3)

    distances = bfs(state, state_neighbors_dict)

    if difficulty == 'easy':
        answer = random.choice(list(filter(lambda c: distances[c] >= 4, distances)))
    if difficulty == 'hard':
        answer = random.choice(list(filter(lambda c: distances[c] == 2, distances)))

    choices = possible_wrong_answers + [answer]
    random.shuffle(choices)

    for idx, choice in enumerate(choices):
        s += '\t{0}. {1}\n'.format(chr(idx + 65), choice)

    s += '\nThe answer is {0}. {1}\n'.format(chr(choices.index(answer) + 65), answer)

    return s

if __name__ == '__main__':
    while True:
        print(question(random_state(), 'hard'))
        print('Hit "Enter" for new question. Enter Ctrl + Z to exit.', end='')
        input()