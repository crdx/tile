"use strict";

function $(id)
{
    return document.getElementById(id);
}

function addEvent(source, eventName, handler)
{
    if (source.addEventListener)
        source.addEventListener(eventName, handler, false);
    else
        source.attachEvent("on" + eventName, handler);
}

Function.prototype.bind = Function.prototype.bind || function(obj)
{
    var method = this;

    return function() {
        return method.apply(obj, arguments);
    };
}

function Tile(id, x, y)
{
    this.id = id;
    this.isMoving = false;
    this.x = x;
    this.y = y;
    this.isBlank = false;
}

function Puzzle(settings)
{
    this.container = settings.elements.container;
    this.container.innerHTML = "";
    this.tiles = [];
    this.shuffleTimer;
    this.settings = settings;
    this.swap = this.settings.animated === "true" ? this.animatedSwap : this.simpleSwap;

    this.addEventHandlers();

    if (!this.settings.numbers && (settings.imageUrl === "" || typeof settings.imageUrl === "undefined"))
        settings.numbers = true;

    if (this.settings.imageUrl && (this.settings.imageWidth === 0 || this.settings.imageHeight === 0))
    {
        var image = new Image();
        image.src = this.settings.imageUrl;

        addEvent(image, "load", function()
        {
            this.settings.imageWidth  = (Math.floor(image.width / this.settings.gridWidth) * this.settings.gridWidth);
            this.settings.imageHeight = (Math.floor(image.height / this.settings.gridHeight) * this.settings.gridHeight);

            this.settings.tileWidth  = this.settings.imageWidth / this.settings.gridWidth;
            this.settings.tileHeight = this.settings.imageHeight / this.settings.gridHeight;

            this.generateTiles();
        }.bind(this));
    }
    else
    {
        this.settings.tileWidth = 50;
        this.settings.tileHeight = 50;

        this.settings.imageWidth  = this.settings.tileWidth * this.settings.gridWidth;
        this.settings.imageHeight = this.settings.tileHeight * this.settings.gridHeight;

        this.generateTiles();
    }
}

Puzzle.prototype.addEventHandlers = function()
{
    addEvent(this.settings.elements.shuffleButton, "click", function(event) {
        var target = event.currentTarget;
        var shuffling = target.value === "Stop Shuffle";

        if (shuffling)
        {
            target.value = "Shuffle";
            this.stopShuffle();
        }
        else
        {
            target.value = "Stop Shuffle";
            this.startShuffle();
        }

        return false;
    }.bind(this));

    addEvent(this.settings.elements.submitButton, "click", function(event) {
        var fieldValues = {
            gridWidth: $("gridWidth").value,
            gridHeight: $("gridHeight").value,
            imageUrl: $("imageUrl").value,
            animated: $("animated").checked.toString(),
            numbers: $("numbers").checked.toString(),
            borderSize: $("borderSize").value,
        };

        var search = "?";

        for (var key in fieldValues)
        {
            if (fieldValues.hasOwnProperty(key) && fieldValues[key] !== this.settings.defaults[key].toString())
                search += key + "=" + fieldValues[key] + "&";
        }

        search = search.substring(0, search.length - 1);

        document.location.search = search;
    }.bind(this));
}

