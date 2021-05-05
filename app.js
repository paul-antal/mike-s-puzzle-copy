const GAMECONTAINERID = 'gameContainer'
const SQUARE = 'SQUARE';
const TWOTALL = 'TWOTALL';
const TWOWIDE = 'TWOWIDE';
const RODBOXRIGHT = 'RODBOXRIGHT';
const RODBOXMIDDLE = 'RODBOXMIDDLE';
const RODBOXLEFT = 'RODBOXLEFT';
const RODBOXSEGMENTLEFT = 'RODBOXSEGMENTLEFT';
const RODBOXSEGMENTMIDDLE = 'RODBOXSEGMENTMIDDLE';
const RODBOXSEGMENTRIGHT = 'RODBOXSEGMENTRIGHT';
class Game {
    constructor(renderer) {
        this.map = [[], [], [], []]
        this.renderer = renderer;
        this.blocks = new Set();
    }

    isCoordinateInMap(line, column) {
        return line >= 0 && line < 4 && column >= 0 && column < 5
    }

    isFree(line, column) {
        return this.isCoordinateInMap(line, column) && !this.map[line][column];
    }

    clearSpace(line, column) {
        this.blocks.delete(this.map[line][column]);
        this.map[line][column] = undefined;
    }

    setSpace(box, line, column) {
        this.map[line][column] = box;
        this.blocks.add(box);
    }

    getSpace(line, column) {
        return this.isCoordinateInMap(line, column) && this.map[line][column];
    }

    cloneMap() {
        return this.map.map(line => [...line]);
    }

    move(line, column, direction) {
        return this.map[line][column].move(direction)
    }

    draw() {
        if (this.renderer)
            this.renderer.draw(this.map);
    }

    getBlocks() {
        return this.blocks;
    }

    getStateString() {
        let stateString = '';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 5; j++) {
                let box = this.map[i][j];
                if (box && box.isOriginPosition(i, j))
                    stateString += box.getStateString();
            }
        }
        return stateString;
    }

    setCompletedCondition(condition) {
        this.isCompletedCondition = condition;
    }

    isCompleted() {
        return this.isCompletedCondition();
    }
}

class HtmlRenderer {
    constructor(containerId) {
        this.containerId = containerId;
    }

    draw(map) {
        let container = document.getElementById(this.containerId);
        container.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 5; j++) {
                let box = map[i][j];
                if (!box || !box.isOriginPosition(i, j))
                    continue;
                let classNames = box.getClassNames(i, j);
                let element = document.createElement('div');
                element.classList.add('box');
                element.classList.add(...classNames);
                element.style.setProperty('--line', i);
                element.style.setProperty('--column', j);
                container.appendChild(element);
            }
        }
    }
}

const UP = [-1, 0];
const DOWN = [1, 0];
const LEFT = [0, -1];
const RIGHT = [0, 1];
const DIRECTIONS = [UP, DOWN, LEFT, RIGHT]

function addV(coords1, coords2) {
    return coords1.map((c1, i) => c1 + coords2[i]);
}

class Box {
    constructor(game, line, column, isFixed = false) {
        this.extraClasses = [];
        this.game = game;
        this.line = line;
        this.column = column;
        this.isFixed = isFixed;
        this.getCurrentSpaces().forEach(space => {
            this.game.setSpace(this, ...space);
        });
        this.initialize();
    }

    getStateString() {
        return `##${this.line}-${this.column}-${this.type}##`
    }

    initialize() {
        this.type = SQUARE;
        this.extraClasses.push(SQUARE)
    }

    isMoveValid(direction) {
        return this.canMove(direction);
    }

    canMove(direction) {
        if (this.isFixed)
            return false;
        var currentSpaces = this.getCurrentSpaces();
        var nextSpaces = currentSpaces.map(s => addV(s, direction))
        if (nextSpaces.some(s => !this.game.isFree(...s) && this !== this.game.getSpace(...s))) {
            return false;
        }
        return true;
    }

    move(direction) {
        if (!this.canMove(direction))
            return false;
        var currentSpaces = this.getCurrentSpaces();
        var nextSpaces = currentSpaces.map(s => addV(s, direction))
        this.removeFromGame();
        nextSpaces.forEach(space => {
            this.game.setSpace(this, ...space);
        });
        this.line += direction[0];
        this.column += direction[1];
        return true;
    }

