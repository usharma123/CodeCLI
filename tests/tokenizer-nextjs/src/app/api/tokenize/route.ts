import { NextRequest, NextResponse } from 'next/server';
import { get_encoding } from 'tiktoken';

export async function POST(request: NextRequest) {
  try {
    const { text, encoding: encodingName } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Default to cl100k_base if not specified
    const selectedEncoding = encodingName || 'cl100k_base';

    // Get the encoding
    const encoding = get_encoding(selectedEncoding);

    // Encode the text
    const tokens = encoding.encode(text);
    const tokenCount = tokens.length;

    // Convert Uint32Array to regular array to ensure .map() works properly
    const tokenArray = Array.from(tokens);

    // Decode each token for visualization
    const decodedTokens = tokenArray.map((tokenId, index) => {
      const decoded = encoding.decode(new Uint32Array([tokenId]));
      return {
        id: tokenId,
        position: index + 1,
        text: typeof decoded === 'string' ? decoded : String(decoded),
      };
    });

    // Free the encoding
    encoding.free();

    // Calculate statistics
    const stats = {
      tokenCount,
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charsPerToken: tokenCount > 0 ? text.length / tokenCount : 0,
    };

    return NextResponse.json({
      success: true,
      stats,
      tokens: decodedTokens,
      tokenIds: tokenArray,
    });
  } catch (error) {
    console.error('Tokenization error:', error);
    return NextResponse.json(
      { error: 'Failed to tokenize text', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
