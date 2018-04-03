# World Borders Quiz

The goal of this project is to construct a fun little game that quizzes the player on his or her knowledge of the world's borders through randomly-generated multiple-choice questions.

For example -

* Which of these does not border Iran?

    * A. Iraq
    * B. Israel
    * C. Pakistan
    * D. Turkey

The idea is to have difficulty levels based on graph distance. The above question is relatively difficult, but this one is trivial -

* Which of these does not border Iran?

    * A. Pakistan
    * B. Turkey
    * C. Germany
    * D. Iraq

For variety, there'll also be "Which of these countries borders" questions and some questions with multiple correct answers. Optionally, the player can try their luck with U.S. states.

Personally, I always get flustered when I think about the world's countries (Eastern Europe and Central Africa especially) and what's where in the U.S. east of Arizona, so this will be a great tool to help me practice.

This will first take shape as a simple command-line interface, but will hopefully end up a web application (maybe using Google Maps in some fun way). One reason I've kept the Python code simple is the expectation that I'll be porting it over to Javascript sooner or later.

To get up and going with the project in its current state, open your command prompt and run -

```
git clone https://github.com/danielm00re/world-borders-quiz.git
cd borders-quiz
python borders-quiz.py
```

If you're on Windows and don't have Git and Python installed, get up and going with [Scoop](http://scoop.sh) -

```
powershell Set-ExecutionPolicy RemoteSigned -scope CurrentUser
powershell iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install git python
git clone https://github.com/danielm00re/borders-quiz.git
cd borders-quiz
python borders-quiz.py
```

Some notes on [borders.json](/borders.json) -

* Countries taken from [U.S. Dept. of State](https://www.state.gov/misc/list/index.htm). Omitted Hong Kong and Macau, Timor-Leste used as name for East Timor.
* Borders transcribed from [Wikipedia](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders).
* Malaysia is listed twice. Once as a "land" country that only borders Thailand, another time as an "island" that also borders Indonesia and Brunei.