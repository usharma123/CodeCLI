// Example: OpenAI Integration
// Rename this file to route.ts to use OpenAI instead of mock responses
// Make sure to add OPENAI_API_KEY to your .env.local file

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Add a system message to set the assistant's behavior
    const systemMessage: Message = {
      role: 'system',
      content: 'You are a helpful, friendly AI assistant. Provide clear and concise answers.'
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    })

    const responseMessage = completion.choices[0].message.content

    return NextResponse.json({ message: responseMessage })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
