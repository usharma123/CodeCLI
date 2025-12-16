import streamlit as st
import tiktoken

# Set page configuration
st.set_page_config(
    page_title="Token Counter",
    page_icon="🔢",
    layout="centered"
)

# Title and description
st.title("🔢 Token Counter")
st.markdown("Enter text below to calculate the number of tokens using different encoding models.")

# Encoding model selection
encoding_options = [
    "cl100k_base",  # GPT-4, GPT-3.5-turbo
    "p50k_base",    # Codex models
    "r50k_base",    # GPT-3 models (davinci, etc.)
]

selected_encoding = st.selectbox(
    "Select encoding model:",
    encoding_options,
    index=0,
    help="cl100k_base is used by GPT-4 and GPT-3.5-turbo"
)

# Example text button
col_a, col_b = st.columns([3, 1])
with col_b:
    if st.button("Load Example"):
        st.session_state.example_text = "Hello world! This is a demonstration of tokenization. Notice how 'tokenization' splits into 'token' and 'ization'."

# Text input area
text_input = st.text_area(
    "Enter your text:",
    height=200,
    placeholder="Type or paste your text here...",
    value=st.session_state.get('example_text', '')
)

# Auto-calculate when text is entered (no button needed)
if text_input:
    try:
        # Get the encoding
        encoding = tiktoken.get_encoding(selected_encoding)
        
        # Encode the text
        tokens = encoding.encode(text_input)
        token_count = len(tokens)
        
        # Display results
        st.success(f"**Token Count:** {token_count}")
        
        # Additional statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Characters", len(text_input))
        with col2:
            st.metric("Words", len(text_input.split()))
        with col3:
            st.metric("Tokens", token_count)
        
        # Visual tokenization display
        st.subheader("📝 Visual Tokenization")
        st.markdown("Each token is highlighted with alternating colors. Notice how words can be split into multiple tokens:")
        
        # Create HTML for visual token display
        html_tokens = []
        colors = ['#FFE6E6', '#E6F3FF', '#FFF9E6', '#E6FFE6', '#F3E6FF', '#FFE6F3']
        
        for i, token_id in enumerate(tokens):
            decoded = encoding.decode([token_id])
            # Escape HTML special characters but preserve exact whitespace
            decoded_html = decoded.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            # Convert spaces to non-breaking spaces to preserve them in HTML
            decoded_html = decoded_html.replace(' ', '&nbsp;')
            # Convert newlines to visible character + actual newline for proper rendering
            decoded_html = decoded_html.replace('\n', '↵\n')
            # Convert tabs to visible character
            decoded_html = decoded_html.replace('\t', '→')
            
            color = colors[i % len(colors)]
            # Use inline style with no padding/margin that would add extra space
            # Use border-right for visual separation without adding layout space
            # Position: relative for potential tooltip positioning
            html_tokens.append(
                f'<span style="background-color: {color}; '
                f'border-right: 1px solid #999; '
                f'font-family: monospace; '
                f'white-space: pre-wrap; '
                f'position: relative;" '
                f'title="Token {i+1}, ID: {token_id}">'
                f'{decoded_html}</span>'
            )
        
        # Display the HTML - join with NO separator to avoid introducing whitespace
        st.markdown(
            f'<div style="line-height: 1.8; background-color: #fafafa; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px;">{"".join(html_tokens)}</div>',
            unsafe_allow_html=True
        )
        
        st.markdown("""
        <div style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
            <small>
                <b>Legend:</b> Spaces are preserved as-is, ↵ = newline, → = tab<br>
                Hover over each token to see its ID and position. Tokens are separated by thin vertical lines.
            </small>
        </div>
        """, unsafe_allow_html=True)
        
        # Verify that concatenated tokens match original input
        reconstructed = ''.join([encoding.decode([token_id]) for token_id in tokens])
        if reconstructed == text_input:
            st.success("✅ Verification: Concatenated tokens exactly match the original input!")
        else:
            st.error("❌ Warning: Concatenated tokens do not match the original input!")
            st.write(f"Original length: {len(text_input)}, Reconstructed length: {len(reconstructed)}")
        
        # Show token details in an expander
        with st.expander("View Detailed Token Information"):
            st.write("**Token IDs:**")
            st.code(tokens[:50])  # Show first 50 tokens
            if len(tokens) > 50:
                st.info(f"Showing first 50 tokens out of {token_count} total tokens")
            
            # Show decoded tokens in a table
            st.write("**Token Breakdown (first 50):**")
            token_data = []
            for i, token_id in enumerate(tokens[:50]):
                decoded = encoding.decode([token_id])
                # Show special characters
                display = repr(decoded)[1:-1]  # Remove quotes from repr
                token_data.append({
                    "Position": i + 1,
                    "Token": display,
                    "ID": token_id,
                    "Length": len(decoded)
                })
            
            st.dataframe(token_data, width='stretch')
            
            if len(tokens) > 50:
                st.info(f"Showing first 50 tokens out of {token_count} total tokens")
    
    except Exception as e:
        st.error(f"Error calculating tokens: {str(e)}")
else:
    st.info("👆 Enter some text above to see the tokenization")

# Information section
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    This application calculates the number of tokens in your text using OpenAI's tiktoken library.
    
    **Encoding Models:**
    - **cl100k_base**: Used by GPT-4, GPT-3.5-turbo, and text-embedding-ada-002
    - **p50k_base**: Used by Codex models and text-davinci-002/003
    - **r50k_base**: Used by GPT-3 models (davinci, curie, babbage, ada)
    
    **Why Token Count Matters:**
    - API costs are based on token usage
    - Models have maximum token limits
    - Understanding tokenization helps optimize prompts
    """)
    
    st.header("📊 Quick Stats")
    if text_input:
        char_to_token_ratio = len(text_input) / len(tiktoken.get_encoding(selected_encoding).encode(text_input)) if text_input else 0
        st.metric("Chars per Token", f"{char_to_token_ratio:.2f}")
