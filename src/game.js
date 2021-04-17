export default class Game {
  constructor() {
    this.CODE = [];
    this.COLORS = ["red", "green", "blue", "yellow", "purple", "brown"];
  }

  start() {
    // start a game session
    for (let i = 0; i < 4; i++) {
      this.CODE.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
    }
    this.CODE = [ "yellow", "red", "red", "yellow" ];
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
    // DEV ==================
    guess = [];
    for (let i = 0; i < 4; i++) {
      guess.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
    }
    // guess = ["red", "green", "green", "red"];
    console.log("GUESS", guess);
    // DEV ==================


    const nonMatches = guess.filter((color, index) => color !== this.CODE[index]);
    const matches = this.CODE.length - nonMatches.length;
    console.log("matches", matches);

    // const gudColors = this.CODE.filter((color, index) => {
    //   return nonMatches.includes(color) && color !== guess[index];
    // });
    
    const gudColors = nonMatches.filter((color, index) => {
      return this.CODE.includes(color)/* && color !== this.CODE[index]*/;
    });
    console.log("gudColors", gudColors);

    
    return [matches, gudColors.length];
  }
}