    removeFromGame() {
        this.getCurrentSpaces().forEach(space => {
            this.game.clearSpace(...space)
        })
    }

    isOriginPosition(line, column) {
        return line === this.line && column === this.column
    }

    getClassNames(line, column) {
        if (!this.isOriginPosition(line, column))
            return;
        let classNames = [this.type];
        if (this.isFixed) {
            classNames.push('fixedBox');
        }
        classNames.push(...this.extraClasses);
        return classNames;
    }

    getCurrentSpaces() {
        return [[this.line, this.column]];
    }
}

class BoxTwoTall extends Box {
    initialize() {
        this.type = TWOTALL;
        this.extraClasses.push(TWOTALL);
    }
    getCurrentSpaces() {
        return [[this.line, this.column], [this.line + 1, this.column]];
    }
}

class BoxTwoWide extends Box {
    initialize() {
        this.type = TWOWIDE;
    }
    getCurrentSpaces() {
        return [[this.line, this.column], [this.line, this.column + 1]];
    }
}

class RodBox extends BoxTwoWide {
    constructor(game, line, column, isFixed = false, hasRod = false) {
        super(game, line, column, isFixed);
        this.hasRod = hasRod;
        this.extraClasses.push('RODBOX');
    }

    getStateString() {
        return `##${this.line}-${this.column}-${this.type}-${this.hasRod}##`
    }

    getClassNames(line, column) {
        var classNames = super.getClassNames(line, column);
        if (classNames) {
            classNames.push('RODBOX');
            if (this.hasRod) {
                classNames.push('hasRod');
            }
        }
        return classNames;
    }

    move(direction) {
        if (super.move(direction)) {
            return true;
        }
        this.moveRod(direction);
    }

    isMoveValid(direction) {
        return super.isMoveValid(direction) || this.canMoveRod(direction);
    }

    canMoveRod(direction) {
        if(!this.hasRod){
            return false;
        }
        if (direction !== this.rodDirection) {
            return false;
        }
        let closeSpaceCoords = this.getCloseSpaceCoords(direction);
        let closeSpace = this.game.getSpace(...closeSpaceCoords);
        if (!closeSpace)
            return false;
        if (!closeSpace.isSegment) {
            if (!closeSpace.rodDirection || closeSpace.rodDirection === direction)
                return false;
        } else {
            if (closeSpace.type === RODBOXSEGMENTMIDDLE) {
                let farSpaceCoords = addV(closeSpaceCoords, direction);
                let farSpace = this.game.getSpace(...farSpaceCoords);
                if (!farSpace || !farSpace.isSegment || !farSpace.rodDirection || farSpace.rodDirection === direction)
                    return false;
            } else {
                if(this.isFixed){
                    return false;
                }
                if(!closeSpace.rodDirection || closeSpace.rodDirection === direction){
                    return false;
                }
            }
        }

        return true;
    }

    moveRod(direction) {
        if (!this.canMoveRod(direction))
            return false;
        if (!this.isFixed) {
            this.splitRodBox();
        }
        let closeSpaceCoords = this.getCloseSpaceCoords(direction);
        let closeSpace = this.game.getSpace(...closeSpaceCoords);
        if (closeSpace.isSegment) {
            let farSpaceCoords = addV(closeSpaceCoords, direction);
            let farSpace = this.game.getSpace(...farSpaceCoords);
            if (!this.isFixed && closeSpace.rodDirection && closeSpace.rodDirection !== direction) {
                farSpaceCoords = closeSpaceCoords;
                closeSpaceCoords = addV(closeSpaceCoords, closeSpace.rodDirection);
                farSpace = closeSpace;
                closeSpace = this.game.getSpace(...closeSpaceCoords);
            }

            this.game.clearSpace(...closeSpaceCoords);
            this.game.clearSpace(...farSpaceCoords);
            let startCoords = closeSpaceCoords[1] < farSpaceCoords[1] ? closeSpaceCoords : farSpaceCoords;
            closeSpace = direction === RIGHT ? new RodBoxLeft(this.game, startCoords[0], startCoords[1], false, true) :
                new RodBoxRight(this.game, startCoords[0], startCoords[1], false, true)

        }
        this.hasRod = false;
        closeSpace.hasRod = true;
    }

    getCloseSpaceCoords(direction) {
        let closeSpaceCoords = addV([this.line, this.column], direction);
        if (direction === RIGHT) {
            closeSpaceCoords = addV(closeSpaceCoords, direction);
        }
        return closeSpaceCoords;
    }
}

