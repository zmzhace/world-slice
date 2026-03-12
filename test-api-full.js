// Full API test with agent generation
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function parseSSEResponse(response) {
  let text = '';
  if (typeof response === 'string') {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data.type === 'content_block_delta' && data.delta?.text) {
            text += data.delta.text;
          }
        } catch (e) {
          // Skip
        }
      }
    }
  } else if (response.content && response.content[0]) {
    text = response.content[0].text;
  }
  return text;
}

async function testAgentGeneration() {
  console.log('🧪 Testing Agent Generation API\n');
  console.log('Config:');
  console.log('  Base URL:', process.env.ANTHROPIC_BASE_URL);
  console.log('  Model:', process.env.ANTHROPIC_MODEL);
  console.log('  Auth:', process.env.ANTHROPIC_AUTH_TOKEN ? '✓ Set' : '✗ Not set');
  
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_AUTH_TOKEN || '',
    baseURL: process.env.ANTHROPIC_BASE_URL,
  });

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

  try {
    console.log('\n📤 Sending request to generate 2 agents...');
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate 2 distinct personal agents. Return as JSON array:
[{"seed":"agent-name","persona":{"openness":0.5,"stability":0.5,"attachment":0.5,"agency":0.5,"empathy":0.5},"vitals":{"energy":0.7,"stress":0.2,"sleep_debt":0.1,"focus":0.6,"aging_index":0.1}}]`
      }],
    });

    const text = parseSSEResponse(response);
    console.log('\n📥 Response received:');
    console.log(text.substring(0, 200) + '...');
    
    // Try to parse JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const agents = JSON.parse(jsonMatch[0]);
      console.log('\n✅ Successfully parsed', agents.length, 'agents:');
      agents.forEach((agent, i) => {
        console.log(`  ${i + 1}. ${agent.seed}`);
      });
      return true;
    } else {
      console.log('\n⚠️  No JSON array found in response');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

testAgentGeneration();
