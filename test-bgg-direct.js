const https = require('https');
const zlib = require('zlib');

// Test BGG API directly
const testBGGAPI = () => {
  const options = {
    hostname: 'boardgamegeek.com',
    port: 443,
    path: '/xmlapi2/thing?id=410201&stats=1',
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  };

  const req = https.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = '';
    let stream = res;

    // Handle gzipped content
    if (res.headers['content-encoding'] === 'gzip') {
      stream = res.pipe(zlib.createGunzip());
    }

    stream.on('data', chunk => {
      data += chunk;
    });

    stream.on('end', () => {
      console.log('Response length:', data.length);
      console.log('First 500 chars:', data.substring(0, 500));
      console.log('Contains <items>:', data.includes('<items'));
      console.log('Contains <item>:', data.includes('<item'));
      console.log('Item count:', (data.match(/<item[^>]*>/g) || []).length);
    });
  });

  req.on('error', error => {
    console.error('Error:', error);
  });

  req.end();
};

testBGGAPI();
