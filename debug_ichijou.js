/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
const https = require('https');

const url =
  'https://api.ichijoutranslations.com/api/home/explore?page=1&limit=12&search=Amor de Actores';

https
  .get(url, res => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.error(e.message);
      }
    });
  })
  .on('error', err => {
    console.error('Error: ' + err.message);
  });

