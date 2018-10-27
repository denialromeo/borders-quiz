# World Borders Quiz

This game tests the player's knowledge of the world's borders through randomly generated multiple-choice questions.

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

Now you can play the game at [http://localhost:8000](http://localhost:8000)!

## Development Guide

Adding a quiz is simple. Just add relevant entries to [borders.json](/build-question/borders.json) and [quiz-modes.json](/game/quiz-modes.json). You can also play with some settings in [game-settings.json](/game/game-settings.json) (e.g. more precise maps, prepending "the").

However, you must observe these rules or the game will break -

* The top-level labels of [borders.json](/build-question/borders.json) and [quiz-modes.json](/game/quiz-modes.json) *must* match.
* All entries in [borders.json](/build-question/borders.json) *must* be unique. Add trailing underscores to avoid conflicts with entries in existing quiz modes.
* If a territory is on an island and borders every other territory on that island (e.g. Haiti and the Dominican Republic), you *must* manually provide alternative answer choices in [question-settings.json](/build-question/question-settings.json).

(Running `npm test` will alert you to game-breaking data.)

You can find U.S. fusion table data [here](https://support.google.com/fusiontables/answer/1182141?hl=en), official U.S. Census Bureau KML data [here](https://www.census.gov/geo/maps-data/data/tiger-kml.html), world state/province level data [here](https://fusiontables.google.com/DataSource?docid=1uK6JhwbCLeJWmTmoWTIKFOmdZuTxhfeT_Gy05QXy), and world physical geography fusion table data [here](https://fusiontables.google.com/DataSource?classic=true&docid=1UGwYogqtxVPga_76rxpL38CO1U6tr2s6Z0wSaQ).

Note that you can also create custom quizzes by playing with the URL. Examples -

* [Countries that end with "stan"](http://danielmoore.us/borders-quiz?custom=stan$)
* [Country quiz excluding bodies of water](http://danielmoore.us/borders-quiz?custom=^(?!.*(Sea|Gulf|Bay|Strait|Lake|Channel|Ocean|Rio|Bight)\b))
* [Country quiz with two answer choices](http://danielmoore.us/borders-quiz?num-choices=2)
* [Countries in Africa](http://danielmoore.us/borders-quiz?start=Guinea&depth=100&exclude-paths-through=Egypt;Morocco)
* [U.S. states that don't contain the letters 'a' or 'e'](http://danielmoore.us/borders-quiz?usa-states&custom=^(?!.*[ae]))
* [Canada and neighboring U.S. states](http://danielmoore.us/borders-quiz?start=Canada_)
* [New York City boroughs starting with map](http://danielmoore.us/borders-quiz?new-york-counties&start-map=New+York+City&start-zoom=9&custom=Brooklyn|Bronx|Manhattan|Queens)
* [San Francisco Bay Area counties starting with map](http://danielmoore.us/borders-quiz?california-counties&start=San+Francisco+Bay&exclude=San+Francisco+Bay&start-map=San+Francisco+Bay)
* [Southern California counties](http://danielmoore.us/borders-quiz?california-counties&start=Orange;Santa+Barbara&include=Imperial)
* [India's Punjab and Pakistan's Punjab](http://danielmoore.us/borders-quiz?india-states&pakistan-provinces&custom=Punjab)

(Github has encoded the above URL's for security. To see them in a more readable form, check the [raw version](https://raw.githubusercontent.com/denialromeo/borders-quiz/master/README.md) of this README.)

## Known Bugs

* Territory names in more recent quiz modes aren't properly abbreviated on mobile.

* The game doesn't work on Microsoft Edge. This is because Edge doesn't yet support the HTML5 iframe `srcdoc` attribute. (Bug report [here](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12375527/).) Microsoft will fix it sooner or later.

    (This problem can be fixed by replacing the iframe with a div (see branch `replace-iframe-with-div`), but iframes are just much more convenient to embed in external websites.)

## Inspiration

The idea for this project was taken from this beautiful diagram in [*Algorithms*](https://www.amazon.com/Algorithms-Sanjoy-Dasgupta-ebook/dp/B006Z0QR3I/ref=sr_1_1_twi_kin_1?ie=UTF8&qid=1534812555&sr=8-1) by Dasgupta, Papadimitriou, and Vazirani.

![](inspiration.png)
