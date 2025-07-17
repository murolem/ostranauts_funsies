import { createSchema } from 'genson-js';

const objToBeConverted = [{
    name: 'David',
    rank: 7,
    born: '1990-04-05T15:09:56.704Z',
    luckyNumbers: [7, 77, 5]
}, {
    name: 'DDD',
    born: '1990-04-05T15:09:56.704Z',
    luckyNumbers: [7, 77, 5]
}];

const schema = createSchema(objToBeConverted);
console.log(schema);