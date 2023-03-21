//added for fun, made originally by Ilyas Reese. Added my own original syntax


Function.prototype.bind =
  Function.prototype.bind ||
  function (target) {
    let self = this;
    return function (args) {
      if (!(args instanceof Array)) {
        args = [args];
      }
      self.apply(target, args);
    };
  };
(function () {
  if (
    typeof window.Element === "undefined" ||
    "classList" in document.documentElement
  ) {
    return;
  }

  let prototype = Array.prototype,
    push = prototype.push,
    splice = prototype.splice,
    join = prototype.join;

  class DOMTokenList {
    constructor(el) {
      this.el = el;
      // The className needs to be trimmed and split on whitespace
      // to retrieve a list of classes.
      let classes = el.className.replace(/^\s+|\s+$/g, "").split(/\s+/);
      for (let i = 0; i < classes.length; i++) {
        push.call(this, classes[i]);
      }
    }
    add(token) {
      if (this.contains(token))
        return;
      push.call(this, token);
      this.el.className = this.toString();
    }
    contains(token) {
      return this.el.className.indexOf(token) != -1;
    }
    item(index) {
      return this[index] || null;
    }
    remove(token) {
      if (!this.contains(token))
        return;
      for (let i = 0; i < this.length; i++) {
        if (this[i] == token)
          break;
      }
      splice.call(this, i, 1);
      this.el.className = this.toString();
    }
    toString() {
      return join.call(this, " ");
    }
    toggle(token) {
      if (!this.contains(token)) {
        this.add(token);
      } else {
        this.remove(token);
      }

      return this.contains(token);
    }
  }


  window.DOMTokenList = DOMTokenList;

  function defineElementGetter(obj, prop, getter) {
    if (Object.defineProperty) {
      Object.defineProperty(obj, prop, {
        get: getter,
      });
    } else {
      obj.__defineGetter__(prop, getter);
    }
  }

  defineElementGetter(HTMLElement.prototype, "classList", function () {
    return new DOMTokenList(this);
  });
})();
(function () {
  let lastTime = 0;
  let vendors = ["webkit", "moz"];
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
    window.cancelAnimationFrame =
      window[vendors[x] + "CancelAnimationFrame"] ||
      window[vendors[x] + "CancelRequestAnimationFrame"];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback, element) {
      let currTime = new Date().getTime();
      let timeToCall = Math.max(0, 16 - (currTime - lastTime));
      let id = window.setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
})();
class KeyboardInputManager {
  constructor() {
    this.events = {};

    if (window.navigator.msPointerEnabled) {
      //Internet Explorer 10 style
      this.eventTouchstart = "MSPointerDown";
      this.eventTouchmove = "MSPointerMove";
      this.eventTouchend = "MSPointerUp";
    } else {
      this.eventTouchstart = "touchstart";
      this.eventTouchmove = "touchmove";
      this.eventTouchend = "touchend";
    }

    this.listen();
  }
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  emit(event, data) {
    let callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(function (callback) {
        callback(data);
      });
    }
  }
  listen() {
    let self = this;

    let map = {
      38: 0,
      39: 1,
      40: 2,
      37: 3,
      75: 0,
      76: 1,
      74: 2,
      72: 3,
      87: 0,
      68: 1,
      83: 2,
      65: 3, // A
    };

    // Respond to direction keys
    document.addEventListener("keydown", function (event) {
      let modifiers = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      let mapped = map[event.which];

      // Ignore the event if it's happening in a text field
      if (self.targetIsInput(event))
        return;

      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          self.emit("move", mapped);
        }
      }

      // R key restarts the game
      if (!modifiers && event.which === 82) {
        self.restart.call(self, event);
      }
    });

    // Respond to button presses
    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);

    // Respond to swipe events
    let touchStartClientX, touchStartClientY;
    let gameContainer = document.getElementsByClassName("game-container")[0];

    gameContainer.addEventListener(this.eventTouchstart, function (event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches > 1 ||
        self.targetIsInput(event)) {
        return; // Ignore if touching with more than 1 finger or touching input
      }

      if (window.navigator.msPointerEnabled) {
        touchStartClientX = event.pageX;
        touchStartClientY = event.pageY;
      } else {
        touchStartClientX = event.touches[0].clientX;
        touchStartClientY = event.touches[0].clientY;
      }

      event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchmove, function (event) {
      event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchend, function (event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches > 0 ||
        self.targetIsInput(event)) {
        return; // Ignore if still touching with one or more fingers or input
      }

      let touchEndClientX, touchEndClientY;

      if (window.navigator.msPointerEnabled) {
        touchEndClientX = event.pageX;
        touchEndClientY = event.pageY;
      } else {
        touchEndClientX = event.changedTouches[0].clientX;
        touchEndClientY = event.changedTouches[0].clientY;
      }

      let dx = touchEndClientX - touchStartClientX;
      let absDx = Math.abs(dx);

      let dy = touchEndClientY - touchStartClientY;
      let absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 10) {
        // (right : left) : (down : up)
        self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0);
      }
    });
  }
  restart(event) {
    event.preventDefault();
    this.emit("restart");
  }
  keepPlaying(event) {
    event.preventDefault();
    this.emit("keepPlaying");
  }
  bindButtonPress(selector, fn) {
    let button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
  }
  targetIsInput(event) {
    return event.target.tagName.toLowerCase() === "input";
  }
}







