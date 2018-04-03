# World Borders Quiz

The goal of this project is to construct a fun little game that quizzes the player on his or her knowledge of the world's borders through randomly-generated multiple-choice questions.

For example -

* Which of these countries does not border Iran?

    * A. Iraq
    * B. Israel
    * C. Pakistan
    * D. Turkey

The idea is to have difficulty levels based on graph distance. The above question is relatively difficult, but this one is trivial -

* Which of these countries does not border Iran?

    * A. Pakistan
    * B. Turkey
    * C. Brazil
    * D. Iraq

For variety, there'll also be "Which of these countries borders" questions and some questions with multiple correct answers. Optionally, the player can also include island countries and their maritime borders.

Personally, I always get flustered when I think about the world's countries (Eastern Europe and Central Africa especially), so this will be a great tool to help me practice.

This will first take shape as a simple command-line interface, but will hopefully end up a web application (maybe using Google Maps in some fun way).

To get up and going with the project in its current state, open your command prompt and run -

```
git clone https://github.com/danielm00re/world-borders-quiz.git
cd world-borders-quiz
python world-borders-quiz.py
```

If you're on Windows and don't have Git and Python installed, get up and going with Scoop -

```
powershell Set-ExecutionPolicy RemoteSigned -scope CurrentUser
powershell iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install git python
git clone https://github.com/danielm00re/world-borders-quiz.git
cd world-borders-quiz
python world-borders-quiz.py
```

Some notes on the data in [borders.json](/borders.json) -

* Countries taken from [U.S. Dept. of State](https://www.state.gov/misc/list/index.htm). Omitted Hong Kong and Macau, Timor-Leste used as name for East Timor.
* Borders transcribed from [Wikipedia](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders).

Fun dev realizations -

* I separated countries into islands and non-islands under the assumption that every non-island in either the old or new world was in a connected, complete graph.

    Turns out Malaysia breaks this rule. Malaysia isn't an island, but half of it's overseas on the island of Borneo! So to make this work, I've had to have two definitions for Malaysia. One as a continental country where it only borders Thailand, and another as an island where it also borders Indonesia and Brunei.

* China and Russia make the "graph distance" difficulty mechanic a little pointless. If India and Poland are just three countries apart (India &rarr; China &rarr; Russia &rarr; Poland), a "Hard" question asking if they border each other is a bit too easy.

    So China and Russia are removed from graph searches except when started from the Koreas, Mongolia, and Scandinavia (which exclusively border China and/or Russia).