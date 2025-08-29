// Simple test script to check if your server is working
const axios = require('axios');

async function testServer() {
  try {
    console.log('Testing server connection...');
    
    // Test health endpoint
    const health = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check passed:', health.data);
    
    // Test notes endpoint
    const notes = await axios.get('http://localhost:5000/api/notes');
    console.log('✅ Notes endpoint working, found', notes.data.length, 'notes');
    
  } catch (error) {
    console.error('❌ Server test failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running. Start it with: cd server && npm run dev');
    } else if (error.response) {
      console.error('   Server responded with error:', error.response.status, error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
  }
}

testServer();