Puzzle.prototype.generateTiles = function()
{
    var id = 1;

    for (var y = 0; y < this.settings.gridHeight; y++)
    {
        for (var x = 0; x < this.settings.gridWidth; x++)
        {
            var div = document.createElement("div");
            this.tiles[id] = new Tile(id, y + 1, x + 1);

            if (x === this.settings.gridWidth - 1 && y === this.settings.gridHeight - 1)
            {
                this.tiles[id].isBlank = true;
                div.className = "blanktile";
            }
            else
            {
                if (this.settings.numbers === "true")
                    div.innerHTML = id;

                if (this.settings.imageUrl)
                    div.style.backgroundImage = "url(" + this.settings.imageUrl + ")";

                div.className = "tile";
            }

            if (this.settings.imageUrl)
            {
                div.style.backgroundAttachment = "scroll";
                div.style.backgroundPosition   = "-" + (x * this.settings.tileWidth + 1) + "px -" + (y * this.settings.tileHeight + 1) + "px";
                div.style.backgroundRepeat     = "no-repeat";
            }

            if (this.settings.imageUrl && this.settings.numbers)
                div.style.color = "#f00";

            div.id = "tile" + id;

            div.style.left   = this.settings.tileWidth * x + this.settings.hOffset + "px";
            div.style.top    = this.settings.tileHeight * y + this.settings.vOffset + "px";
            div.style.width  = this.settings.tileWidth - this.settings.borderSize + "px"
            div.style.height = this.settings.tileHeight - this.settings.borderSize + "px";

            addEvent(div, "click", function(e)
                {
                    this.tileClicked((typeof(e.srcElement) !== "undefined" ) ? e.srcElement : e.currentTarget)
                }.bind(this)
            );

            this.container.appendChild(div);
            id++;
        }
    }
}

Puzzle.prototype.tileClicked = function(obj)
{
    var id = obj.id.substr(4);
    var x = this.tiles[id].x;
    var y = this.tiles[id].y;
    var tile;

    if      ((tile = this.tiles[this.getTileIdByXY(x + 1, y)]) && tile.isBlank) this.swap(id, tile.id);
    else if ((tile = this.tiles[this.getTileIdByXY(x - 1, y)]) && tile.isBlank) this.swap(id, tile.id);
    else if ((tile = this.tiles[this.getTileIdByXY(x, y + 1)]) && tile.isBlank) this.swap(id, tile.id);
    else if ((tile = this.tiles[this.getTileIdByXY(x, y - 1)]) && tile.isBlank) this.swap(id, tile.id);
}

Puzzle.prototype.stopShuffle = function()
{
    clearTimeout(this.shuffleTimer);
}

Puzzle.prototype.startShuffle = function()
{
    // find the blank piece
    var tile;
    for (var i in this.tiles)
    {
        if (this.tiles[i].isBlank)
        {
            tile = this.tiles[i];
            break;
        }
    }

    if (tile.isMoving === false) // ensure we're not in the middle of swapping something else
    {
        // randomly select a piece with which to swap the blank piece
        var x = tile.x;
        var y = tile.y;
        var maybe = [];
        var tmp;

        if (tmp = this.tiles[this.getTileIdByXY(x + 1, y)]) maybe.push(tmp);
        if (tmp = this.tiles[this.getTileIdByXY(x - 1, y)]) maybe.push(tmp);
        if (tmp = this.tiles[this.getTileIdByXY(x, y + 1)]) maybe.push(tmp);
        if (tmp = this.tiles[this.getTileIdByXY(x, y - 1)]) maybe.push(tmp);

        var chosen = maybe[parseInt(Math.random() * maybe.length, 10)];
        this.simpleSwap(chosen.id, tile.id, true);
    }

    this.shuffleTimer = setTimeout(this.startShuffle.bind(this), 0);
}

Puzzle.prototype.simpleSwap = function(t1, t2, shuffling)
{
    if (typeof(shuffling) === "undefined")
        shuffling = false;

    if (this.tiles[t1].isMoving || this.tiles[t2].isMoving)
        return;

    this.tiles[t1].isMoving = true;
    this.tiles[t2].isMoving = true;

    var tile1 = "tile" + t1;
    var tile2 = "tile" + t2;
    var _tile1 = document.getElementById(tile1);
    var _tile2 = document.getElementById(tile2);
    var t1x = parseInt(_tile1.style.left);
    var t1y = parseInt(_tile1.style.top);
    var t2x = parseInt(_tile2.style.left);
    var t2y = parseInt(_tile2.style.top);
    _tile1.style.left = t2x + "px";
    _tile2.style.left = t1x + "px";
    _tile1.style.top = t2y + "px";
    _tile2.style.top = t1y + "px";
    this.swapXY(t1, t2);
    this.tiles[t1].isMoving = false;
    this.tiles[t2].isMoving = false;

    if (!shuffling) this.checkWin();
}

