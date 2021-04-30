const GAMECONTAINERID = 'gameContainer'
const SQUARE = "SQUARE";
const TWOTALL = "TWOTALL";
class Game{
    constructor(renderer){
        this.map = [[],[],[],[]]
        this.renderer = renderer;
    }

    isFree(line, column){
        return !this.map[line][column];
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
        container.innerHtml = "";
        for(let i = 0; i < 4; i++){
            for(let j = 0; j < 5; j++){
                let box = map[i][j];
                if(!box)
                    continue;
                let className = box.getClassName(i,j);
                if(className){
                    let box = document.createElement("div");
                    box.classList.add('box');
                    box.classList.add(className);
                    box.style.setProperty('--line', i);
                    box.style.setProperty('--column', j);
                    container.appendChild(box);
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
    constructor(game, line, column){
        this.game = game;
        this.line = line;
        this.column = column;
        this.getCurrentSpaces().forEach(space => {
            this.game.setSpace(this, ...space);
        });
        this.initialize();
    }

    initialize(){
        this.type = SQUARE
    }

    move(direction){
        var currentSpaces = this.getCurrentSpaces();
        var nextSpaces = currentSpaces.map(s => addV(s, direction))
        if(nextSpaces.some(s => !this.game.isFree(...s)))
            return false;
        nextSpaces.forEach(space => {
            this.game.clearSpace(...space);
            this.game.setSpace(this, ...space);
        });
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

class SquareBox{
    constructor(){

    }
}

function start(){
    let renderer = new HtmlRenderer(GAMECONTAINERID);
    let game = new Game(renderer);
    initializeDragHandlers(game);
    new Box(game, 1, 1);
    new BoxTwoTall(game, 2, 1);
    game.draw();
}

function initializeDragHandlers(game){
    let container = document.getElementById(GAMECONTAINERID);

}