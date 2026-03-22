const http = require('http');

const postData = JSON.stringify({
  message: "Where is Kurkure?",
  branchId: 12
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing /api/chat endpoint...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}\n`);
  console.log('Response:\n');
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk.toString();
    process.stdout.write(chunk);
  });
  
  res.on('end', () => {
    console.log('\n\nResponse received. Total length:', data.length);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();
