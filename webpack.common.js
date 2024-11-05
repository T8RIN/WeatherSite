const path = require('path');

module.exports = {
  entry: {
    app: './js/app.js',
    translationsJson: "./js/translationsJson.js"
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: './js/app.js',
  },
};
