export default class Game {
  constructor() {
    this.CODE = [];
    this.COLORS = ["red", "green", "blue", "yellow", "purple", "brown"];
  }

  start() {
    // start a game session
    // for (let i = 0; i < 4; i++) {
    //   this.CODE.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
    // }
    this.CODE = ["red", "green", "purple", "brown"];
    console.log("CODE", this.CODE);
  }

  pause() {
    // pause current game
  }

  end() {
    // end game -> maybe with status?
    // win / game over / ...
  }

  /**
   * 
   * @param {ARRAY} guess 
   */
  validateGuess(guess) {
    // guess = ["red", "green", "purple", "brown"];
    guess = ["red", "green", "brown", "red"];
    console.log("GUESS", guess);

    // const result = guess.every((value, index) => value === this.CODE[index]);
    // console.log("guess match:", result);

    // TODO count correct colors (regardless of slot)
    const rightColors = guess.reduce((prev, value, index) => {
      // BUG: counts same color multiple times
      if (this.CODE.includes(value)) {
        console.log(value);
        prev++;
      }
      return prev;
    }, 0);

    console.log("rightColors", rightColors);

    // count correct colors + slots
    const rightGuesses = guess.reduce((prev, value, index) => {
      if (value === this.CODE[index]) {
        prev++;
      }
      return prev;
    }, 0);

    console.log("rightGuesses", rightGuesses);

    // return 
    return rightGuesses < 4 ? rightGuesses : true;
  }


}
