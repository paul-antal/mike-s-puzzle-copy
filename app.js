const GAMECONTAINERID = 'gameContainer'
const SQUARE = "SQUARE";
const TWOTALL = "TWOTALL";
const TWOWIDE = "TWOWIDE";
class Game{
    constructor(renderer){
        this.map = [[],[],[],[]]
        this.renderer = renderer;
    }

    isFree(line, column){
        return line >= 0 && line < 4 && column >= 0 && column < 5 && !this.map[line][column];
    }

    clearSpace(line, column){
        this.map[line][column] = undefined;
    }

    setSpace(box, line, column){
        this.map[line][column] = box;
    }

    cloneMap(){
        return this.map.map(line => [...line]);
    }

    move(line, column, direction){
        this.map[line][column].move(direction)
    }

    draw(){
        this.renderer.draw(this.map);
    }
}

class HtmlRenderer{
    constructor(containerId){
        this.containerId = containerId;
    }

    draw(map){
        let container = document.getElementById(this.containerId);
        container.innerHTML = "";
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 5; j++){
                let box = map[i][j];
                if(!box)
                    continue;
                let className = box.getClassName(i,j);
                if(className){
                    let element = document.createElement("div");
                    element.classList.add('box');
                    if(box.isFixed){
                        element.classList.add('fixedBox')
                    }
                    element.classList.add(className);
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

function addV(coords1, coords2){
    return coords1.map((c1,i) => c1+coords2[i]);
}

class Box{
    constructor(game, line, column , isFixed = false){
        this.game = game;
        this.line = line;
        this.column = column;
        this.isFixed = isFixed;
        this.getCurrentSpaces().forEach(space => {
            this.game.setSpace(this, ...space);
        });
        this.initialize();
    }

    initialize(){
        this.type = SQUARE
    }

    move(direction){
        if(this.isFixed)
            return false;
        var currentSpaces = this.getCurrentSpaces();
        var nextSpaces = currentSpaces.map(s => addV(s, direction))
        currentSpaces.forEach(space => {
            this.game.clearSpace(...space)
        })
        if(nextSpaces.some(s => !this.game.isFree(...s))){
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

    getClassName(line, column){
        if(line == this.line && column == this.column){
            return this.type;
        }
    }

    getCurrentSpaces(){
        return [[this.line, this.column]];
    }
}

class BoxTwoTall extends Box{
    initialize(){
        this.type = TWOTALL;
    }
    getCurrentSpaces(){
        return [[this.line, this.column], [this.line + 1, this.column]];
    }
}

class BoxTwoWide extends Box{
    initialize(){
        this.type = TWOWIDE;
    }
    getCurrentSpaces(){
        return [[this.line, this.column], [this.line, this.column + 1]];
    }
}

function start(){
    let renderer = new HtmlRenderer(GAMECONTAINERID);
    let game = new Game(renderer);
    initializeDragHandlers(game);
    new BoxTwoTall(game, 0, 0);
    new BoxTwoWide(game, 0, 1, true);
    new Box(game, 0, 3);
    new Box(game, 0, 4);
    new Box(game, 1, 1);
    new Box(game, 1, 4);
    new Box(game, 2, 0);
    new Box(game, 2, 1);
    new BoxTwoWide(game, 2, 2);
    new BoxTwoTall(game, 2, 4);
    new Box(game, 3, 0);
    new Box(game, 3, 1);
    new BoxTwoWide(game, 3, 2, true);
    game.draw();
}

function initializeDragHandlers(game){
    let container = document.getElementById(GAMECONTAINERID);
    let currentlyDraggedElement;
    container.addEventListener('mousedown', (event) => {
        if(event.target == container)
            return;
        event.stopPropagation();
        currentlyDraggedElement = event.target;
    })
    document.addEventListener('mouseup', (event) => {
        event.stopPropagation();
        if(!currentlyDraggedElement){
            return;
        }

        let direction = getDirection(currentlyDraggedElement, event.clientX, event.clientY);
        if(!direction){
            return;
        }
        let line = getComputedStyle(currentlyDraggedElement).getPropertyValue('--line');
        let column = getComputedStyle(currentlyDraggedElement).getPropertyValue('--column');
        game.move(line,column,direction);
        game.draw();
        currentlyDraggedElement = undefined;
    })
}

function getDirection(element, x, y){
    var bounds = element.getBoundingClientRect()
    var centerX = (bounds.left + bounds.right)/2;
    var centerY = (bounds.top + bounds.bottom)/2;
    if(Math.abs(centerX - x) < 1 && Math.abs(centerY - y) < 1)
        return;
    if(Math.abs(centerX - x) > Math.abs(centerY - y)){
        if(centerX < x)
            return RIGHT;
        else
            return LEFT;
    } else {
        if(centerY < y)
            return DOWN;
        else
            return UP;
    }
}