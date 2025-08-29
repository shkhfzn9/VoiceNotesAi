const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
  try {
    // Create a simple test file
    fs.writeFileSync('test.webm', 'fake audio data');
    
    const form = new FormData();
    form.append('audio', fs.createReadStream('test.webm'));
    form.append('transcript', 'This is a test transcript');
    form.append('duration', '5');
    form.append('title', 'Test Note');

    const response = await axios.post('http://localhost:5000/api/notes', form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    // Clean up
    try { fs.unlinkSync('test.webm'); } catch {}
  }
}

testUpload();
