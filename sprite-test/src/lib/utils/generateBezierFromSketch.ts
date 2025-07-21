import { bezier } from './bezier';

// example
// only spaces are allowed, no tabs
// should have newlines at both start and end
// any character is allowed as a marker, except space and newlines.
const curveSource = `
МЯУ              МЯУ      МЯУ
     МЯУ 
           МЯУ       МЯУ           МЯУ
`;

type Vector2 = { x: number, y: number };

export function generateBezierFromSketch(sketch: string) {
    let rows = sketch
        .split('\n');

    // get rid of newlines on both start and end
    rows = rows.slice(1, rows.length - 1);


    const longestRowLength = rows
        .reduce((longestLength, row) => {
            return row.length > longestLength ? row.length : longestLength;
        }, 0);

    const xStepSize = 1 / longestRowLength;
    const yStepSize = 1 / rows.length;

    const points: Vector2[] = [];
    for (let colI = 0; colI < longestRowLength; colI++) {
        for (const [rowI, row] of rows.entries()) {
            const value = row[colI];
            if (value !== undefined && value !== ' ') {
                const pnt: Vector2 = {
                    x: colI * xStepSize,
                    y: (rows.length - rowI) * yStepSize
                };

                points.push(pnt);

                continue;
            }
        }
        const rowWithPointMatch = [...rows.entries()]
            .find(([_, row]) => {
                const value = row[colI];
                return value !== undefined && value !== ' ';
            });

        if (rowWithPointMatch) {
            points
        }
    }

    return function (t: number): number {
        return bezier(t, points);
    }
}