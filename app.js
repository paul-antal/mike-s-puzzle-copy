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
    }

    isFree(line, column) {
        return line >= 0 && line < 4 && column >= 0 && column < 5 && !this.map[line][column];
    }

    clearSpace(line, column) {
        this.map[line][column] = undefined;
    }

    setSpace(box, line, column) {
        this.map[line][column] = box;
    }

    cloneMap() {
        return this.map.map(line => [...line]);
    }

    move(line, column, direction) {
        this.map[line][column].move(direction)
    }

    draw() {
        this.renderer.draw(this.map);
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
                if (!box)
                    continue;
                let classNames = box.getClassNames(i, j);
                if (classNames) {
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
}

const UP = [-1, 0];
const DOWN = [1, 0];
const LEFT = [0, -1];
const RIGHT = [0, 1];

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

    initialize() {
        this.type = SQUARE;
        this.extraClasses.push(SQUARE)
    }

    move(direction) {
        if (this.isFixed)
            return false;
        var currentSpaces = this.getCurrentSpaces();
        var nextSpaces = currentSpaces.map(s => addV(s, direction))
        currentSpaces.forEach(space => {
            this.game.clearSpace(...space)
        })
        if (nextSpaces.some(s => !this.game.isFree(...s))) {
            currentSpaces.forEach(space => {
                this.game.setSpace(this, ...space);
            });
            return false;
        }
        nextSpaces.forEach(space => {
            this.game.setSpace(this, ...space);
        });
        this.line += direction[0];
        this.column += direction[1];
    }

    getClassNames(line, column) {
        if (line != this.line || column != this.column) {
            return
        }
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
}

class RodBoxRight extends RodBox {
    initialize() {
        this.type = RODBOXRIGHT;
        this.extraClasses.push(RODBOXRIGHT, TWOWIDE);
    }
}

class RodBoxLeft extends RodBox {
    initialize() {
        this.type = RODBOXLEFT;
        this.extraClasses.push(RODBOXLEFT, TWOWIDE);
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
    initialize(){
        this.type = RODBOXSEGMENTRIGHT
        this.extraClasses.push(RODBOXRIGHT, SQUARE)
    }
}

class RodBoxLeftSegment extends RodBoxSegment {
    initialize(){
        this.type = RODBOXSEGMENTLEFT
        this.extraClasses.push(RODBOXLEFT, SQUARE)
    }
}

class RodBoxMiddleSegment extends RodBoxSegment {
    initialize(){
        this.type = RODBOXSEGMENTMIDDLE
        this.extraClasses.push(RODBOXMIDDLE, SQUARE)
    }
}

function start() {
    let renderer = new HtmlRenderer(GAMECONTAINERID);
    let game = new Game(renderer);
    initializeDragHandlers(game);
    new BoxTwoTall(game, 0, 0);
    new RodBoxRight(game, 0, 1, true, true);
    new RodBoxMiddleSegment(game, 0, 3);
    new RodBoxLeftSegment(game, 0, 4);
    new Box(game, 1, 1);
    new Box(game, 1, 4);
    new Box(game, 2, 0);
    new Box(game, 2, 1);
    new BoxTwoWide(game, 2, 2);
    new BoxTwoTall(game, 2, 4);
    new Box(game, 3, 0);
    new Box(game, 3, 1);
    new RodBoxLeft(game, 3, 2, true);
    game.draw();
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