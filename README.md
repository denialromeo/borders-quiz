# World Borders Quiz

This game tests the player's knowledge of the world's borders through procedurally generated multiple-choice questions.

For example -

* Which of these does not border Belize?

    * A. Mexico
    * B. Guatemala
    * C. Honduras

(The answer is Honduras.)

Try it [here](http://danielmoore.us/borders-quiz)!

## Installation

Just install [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/en/), then open your command prompt and run -

```
git clone https://github.com/denialromeo/borders-quiz
cd borders-quiz
npm install
npm start
```

Now you can play the game at [http://localhost:8080](http://localhost:8080)!

## Development Guide

Adding a quiz is simple. Just add relevant entries to [borders.json](/borders-quiz/build-question/borders.json) and [quiz-modes.json](/borders-quiz/game/quiz-modes.json). You can also play with some settings in [game-settings.json](/borders-quiz/game/game-settings.json) (e.g. more precise maps, prepending "the", manually giving tougher answer choices than the default algorithm).

However, you must observe these rules or the game will break -

* The top-level labels of [borders.json](/borders-quiz/build-question/borders.json) and [quiz-modes.json](/borders-quiz/game/quiz-modes.json) *must* match.
* All entries in [borders.json](/borders-quiz/build-question/borders.json) *must* be unique. Add trailing underscores to avoid conflicts with entries in existing quiz modes.
* If a territory is on an island and borders every other territory on that island (e.g. Haiti and the Dominican Republic), you *must* manually provide alternative answer choices in [question-settings.json](/borders-quiz/build-question/question-settings.json).

You can search public fusion table data [here](https://research.google.com/tables?source=ft2573812&corpus=fusion), find U.S. KML data [here](https://www.census.gov/geo/maps-data/data/tiger-cart-boundary.html), and find world state/province level data [here](https://fusiontables.google.com/DataSource?docid=1uK6JhwbCLeJWmTmoWTIKFOmdZuTxhfeT_Gy05QXy).

Note that you can also create custom quizzes by playing with the URL. Examples -

* [India, Pakistan, and Bangladesh](http://danielmoore.us/borders-quiz?custom=India|Pakistan|Bangladesh)
* [Countries that end with "stan"](http://danielmoore.us/borders-quiz?custom=stan$)
* [Country quiz excluding bodies of water](http://danielmoore.us/borders-quiz?custom=^(?!.*Sea|Gulf|Bay|Strait))
* [U.S. states that don't contain the letters 'a' or 'e'](http://danielmoore.us/borders-quiz?usa-states&custom=%5E(?!.*[ae]))
* [Turkey, its neighboring countries, and the neighbors of its neighbors](http://danielmoore.us/borders-quiz?start=Turkey&depth=2)
* [Canada and neighboring U.S. states](http://danielmoore.us/borders-quiz?start=Canada_)
* [The Persian Gulf and neighboring countries](http://danielmoore.us/borders-quiz?start=Persian+Gulf)
* [Countries in Africa](http://danielmoore.us/borders-quiz?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco)
* [San Francisco Bay Area counties](http://danielmoore.us/borders-quiz?start=San+Francisco+Bay)

## Known Bugs

* Territory names in more recent quiz modes aren't properly abbreviated on mobile.

* The game doesn't work on Microsoft Edge. This is because Edge doesn't yet support the HTML5 iframe `srcdoc` attribute. (Bug report [here](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12375527/).) Microsoft will fix it sooner or later.