function HTMLActuator() {
  this.tileContainer = document.querySelector(".tile-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.bestContainer = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  let self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }
  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

//HTMLActuator.prototype.tileHTML = ["菜鸟", "入门", "码畜", "码奴", "码农", "IT民工", "IT工程师", "IT人才", "IT精英", "IT大哥", "IT领袖"];
HTMLActuator.prototype.tileHTML = [
  "2",
  "4",
  "8",
  "16",
  "32",
  "64",
  "128",
  "256",
  "512",
  "1024",
  "2048",
];
//HTMLActuator.prototype.tileHTML = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "win"];
//HTMLActuator.prototype.tileHTML = ["工兵", "班长", "排长", "连长", "营长", "团长", "旅长", "师长", "军长", "司令", "军旗"];

HTMLActuator.prototype.addTile = function (tile) {
  let self = this;

  let wrapper = document.createElement("div");
  let inner = document.createElement("div");
  let position = tile.previousPosition || { x: tile.x, y: tile.y };
  let positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  let classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent =
    HTMLActuator.prototype.tileHTML[Math.log(tile.value) / Math.LN2 - 1] ||
    tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  let difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    let addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  let type = won ? "game-won" : "game-over";
  let message = won ? "You Win!" : "Game Over!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  //twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  let tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-via", "gabrielecirulli");
  tweet.setAttribute("data-url", "https://git.io/2048");
  tweet.setAttribute(
    "data-counturl",
    "https://gabrielecirulli.github.io/2048/"
  );
  tweet.textContent = "Tweet";

  let text =
    "I scored " +
    this.score +
    " points at 2048, a game where you " +
    "join numbers to score high! #2048game";
  tweet.setAttribute("data-text", text);

  return tweet;
};
function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function () {
  let cells = [];

  for (let x = 0; x < this.size; x++) {
    let row = (cells[x] = []);

    for (let y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  let cells = [];

  for (let x = 0; x < this.size; x++) {
    let row = (cells[x] = []);

    for (let y = 0; y < this.size; y++) {
      let tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  let cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  let cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return (
    position.x >= 0 &&
    position.x < this.size &&
    position.y >= 0 &&
    position.y < this.size
  );
};

Grid.prototype.serialize = function () {
  let cellState = [];

  for (let x = 0; x < this.size; x++) {
    let row = (cellState[x] = []);

    for (let y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState,
  };
};
class Tile {
  constructor(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;

    this.previousPosition = null;
    this.mergedFrom = null; // Tracks tiles that merged together
  }
  savePosition() {
    this.previousPosition = { x: this.x, y: this.y };
  }
  updatePosition(position) {
    this.x = position.x;
    this.y = position.y;
  }
  serialize() {
    return {
      position: {
        x: this.x,
        y: this.y,
      },
      value: this.value,
    };
  }
}



window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return (this._data[id] = String(val));
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return (this._data = {});
  },
};

class LocalStorageManager {
  constructor() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";

    let supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
  }
  localStorageSupported() {
    let testKey = "test";
    let storage = window.localStorage;

    try {
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  // Best score getters/setters
  getBestScore() {
    return this.storage.getItem(this.bestScoreKey) || 0;
  }
  setBestScore(score) {
    this.storage.setItem(this.bestScoreKey, score);
  }
  // Game state getters/setters and clearing
  getGameState() {
    let stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  }
  setGameState(gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  }
  clearGameState() {
    this.storage.removeItem(this.gameStateKey);
  }
}






class GameManager {
  constructor(size, InputManager, Actuator, StorageManager) {
    this.size = size; // Size of the grid
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.actuator = new Actuator();

    this.startTiles = 2;

    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

    this.setup();
  }
  // Restart the game
  restart() {
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();
  }
  // Keep playing after winning (allows going over 2048)
  keepPlaying() {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
  }
  // Return true if the game is lost, or has won and the user hasn't kept playing
  isGameTerminated() {
    if (this.over || (this.won && !this.keepPlaying)) {
      return true;
    } else {
      return false;
    }
  }
  // Set up the game
  setup() {
    let previousState = this.storageManager.getGameState();

    // Reload the game from a previous game if present
    if (previousState) {
      this.grid = new Grid(previousState.grid.size, previousState.grid.cells); // Reload grid
      this.score = previousState.score;
      this.over = previousState.over;
      this.won = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else {
      this.grid = new Grid(this.size);
      this.score = 0;
      this.over = false;
      this.won = false;
      this.keepPlaying = false;

      // Add the initial tiles
      this.addStartTiles();
    }

    // Update the actuator
    this.actuate();
  }
  // Set up the initial tiles to start the game with
  addStartTiles() {
    for (let i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  }
  // Adds a tile in a random position
  addRandomTile() {
    if (this.grid.cellsAvailable()) {
      let value = Math.random() < 0.9 ? 2 : 4;
      let tile = new Tile(this.grid.randomAvailableCell(), value);

      this.grid.insertTile(tile);
    }
  }
  // Sends the updated grid to the actuator
  actuate() {
    if (this.storageManager.getBestScore() < this.score) {
      this.storageManager.setBestScore(this.score);
    }

    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
      this.storageManager.clearGameState();
    } else {
      this.storageManager.setGameState(this.serialize());
    }

    this.actuator.actuate(this.grid, {
      score: this.score,
      over: this.over,
      won: this.won,
      bestScore: this.storageManager.getBestScore(),
      terminated: this.isGameTerminated(),
    });
  }
  // Represent the current game as an object
  serialize() {
    return {
      grid: this.grid.serialize(),
      score: this.score,
      over: this.over,
      won: this.won,
      keepPlaying: this.keepPlaying,
    };
  }
  // Save all tile positions and remove merger info
  prepareTiles() {
    this.grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  }
  // Move a tile and its representation
  moveTile(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  }
  // Move tiles on the grid in the specified direction
  move(direction) {
    // 0: up, 1: right, 2: down, 3: left
    let self = this;

    if (this.isGameTerminated())
      return; // Don't do anything if the game's over

    let cell, tile;

    let vector = this.getVector(direction);
    let traversals = this.buildTraversals(vector);
    let moved = false;

    // Save the current tile positions and remove merger information
    this.prepareTiles();

    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);

        if (tile) {
          let positions = self.findFarthestPosition(cell, vector);
          let next = self.grid.cellContent(positions.next);

          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            let merged = new Tile(positions.next, tile.value * 2);
            merged.mergedFrom = [tile, next];

            self.grid.insertTile(merged);
            self.grid.removeTile(tile);

            // Converge the two tiles' positions
            tile.updatePosition(positions.next);

            // Update the score
            self.score += merged.value;

            // The mighty 2048 tile
            if (merged.value === 2048)
              self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }

          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
        }
      });
    });

    if (moved) {
      this.addRandomTile();

      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }

      this.actuate();
    }
  }
  // Get the vector representing the chosen direction
  getVector(direction) {
    // Vectors representing tile movement
    let map = {
      0: { x: 0, y: -1 },
      1: { x: 1, y: 0 },
      2: { x: 0, y: 1 },
      3: { x: -1, y: 0 }, // Left
    };

    return map[direction];
  }
  // Build a list of positions to traverse in the right order
  buildTraversals(vector) {
    let traversals = { x: [], y: [] };

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1)
      traversals.x = traversals.x.reverse();
    if (vector.y === 1)
      traversals.y = traversals.y.reverse();

    return traversals;
  }
  findFarthestPosition(cell, vector) {
    let previous;

    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell;
      cell = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

    return {
      farthest: previous,
      next: cell, // Used to check if a merge is required
    };
  }
  movesAvailable() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  }
  // Check for available matches between tiles (more expensive check)
  tileMatchesAvailable() {
    let self = this;

    let tile;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });

        if (tile) {
          for (let direction = 0; direction < 4; direction++) {
            let vector = self.getVector(direction);
            let cell = { x: x + vector.x, y: y + vector.y };

            let other = self.grid.cellContent(cell);

            if (other && other.value === tile.value) {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }

    return false;
  }
  positionsEqual(first, second) {
    return first.x === second.x && first.y === second.y;
  }
}

















// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
