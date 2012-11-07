"use strict";

// ALL the defaults
var defaults = {
    // user-configurable
    gridWidth:   "4",
    gridHeight:  "4",
    imageUrl:    "cat.jpg",
    numbers:     "false",
    animated:    "true",
    borderSize:  "1",

    // non-user-configurable
    vOffset:     50, // offset from the top
    hOffset:     10, // offset from the left
    imageWidth:  0,
    imageHeight: 0,
    tileWidth:   0,
    tileHeight:  0
};

var elements = {
    submitButton:  $("submit"),
    shuffleButton: $("toggleShuffle"),
    container:     $("puzzle")
};

// make a copy of defaults, as we'll need them later on
var settings = {}

for (var setting in defaults)
    if (defaults.hasOwnProperty(setting))
        settings[setting] = defaults[setting];

// keep a reference to the defaults and elements
settings.defaults = defaults;
settings.elements = elements;

// extend it with any parameters found in the query string
var search = document.location.search.substr(1);
var params = search.split("&");

for (var i = 0; i < params.length; i++)
{
    var split = params[i].split("=");

    if (split.length === 2)
        settings[split[0]] = split[1];
}

// load all the settings into the fields
var fields = {
    gridWidth: "text",
    gridHeight: "text",
    imageUrl: "text",
    animated: "checkbox",
    numbers: "checkbox",
    borderSize: "text"
};

for (var key in fields)
{
    switch (fields[key])
    {
        case "text":
            $(key).value = settings[key];
            break;
        case "checkbox":
            $(key).checked = settings[key] === "true" ? "true" : "";
            break;
    }
}

new Puzzle(settings);