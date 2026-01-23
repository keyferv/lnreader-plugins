const https = require('https');

const url = 'https://api.ichijoutranslations.com/api/home/work/156';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(url, options, (res) => {
    console.log('Status Code:', res.statusCode);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json.data.publicationStatus, null, 2));
      console.log(JSON.stringify(json.data.workGenres, null, 2));
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error: ' + err.message);
});
