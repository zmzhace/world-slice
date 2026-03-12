// Test API connectivity
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function testAPI() {
  console.log('Testing API connection...');
  console.log('Base URL:', process.env.ANTHROPIC_BASE_URL || 'not set');
  console.log('Model:', process.env.ANTHROPIC_MODEL || 'not set');
  console.log('Auth Token:', process.env.ANTHROPIC_AUTH_TOKEN ? 'set (hidden)' : 'not set');
  
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || '',
    baseURL: process.env.ANTHROPIC_BASE_URL,
  });

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  try {
    console.log('\nSending test request...');
    const response = await client.messages.create({
      model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say hello in one sentence.',
        },
      ],
    });

    console.log('\n✅ API connection successful!');
    console.log('Full response:', JSON.stringify(response, null, 2));
    
    // Try different response formats
    if (response.content && response.content[0]) {
      console.log('Response (Anthropic format):', response.content[0].text);
    } else if (response.choices && response.choices[0]) {
      console.log('Response (OpenAI format):', response.choices[0].message.content);
    } else if (response.message) {
      console.log('Response (message field):', response.message);
    } else {
      console.log('Response (unknown format):', response);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ API connection failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    if (error.status) {
      console.error('Status:', error.status);
    }
    return false;
  }
}

testAPI();
