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

For variety, there'll also be "Which of these countries borders" questions and the occasional question with multiple correct answers, just to keep the reader on their toes.

Personally, I'm always getting flustered when I think about the world's countries (Eastern Europe and Central Africa give me particular trouble), so this will be a great tool to help me practice.

This will first take shape as a simple command-line interface, but will hopefully end up a web application (maybe using Google Maps in some fun way).

Some notes on the data in [borders.json](/borders.json) -

* List of countries taken from [U.S. Dept. of State](https://www.state.gov/misc/list/index.htm). Omitted Hong Kong and Macau, Timor-Leste used as name for East Timor.
* Borders transcribed from [Wikipedia](https://en.wikipedia.org/wiki/List_of_countries_and_territories_by_land_and_maritime_borders).
* Island countries' maritime borders are stored separately from non-island country data. However, where an island has a land border with another country (e.g. the UK and Ireland), it's stored with the regular data.