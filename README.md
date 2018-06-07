# Borders Quiz 

This game tests the player's knowledge of the world's borders through procedurally generated multiple-choice questions.

For example -

* Which of these does not border Belize?

    * A. Mexico
    * B. Guatemala
    * C. Honduras

(The answer is Honduras.)

## Installation

To play with this, all you have to do is start `index.html` on a local server!

Here's how to do this using Jekyll.

```
git clone https://github.com/danielm00re/borders-quiz.git
cd borders-quiz
jekyll serve --port 4000
```

Now you can play the game at `http://localhost:4000`!

To install Jekyll using [Scoop](http://scoop.sh) (I assume you're using Windows.) -

```
powershell Set-ExecutionPolicy RemoteSigned -scope CurrentUser
powershell iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
scoop install ruby
exit
```

```
gem install jekyll
```

The game can also be played on my website [here](http://danielmoore.us/borders-quiz). The version of the game on my website will always be the most updated, though I'll try to update this repo as well if I make any major changes.

## Development Guide

Adding a quiz is simple. Just add relevant entries to [borders.json](/borders-quiz/json/borders.json) and [quiz_modes.json](/borders-quiz/json/quiz_modes.json). You can also play with some (optional) settings in [settings.json](/borders-quiz/json/settings.json) that enhance the player's experience (e.g. more precise maps, prepending "the", manually giving tougher answer choices than the default algorithm).

However, you must observe these rules or the game will break -

* The top-level labels of borders.json and quiz_modes.json *must* match.
* All entries in borders.json *must* be unique. Add trailing underscores when needed to avoid conflicts with entries in existing quiz modes.
* If a territory is on an island and borders every other territory on that island (e.g. Haiti and the Dominican Republic), you *must* manually provide alternative answer choices in [settings.json](/borders-quiz/json/settings.json) or the game will break.

You can search public fusion table data [here](https://research.google.com/tables?source=ft2573812&corpus=fusion), find U.S. data [here](https://support.google.com/fusiontables/answer/1182141?hl=en), and find world state/province level data [here](https://fusiontables.google.com/DataSource?docid=1uK6JhwbCLeJWmTmoWTIKFOmdZuTxhfeT_Gy05QXy).

Open a pull request and contribute a quiz (adding to [borders.json](/borders-quiz/json/borders.json) is enough), and I'll credit you on my website!

## Known Bugs

* Long territory names in more recent quiz modes aren't appropriately abbreviated on mobile, resulting in text overlap.