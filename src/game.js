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
    // this.CODE = [ "blue", "yellow", "brown", "green" ];
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
    // guess = ["blue", "green", "green", "blue"];
    console.log("GUESS", guess);
    // DEV ==================


    const nonMatches = guess.filter((item, index) => item !== this.CODE[index]);
    const matches = this.CODE.length - nonMatches.length;
    console.log("matches", matches);

    const gudColors = [
      ...new Set(
        this.CODE.filter((item, index) => {
          return nonMatches.includes(item) && item !== guess[index];
        })
      ),
    ];
    console.log("gudColors", gudColors);

    
    return [matches, gudColors.length];
  }
}
