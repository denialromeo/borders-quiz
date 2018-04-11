import argparse, collections, json, random, re, subprocess, sys

def get_args():
    parser = argparse.ArgumentParser(description='A fun quiz!')
    parser.add_argument('--states', help='Try your luck with U.S. states!', action='store_true')
    parser.add_argument('--countries', help='The nations of the world!', action='store_true')
    parser.add_argument('--restrict-to', help='Pass in territories to ask questions for as comma-delimited string.')
    return parser.parse_args(sys.argv[1:])

def open_google_maps(territory):
    l = '+'.join("https://www.google.com/maps/search/{}".format(territory).strip().split(' ')).replace("'","")
    subprocess.run(['powershell', 'start-process', l])

def is_complete_graph(vertex_neighbors_dict):
    for v in vertex_neighbors_dict:
        for n in vertex_neighbors_dict[v]:
            if v not in vertex_neighbors_dict[n]:
                print('{} is not in {}\'s neighbors!'.format(v, n))

def territory_neighbors_dict():
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

def random_territory(territory_neighbors_dict=territory_neighbors_dict()):
    return random.choice(list(territory_neighbors_dict))

def should_exclude_neighbor_from_search(territory, neighbor):
    # China and Russia make the "graph distance" difficulty mechanic a little pointless.
    # If India and Poland are just three countries apart (India → China → Russia → Poland),
    # a "hard" question asking if they border each other is a bit too easy.
    #
    # So China and Russia are removed from graph searches except when started from countries which
    # exclusively border China and/or Russia.
    if neighbor in ['China', 'Russia']:
        keep_china_russia = ['Finland', 'Sweden', 'Norway', 'Mongolia', 'North Korea', 'South Korea']
        if territory not in keep_china_russia:
            return True
    # Likewise for Canada and Mexico when called from a U.S. state. Washington and Maine both border Canada,
    # but are on opposite sides of the country.
    if neighbor in ['Canada ', 'Mexico ']:
        return True

# bfs stands for "breadth-first search". Google this if unfamiliar.
def bfs(territory, territory_neighbors_dict=territory_neighbors_dict()):
    territory_distance_dict = {territory: 0}
    bfs_queue = collections.deque([territory])
    while bfs_queue:
        v = bfs_queue.popleft()
        for neighbor in territory_neighbors_dict[v]:
            if neighbor not in territory_distance_dict:
                territory_distance_dict[neighbor] = territory_distance_dict[v] + 1
                if not should_exclude_neighbor_from_search(territory, neighbor):
                    bfs_queue.append(neighbor)
    return territory_distance_dict

def question(territory, difficulty, territory_neighbors_dict=territory_neighbors_dict()):
    possible_wrong_answers = [w.strip() for w in territory_neighbors_dict[territory]]
    num_wrong_answers = 3
    if (len(possible_wrong_answers) > num_wrong_answers):
        wrong_answers = [w for w in random.sample(possible_wrong_answers, num_wrong_answers)]
    else:
        wrong_answers = possible_wrong_answers
    unchosen_wrong_answers = [w for w in possible_wrong_answers if w not in wrong_answers]

    territory_distance_dict = bfs(territory, territory_neighbors_dict)
    possible_answers = None
    if difficulty == 'easy':
        possible_answers = [territory for territory in territory_distance_dict if territory_distance_dict[territory] >= 4]
    if difficulty == 'hard':
        possible_answers = [territory for territory in territory_distance_dict if territory_distance_dict[territory] == 2]
    if not possible_answers:
        possible_answers = list(territory_neighbors_dict)
    answer = random.choice(possible_answers).strip()

    choices = wrong_answers + [answer]
    random.shuffle(choices)

    s = '\nWhich of these does not border {}?\n\n'.format(territory.strip())

    for idx, choice in enumerate(choices):
        s += '\t{}. {}\n'.format(chr(idx + 65), choice)

    s += '\nThe answer is {}. {}\n'.format(chr(choices.index(answer) + 65), answer)

    s += '\n{} also borders {}'.format(territory.strip(), unchosen_wrong_answers)

    return s

if __name__ == '__main__':
    args = get_args()
    while True:
        territory = random_territory() if not args.restrict_to else random.choice(args.restrict_to.split(','))
        print(question(territory, 'hard'))
        quit = False
        while True:
            i = input('\nEnter n for next question, m to see {} on Google Maps, q to quit. '.format(territory.strip())).strip()
            if i == 'm':
                open_google_maps(territory)
            elif i in ['', 'n']:
                break
            elif i == 'q':
                quit = True
                break
            else:
                continue
        if quit:
            break