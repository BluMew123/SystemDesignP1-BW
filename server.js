// const fetch = require('node-fetch');

let url = 'https://api.api-ninjas.com/v1/sudokugenerate?width=3&height=3&difficulty=medium';

let options = {
  method: 'GET',
  headers: {
    'User-Agent': 'insomnia/11.6.1',
    'X-Api-Key': '1zekGxh6bYp7FRHq++yg2w==Ujz1EvjPmSt9U9Ab'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));

 