/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
const https = require('https');

const url =
  'https://api.ichijoutranslations.com/api/home/explore?page=1&limit=1';

const options = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Origin': 'https://www.ichijoutranslations.com',
    'Referer': 'https://www.ichijoutranslations.com/',
  },
};

https.get(url, options, res => {
  console.log('Explore Status Code:', res.statusCode);
});

const workUrl = 'https://api.ichijoutranslations.com/api/home/work/156';
https.get(workUrl, options, res => {
  console.log('Work Status Code:', res.statusCode);
  let data = '';

  res.on('data', chunk => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const json = JSON.parse(data);
        console.log('Status Name:', json.data.publicationStatus?.name);
        console.log('Status Code:', json.data.publicationStatus?.code);
      }
    } catch (e) {
      console.error(e.message);
    }
  });
});

