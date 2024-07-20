import jps from '../src/index.js';

const queryString = '五';

const results = await jps.findRS(queryString)

console.log({ results })