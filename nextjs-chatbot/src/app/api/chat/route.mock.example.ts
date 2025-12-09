// Example: Mock AI Responses (for testing without API key)
// Rename this file to route.ts to use mock responses instead of OpenRouter

import { NextRequest, NextResponse } from 'next/server'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

// Simple mock AI response - replace with actual AI API call
function generateMockResponse(messages: Message[]): string {
  const lastMessage = messages[messages.length - 1]
  const userInput = lastMessage.content.toLowerCase()

  // Simple pattern matching for demo purposes
  if (userInput.includes('hello') || userInput.includes('hi')) {
    return "Hello! It's great to chat with you. How can I assist you today?"
  }
  
  if (userInput.includes('how are you')) {
    return "I'm doing great, thank you for asking! I'm here and ready to help you with any questions you might have."
  }
  
  if (userInput.includes('name')) {
    return "I'm a Next.js chatbot assistant. I'm here to help answer your questions and have a conversation with you!"
  }
  
  if (userInput.includes('help')) {
    return "I'm here to help! You can ask me questions, have a conversation, or just chat. What would you like to know?"
  }
  
  if (userInput.includes('weather')) {
    return "I don't have access to real-time weather data, but I'd recommend checking a weather service for accurate information!"
  }
  
  if (userInput.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}. Is there anything else I can help you with?`
  }

  if (userInput.includes('bye') || userInput.includes('goodbye')) {
    return "Goodbye! It was nice chatting with you. Feel free to come back anytime!"
  }

  // Default responses
  const responses = [
    "That's interesting! Tell me more about that.",
    "I understand. What else would you like to know?",
    "That's a great question! Let me think about that...",
    "I see what you mean. How can I help you further with this?",
    "Thanks for sharing that with me. What else is on your mind?",
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
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

    // Generate response (replace this with actual AI API call)
    const responseMessage = generateMockResponse(messages)

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({ message: responseMessage })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
