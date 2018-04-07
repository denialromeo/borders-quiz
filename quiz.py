import argparse, collections, json, random, re, subprocess, sys

def get_args():
    parser = argparse.ArgumentParser(description='A fun quiz!')
    parser.add_argument('--states', help='Try your luck with U.S. states!', action='store_true')
    parser.add_argument('--countries', help='The nations of the world!', action='store_true')
    parser.add_argument('--restrict-to', help='Pass in territories to ask questions for as comma-delimited string.')
    return parser.parse_args(sys.argv[1:])

def open_google_maps(state):
    l = '+'.join("https://www.google.com/maps/search/{0}".format(state).strip().split(' ')).replace("'","")
    subprocess.run(['powershell', 'start-process', l])

def state_neighbors_dict():
    with open('borders.json') as data_file:
        data = json.load(data_file)
        args = get_args()
        if args.countries and args.states:
            return { **data['countries'], **data['states'] }
        elif args.states:
            return data['states']
        elif args.countries:
            return data['countries']
        else: # Default behavior
            return { **data['countries'], **data['states'] }

def random_state(state_neighbors_dict=state_neighbors_dict()):
    return random.choice(list(state_neighbors_dict))

def exclude_neighbor_from_search(state, neighbor):
    # China and Russia make the "graph distance" difficulty mechanic a little pointless.
    # If India and Poland are just three countries apart (India → China → Russia → Poland),
    # a "hard" question asking if they border each other is a bit too easy.
    #
    # So China and Russia are removed from graph searches except when started from countries which
    # exclusively border China and/or Russia.
    keep_china_russia = ['Finland', 'Sweden', 'Norway', 'Mongolia', 'North Korea', 'South Korea']
    return neighbor in ['China', 'Russia'] and state not in keep_china_russia

# bfs stands for "breadth-first search". Google this if unfamiliar.
def bfs(state, state_neighbors_dict=state_neighbors_dict()):
    state_distance_dict = {state: 0}
    bfs_queue = collections.deque([state])
    while bfs_queue:
        v = bfs_queue.popleft()
        for neighbor in state_neighbors_dict[v]:
            if neighbor not in state_distance_dict:
                state_distance_dict[neighbor] = state_distance_dict[v] + 1
                if not exclude_neighbor_from_search(state, neighbor):
                    bfs_queue.append(neighbor)
    return state_distance_dict

def question(state, difficulty, state_neighbors_dict=state_neighbors_dict()):

    # Trailing spaces are stripped because Georgia the country is "Georgia" while Georgia the state is "Georgia ".
    possible_wrong_answers = [w.strip() for w in state_neighbors_dict[state]]
    num_wrong_answers = 3
    if (len(possible_wrong_answers) > num_wrong_answers):
        wrong_answers = [w for w in random.sample(possible_wrong_answers, num_wrong_answers)]
    else:
        wrong_answers = possible_wrong_answers
    unchosen_wrong_answers = [w for w in possible_wrong_answers if w not in wrong_answers]

    state_distance_dict = bfs(state, state_neighbors_dict)
    possible_answers = None
    if difficulty == 'easy':
        possible_answers = [state for state in state_distance_dict if state_distance_dict[state] >= 4]
    if difficulty == 'hard':
        possible_answers = [state for state in state_distance_dict if state_distance_dict[state] == 2]
    if not possible_answers:
        possible_answers = list(state_neighbors_dict)
    answer = random.choice(possible_answers).strip()

    choices = wrong_answers + [answer]
    random.shuffle(choices)

    s = '\nWhich of these does not border {0}?\n\n'.format(state.strip())

    for idx, choice in enumerate(choices):
        s += '\t{0}. {1}\n'.format(chr(idx + 65), choice)

    s += '\nThe answer is {0}. {1}\n'.format(chr(choices.index(answer) + 65), answer)

    s += '\n{0} also borders {1}\n'.format(state.strip(), unchosen_wrong_answers)

    return s

if __name__ == '__main__':
    args = get_args()
    while True:
        state = random_state() if not args.restrict_to else random.choice(args.restrict_to.split(','))
        print(question(state, 'hard'))
        i = input('Hit "Enter" for new question. Enter "m" to see {0} on Google Maps. "q" to quit.'.format(state.strip()))
        if i == 'm':
            open_google_maps(state)
        elif i == 'q':
            break