Puzzle.prototype.animatedSwap = function(t1, t2)
{
    if (this.tiles[t1].isMoving || this.tiles[t2].isMoving)
        return;

    this.tiles[t1].isMoving = true;
    this.tiles[t2].isMoving = true;
    var tile1 = "tile" + t1;
    var tile2 = "tile" + t2;
    var _tile1 = document.getElementById(tile1);
    var _tile2 = document.getElementById(tile2);
    var t1x = parseInt(_tile1.style.left);
    var t1y = parseInt(_tile1.style.top);
    var t2x = parseInt(_tile2.style.left);
    var t2y = parseInt(_tile2.style.top);
    var diffX = Math.abs(t1x - t2x);
    var diffY = Math.abs(t1y - t2y);

    var dirX = t1x - t2x > 0 ? 1 : 0;
    var dirY = t1y - t2y > 0 ? 1 : 0;

    var extra = function() {};
    for (var i = diffX, j = diffY, secs = 0; i >= 0 || j >= 0; j--, i--, secs++)
    {
        // if this is the last iteration in the animation, make it set isMoving to false and check if they won
        if (i - 1 < 0 && j - 1 < 0)
            extra = function()
            {
                this.tiles[t1].isMoving = false;
                this.tiles[t2].isMoving = false;
                this.checkWin();
            }.bind(this);

        if ((i % 2) === 0 || (i - 1 < 0 && j - 1 < 0))
        {
            if (i >= 0)
            {
                if (dirX === 1) this.animate("left", tile1, t2x + i, tile2, t1x - i, secs, extra);
                else           this.animate("left", tile1, t2x - i, tile2, t1x + i, secs, extra);
            }

            if (j >= 0)
            {
                if (dirY === 1) this.animate("top", tile1, t2y + j, tile2, t1y - j, secs, extra);
                else           this.animate("top", tile1, t2y - j, tile2, t1y + j, secs, extra);
            }
        }
    }

    // swap the x and y values so the new position of the tile is accurate
    this.swapXY(t1, t2);
}

Puzzle.prototype.animate = function(what, tile1, val1, tile2, val2, time, extra)
{
    setTimeout(function()
    {
        document.getElementById(tile1).style[what] = val1 + 'px';
        document.getElementById(tile2).style[what] = val2 + 'px';
        extra();
    }.bind(this), time);
}

Puzzle.prototype.checkWin = function()
{
    var id = 1;

    for (var y = 1; y <= this.settings.gridHeight; y++)
        for (var x = 1; x <= this.settings.gridWidth; x++)
            if (id++ !== this.getTileIdByXY(y, x))
                return;

    // show the missing tile
    var tile = document.getElementById('tile' + this.settings.gridWidth * this.settings.gridHeight);

    tile.style.backgroundImage = "url(" + this.settings.imageUrl + ")";
    alert("You win! Let's see you do that again.");

    // hide it again and shuffle
    tile.style.backgroundImage = "";
    this.startShuffle();
}

Puzzle.prototype.getTileIdByXY = function(x, y)
{
    for (var i = 1; i <= this.settings.gridWidth * this.settings.gridHeight; i++)
        if (this.tiles[i] !== null && this.tiles[i].x === x && this.tiles[i].y === y)
            return i;

    return null;
}

Puzzle.prototype.swapXY = function(t1, t2)
{
    var x = this.tiles[t1].x;
    var y = this.tiles[t1].y;
    this.tiles[t1].x = this.tiles[t2].x;
    this.tiles[t1].y = this.tiles[t2].y;
    this.tiles[t2].x = x;
    this.tiles[t2].y = y;
}