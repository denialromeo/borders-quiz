module.exports = {
  // webpack folder's entry js - excluded from jekll's build process, since the compiled version is what we'll use in the DOM.
  entry: "./borders-quiz/js/main.js",
  output: {
    // put the generated file in the assets folder so jekyll will grab it.
      path: __dirname + "/js",
      filename: "bundle.js"
  }
};
