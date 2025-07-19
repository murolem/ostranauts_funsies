type Vector2 = {
    w: number,
    h: number
}

type Position = {
    x: number,
    y: number
}

type NeighborMatrix = {
    left: boolean,
    up: boolean,
    right: boolean,
    down: boolean
}

type CardinalDirection = keyof NeighborMatrix;