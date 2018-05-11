# Borders Quiz 

This is a fun little game that quizzes the player on his or her knowledge of the world's borders through randomly-generated multiple-choice questions.

For example -

* Which of these does not border Belize?

    * A. Mexico
    * B. Guatemala
    * C. Honduras

(The answer is Honduras.)

You can presently hone your geography knowledge of -

* World countries.
* U.S. states.
* Canada's provinces.
* Mexico's states.
* India's states.
* China's provinces.
* Japan's prefectures.
* South Korea's provinces.
* Australia's states.

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

Some notes on [borders.json](/borders-quiz/json/borders.json) -

* Country borders transcribed from [Wikipedia](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders).
* Whenever there's a chance multiple territories with the same name will be in the same quiz (e.g. Mexico as bordering Arizona, Mexico as bordering Guatemala), they're distinguished between by different numbers of trailing underscores (e.g. "Mexico" vs. "Mexico_"). Underscores are stripped when presented to the user.