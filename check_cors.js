const https = require('https');
https.get('https://pinesat.com/api/questions?limit=1', (res) => {
  console.log('Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
}).on('error', (e) => {
  console.error(e);
});
