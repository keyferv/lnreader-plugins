/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
const https = require('https');

const url =
  'https://api.ichijoutranslations.com/api/home/explore?page=1&limit=12';

https
  .get(url, res => {
    let data = '';

    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        // Print the first item's images to inspect structure
        if (json.data && json.data.data && json.data.data.length > 0) {
          console.log(
            'Images for first item (' + json.data.data[0].title + '):',
          );
          console.log(JSON.stringify(json.data.data[0].workImages, null, 2));
        } else {
          console.log('No data found');
        }
      } catch (e) {
        console.error(e.message);
      }
    });
  })
  .on('error', err => {
    console.error('Error: ' + err.message);
  });

