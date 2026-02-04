import chalk from 'chalk';

export async function getFixFromLLM(command: string, stderr: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(chalk.yellow('\n⚠️  OPENAI_API_KEY not found. AI suggestions disabled.'));
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a CLI expert. Provide a single line bash command to fix the error. Do not explain.'
          },
          {
            role: 'user',
            content: `Command: ${command}\nError: ${stderr}`
          }
        ],
        max_tokens: 200,
        temperature: 0
      })
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json() as any;
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    return suggestion || null;

  } catch (error) {
    return null;
  }
}