class RodBoxRight extends RodBox {
    initialize() {
        this.type = RODBOXRIGHT;
        this.extraClasses.push(RODBOXRIGHT, TWOWIDE);
        this.rodDirection = RIGHT;
    }

    splitRodBox() {
        this.removeFromGame();
        new RodBoxRightSegment(this.game, this.line, this.column);
        new RodBoxMiddleSegment(this.game, this.line, this.column + 1)
    }
}

class RodBoxLeft extends RodBox {
    initialize() {
        this.type = RODBOXLEFT;
        this.extraClasses.push(RODBOXLEFT, TWOWIDE);
        this.rodDirection = LEFT;
    }

    splitRodBox() {
        this.removeFromGame();
        new RodBoxMiddleSegment(this.game, this.line, this.column);
        new RodBoxLeftSegment(this.game, this.line, this.column + 1)
    }
}

class RodBoxSegment extends Box {
    getClassNames(line, column) {
        var classNames = super.getClassNames(line, column);
        if (classNames) {
            classNames.push('RODBOX');
        }
        return classNames;
    }
}

class RodBoxRightSegment extends RodBoxSegment {
    initialize() {
        this.type = RODBOXSEGMENTRIGHT
        this.extraClasses.push(RODBOXRIGHT, SQUARE)
        this.rodDirection = RIGHT;
        this.isSegment = true;
    }
}

class RodBoxLeftSegment extends RodBoxSegment {
    initialize() {
        this.type = RODBOXSEGMENTLEFT
        this.extraClasses.push(RODBOXLEFT, SQUARE)
        this.rodDirection = LEFT;
        this.isSegment = true;
    }
}

class RodBoxMiddleSegment extends RodBoxSegment {
    initialize() {
        this.type = RODBOXSEGMENTMIDDLE
        this.extraClasses.push(RODBOXMIDDLE, SQUARE)
        this.isSegment = true;
    }
}

function start() {
    startTestPlayground();
}

function startTestPlayground() {
    let renderer = new HtmlRenderer(GAMECONTAINERID);
    let game = initializeActualGame(renderer);
    initializeDragHandlers(game);
    game.draw();
    window.addEventListener('keypress', () => { solver.runStep() })
    console.log(game.getBlocks());
}

function startNodeJS(){
    let game = initializeActualGame();
    game.draw();
    let solver = new PuzzleSolver(() => initializeActualGame())
    solver.solve();
    console.log(game.getBlocks());
}
class PuzzleSolver {
    constructor(createGameFunction) {
        this.createGame = createGameFunction;
        this.visitedStates = new Set();
        this.visitedStateDepth = {};
        //this.refreshPromise();
        this.shortestResult;
        this.totalSteps = 0;
        this.statesRereached = 0;
    }

    updateScreen(currentDepth){
        if(this.shortestResult){
            document.getElementById('longestSolution').innerHTML = this.shortestResult.length;
        }
        if(this.visitedStates){
            document.getElementById('statesReached').innerHTML = this.visitedStates.size;
        }
        if(this.statesRereached){
            document.getElementById('statesRereached').innerHTML = this.statesRereached;
        }
        if(this.totalSteps){
            document.getElementById('totalSteps').innerHTML = this.totalSteps;
        }
        if(currentDepth){
            document.getElementById('currentDepth').innerHTML = currentDepth;
        }
    }

    writeToConsole(currentDepth){
        let shortestResultLength = this.shortestResult && this.shortestResult.length
        console.log(`total steps: ${this.totalSteps}, current depth: ${currentDepth},shortest solution: ${shortestResultLength}, states reached: ${this.visitedStates.size}, `)
    }

    runMoves(moves) {
        let game = this.createGame();
        for (let move of moves) {
            game.move(move.line, move.column, move.direction);
        }
        return game;
    }

