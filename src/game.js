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
    // // ! DEV ==================
    // guess = [];
    // for (let i = 0; i < 4; i++) {
    //   guess.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
    // }
    // // ! DEV ==================
    
    console.log("GUESS", guess);

/* 
    const test2 = guess.reduce((acc, color, index) => {
      console.log("\n -> ", color, "- position", index);
      if (color === this.CODE[index]) {
        acc[0]++;
        acc[2].push(index);
        console.log(`MATCH for ${color} at index ${index}`);
      } else if (this.CODE.includes(color)) {
        const i = this.CODE.findIndex((val) => val === color);
        console.log(`found ${color} at position ${i} in CODE`);
        
        if (acc[2].includes(i)) {
          console.log(`CODE: "${this.CODE[i]}" with index ${i} was already used`);
          return acc;
        }

        if (guess[i] !== this.CODE[i]) {
          console.log(`"${guess[i]}" and "${this.CODE[i]}" IS NO MATCH -> gud color`);
          acc[1]++;
          acc[2].push(i);
        } else {
          console.log(color, "is a match at", i, "-> skip");
        }
      } else {
        console.log(color, "at position", index, "is not in CODE");
      }

      return acc;
    }, [0, 0, []])
 */


    // TODO: tidy up -> Currently in "debug mode" just in case
    console.groupCollapsed("GUESS VALIDATOR");
    const validationResult = guess.reduce((acc, color, index) => {
      console.log("\n -> ", color, "- position", index);

      if (color === this.CODE[index]) {
        acc.rightGuesses++;
        acc._processedItems.push(index);
        console.log(`MATCH for ${color} at index ${index}`);
      } else if (this.CODE.includes(color)) {
        const i = this.CODE.findIndex((val) => val === color);
        console.log(`found ${color} at position ${i} in CODE`);
        
        if (acc._processedItems.includes(i)) {
          console.log(`CODE: "${this.CODE[i]}" with index ${i} was already used`);
          // remove "_processedItems" as its only used internally
          if (index + 1 === guess.length) {
            delete acc._processedItems;
          }
          return acc;
        }

        if (guess[i] !== this.CODE[i]) {
          console.log(`"${guess[i]}" and "${this.CODE[i]}" IS NO MATCH -> gud color`);
          acc.goodColors++;
          acc._processedItems.push(i);
        } else {
          console.log(color, "is a match at", i, "-> skip");
        }
      } else {
        console.log(color, "at position", index, "is not in CODE");
      }

      // remove "_processedItems" as its only used internally
      if (index + 1 === guess.length) {
        delete acc._processedItems;
      }

      return acc;
    }, { rightGuesses: 0, goodColors: 0, _processedItems: [] });
    
    console.log(validationResult);
    console.groupEnd("GUESS VALIDATOR");




/* 
    const test = [];
    guess.forEach((element, index) => {
      test.push([this.CODE[index], element])
    });
    // console.log("original", test);

    const res = test.reduce((acc, value, index) => {
      if (value[0] === value[1]) {
        
      } else if (this.CODE.includes(value)) {

      }

      return acc;
    }, [0, 0])
 */
    // console.log("result", test, res);






/* 
    const nonMatches = guess.filter((color, index) => color !== this.CODE[index]);
    const matches = this.CODE.length - nonMatches.length;
    // console.log(nonMatches);
    // console.log("matches", matches);

    // const gudColors = this.CODE.filter((color, index) => {
    //   return nonMatches.includes(color) && color !== guess[index];
    // });

    const gudColors = nonMatches.filter((color, index) => {
      return this.CODE.includes(color) && nonMatches[index] !== this.CODE[index];
    });
    // console.log("gudColors", gudColors);
 */
    
    return validationResult;
  }
}
