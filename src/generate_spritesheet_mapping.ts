/*
Idk how sprite sheet work (even after looking through the code) so I decided to create a mapping to sprite sheets defined in game.
I have 0 binary stuff knowledge so this is probably the worst way of doing this lol.

Anyway, given a spritesheet (eg for a wall), in src is defined in plain words to where each tile of that spreadsheet 
is connected to (surrounding tiles). In ops are defined binary values for each such keywords.

Then, below in code, each line in src, corresponding a tile index in a spritesheet (starting from top left, going right and down),
is processed to create a binary value representing that tile's position.

I than can look at actual tile positioning and compute a similar binary values based on ops and surrounding tiles, and map that to 
these computed t ile positions. In the end we get a tile index in the spritesheet that totally matches. Yuppie!!.

*/

const ops = {
    left: 0b1,
    up: 0b10,
    right: 0b100,
    down: 0b1000
}

const src = `\
0   right down
1   left down right
2   left down
3   up
4   up right down
5   left up right down
6   up left down
7   right
8   up right
9   left up right
10  up left
11  left
12  left right
13  
14  up down
15 down`

const resObj = {};
for (const line of src.split("\n")) {
    let res = 0b0000;
    for (const [keyword, value] of Object.entries(ops)) {
        if (line.includes(keyword))
            res += value
    }
    resObj[parseInt(line.split(' ')[0])] = res.toString(2);
}
console.log(resObj);