    refreshPromise(game, currentDepth) {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
        })
        if(this.totalSteps % 2000000){
            this.resolve();
            return;
        }
        this.updateScreen(currentDepth);
        if(game)
            game.draw();
    }

    runStep() {
        this.resolve();
    }

    updateVisitedState(state, depth){
        this.visitedStates.add(state);
        if(!this.visitedStateDepth[state] || this.visitedStateDepth[state] > depth){
            this.visitedStateDepth[state] = depth;
        }
    }

    async solve() {
        let solution = await this.recursiveStep([])
        console.log(this.shortestResult);
    }

    async recursiveStep(moves) {
        let game = this.runMoves(moves);
        //await this.promise;
        //this.refreshPromise(game, moves.length);
        if(this.totalSteps % 1000 === 0)
            this.writeToConsole(moves.length)
        this.totalSteps++;
        let state = game.getStateString();
        if (this.visitedStates.has(state) && this.visitedStateDepth[state] < moves.length) {
            this.statesRereached ++;
            return false;
        }
        this.updateVisitedState(state, moves.length);
        if(this.shortestResult && this.shortestResult.length < moves.length){
            //console.log(`going too deep - shortest: ${this.shortestResult && this.shortestResult.length} - current: ${moves.length}`)
            return false;
        }
        if (game.isCompleted()) {
            console.log(`found solution - length ${moves.length}`)
            if (!this.shortestResult || this.shortestResult.length > moves.length) {
                this.shortestResult = moves;
            }
            return;
        }
        let possibleMoves = this.getPossibleMoves(game);
        shuffle(possibleMoves);
        for (let move of possibleMoves) {
            await this.recursiveStep([...moves, move]);
        }
    }

    getPossibleMoves(game) {
        let possibleMoves = [];
        let blocks = game.getBlocks();
        for (let block of blocks) {
            for (let direction of DIRECTIONS) {
                if (block.isMoveValid(direction)) {
                    possibleMoves.push({ line: block.line, column: block.column, direction });
                }
            }
        }
        return possibleMoves;
    }
}

startNodeJS();

function initializeSimpleGame(renderer) {
    let game = new Game(renderer);
    new BoxTwoTall(game, 0, 0, true);
    new RodBoxRight(game, 0, 1, true, true);
    new RodBoxMiddleSegment(game, 0, 3);
    new RodBoxLeftSegment(game, 0, 4);
    new Box(game, 2, 0, true);
    new RodBoxRightSegment(game, 2, 1);
    new BoxTwoWide(game, 3, 0, true);
    new BoxTwoWide(game, 3, 2, true);
    new BoxTwoTall(game, 2, 4);
    let final = new RodBoxLeft(game, 2, 3, true);
    game.setCompletedCondition(() => final.hasRod);
    return game;
}

function initializeActualGame() {
    let game = new Game();
    new BoxTwoTall(game, 0, 0);
    new RodBoxRight(game, 0, 1, true, true);
    new Box(game, 0, 3);
    new Box(game, 0, 4);
    new Box(game, 1, 1);
    new RodBoxMiddleSegment(game, 1, 4);
    new Box(game, 2, 0);
    new RodBoxLeftSegment(game, 2, 1);
    new BoxTwoWide(game, 2, 2);
    new BoxTwoTall(game, 2, 4);
    new RodBoxRightSegment(game, 3, 0);
    new Box(game, 3, 1);
    let final = new RodBoxLeft(game, 3, 2, true);
    game.setCompletedCondition(() => final.hasRod);
    return game;
}


function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

function initializeDragHandlers(game) {
    let container = document.getElementById(GAMECONTAINERID);
    let currentlyDraggedElement;
    container.addEventListener('mousedown', (event) => {
        if (event.target == container)
            return;
        event.stopPropagation();
        currentlyDraggedElement = event.target;
    })
    document.addEventListener('mouseup', (event) => {
        event.stopPropagation();
        if (!currentlyDraggedElement) {
            return;
        }

        let direction = getDirection(currentlyDraggedElement, event.clientX, event.clientY);
        if (!direction) {
            return;
        }
        let line = getComputedStyle(currentlyDraggedElement).getPropertyValue('--line');
        let column = getComputedStyle(currentlyDraggedElement).getPropertyValue('--column');
        game.move(line, column, direction);
        game.draw();
        currentlyDraggedElement = undefined;
    })
}

function getDirection(element, x, y) {
    var bounds = element.getBoundingClientRect()
    var centerX = (bounds.left + bounds.right) / 2;
    var centerY = (bounds.top + bounds.bottom) / 2;
    if (Math.abs(centerX - x) < 1 && Math.abs(centerY - y) < 1)
        return;
    if (Math.abs(centerX - x) > Math.abs(centerY - y)) {
        if (centerX < x)
            return RIGHT;
        else
            return LEFT;
    } else {
        if (centerY < y)
            return DOWN;
        else
            return UP;
    }
}
console.log('starting')
// start();