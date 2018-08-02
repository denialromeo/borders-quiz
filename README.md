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

Adding a quiz is simple. Just add relevant entries to [borders.json](/borders-quiz/json/borders.json) and [quiz_modes.json](/borders-quiz/json/quiz_modes.json). You can also play with some (optional) settings in [game-settings.json](/borders-quiz/json/game-settings.json) that enhance the player's experience (e.g. more precise maps, prepending "the", manually giving tougher answer choices than the default algorithm).

However, you must observe these rules or the game will break -

* The top-level labels of borders.json and quiz_modes.json *must* match.
* All entries in borders.json *must* be unique. Add trailing underscores when needed to avoid conflicts with entries in existing quiz modes.
* If a territory is on an island and borders every other territory on that island (e.g. Haiti and the Dominican Republic), you *must* manually provide alternative answer choices in [question-settings.json](/borders-quiz/json/settings.json) or the game will break.

You can search public fusion table data [here](https://research.google.com/tables?source=ft2573812&corpus=fusion), find U.S. data [here](https://support.google.com/fusiontables/answer/1182141?hl=en), and find world state/province level data [here](https://fusiontables.google.com/DataSource?docid=1uK6JhwbCLeJWmTmoWTIKFOmdZuTxhfeT_Gy05QXy).

Note that you can also create custom quizzes by playing with the URL. Examples -

* [India, Pakistan, and Bangladesh](http://danielmoore.us/borders-quiz?custom=India|Pakistan|Bangladesh)
* [Countries that end with "stan"](http://danielmoore.us/borders-quiz?custom=stan$)
* [Country quiz excluding bodies of water](http://danielmoore.us/borders-quiz?custom=^(?!.*Sea|Gulf|Bay))
* [U.S. states that don't contain the letters 'a' or 'e'](http://danielmoore.us/borders-quiz?usa-states&custom=%5E(?!.*[ae]))
* [Turkey, its neighboring countries, and the neighbors of its neighbors](http://danielmoore.us/borders-quiz?start=Turkey&depth=2)
* [Canada and neighboring U.S. states](http://danielmoore.us/borders-quiz?start=Canada_)
* [The Persian Gulf and neighboring countries](http://danielmoore.us/borders-quiz?start=Persian+Gulf)
* [Countries in Africa](http://danielmoore.us/borders-quiz?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco)
