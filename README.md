# Borders Quiz

The goal of this project is to construct a fun little game that quizzes the player on his or her knowledge of the world's borders and U.S. state borders through randomly-generated multiple-choice questions.

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

Personally, I always get flustered when I think about the world's countries (Eastern Europe and Central Africa especially) and what's where in the U.S. east of Arizona, so this will be a great tool to help me practice.

This will first take shape as a simple command-line prototype, but will hopefully end up a web application.

To get up and going with the project in its current state, open your command prompt and run -

```
git clone https://github.com/danielm00re/borders-quiz.git
cd borders-quiz
python quiz.py --help
python quiz.py --countries --states --restrict-to "India,United States,Cote d'Ivoire,California"
python quiz.py --countries --states --restrict-to "Georgia ,Georgia"
```

If you're on Windows and don't have Git and Python installed, quickly install them through [Scoop](http://scoop.sh) -

```
powershell Set-ExecutionPolicy RemoteSigned -scope CurrentUser
powershell iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install git python
```

Some notes on [borders.json](/borders.json) -

* Countries taken from [U.S. Dept. of State](https://www.state.gov/misc/list/index.htm). Omitted Hong Kong and Macau, Timor-Leste used as name for East Timor.
* Borders transcribed from [Wikipedia](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders).
* Whenever there's a chance two territories with the same name will be in the same quiz (e.g. the two Georgias, Mexico as bordering Arizona, Mexico as bordering Belize), one is listed with a trailing space (e.g. "Georgia " vs. "Georgia") so borders-quiz can distinguish between them. Trailing spaces are stripped when presented to the user.