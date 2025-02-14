async function sendMessage() {
  const userInput = document.getElementById('userInput').value;
  if (!userInput) return;

  const chatbox = document.getElementById('chatbox');
  chatbox.innerHTML += `<div class="user-message">${userInput}</div>`;

  // Add typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot" style="animation-delay: 0.2s"></div>
    <div class="typing-dot" style="animation-delay: 0.4s"></div>
  `;
  chatbox.appendChild(typingIndicator);
  chatbox.scrollTop = chatbox.scrollHeight;

  try {
    // Use your Cloudflare Worker URL
    const response = await fetch('https://linkedin-post.maryamhmdaoui.workers.dev/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: userInput, url: userInput }),
      mode: 'cors'
    });

    // Parse the response as JSON
    const responseData = await response.json();

    // Handle errors
    if (!response.ok) {
      throw new Error(responseData.error || `HTTP Error ${response.status}`);
    }

    // Check response format
    if (!responseData.data || !responseData.data.includes('//')) {
      throw new Error(`Robot sent bad format: ${responseData.data?.substring(0, 50) || 'No data'}...`);
    }

    // Remove typing indicator
    chatbox.removeChild(typingIndicator);

    // Process response
    const [title, content] = responseData.data.split('//\n');
    const formattedContent = content
      .split('\n\n')
      .map(p => p.replace(/\n/g, '<br>'))
      .join('</p><p>')
      .replace(/^(.*)$/, '<p>$1</p>');

    const messageId = Date.now();
    chatbox.innerHTML += `
      <div class="bot-message">
        <div class="message-header">
          <strong>📝 ${title?.trim() || 'New Post'}</strong>
          <button class="copy-btn" onclick="copyToClipboard('${messageId}')">
            📋 Copy
          </button>
        </div>
        <div id="${messageId}" class="post-content">${formattedContent}</div>
      </div>
    `;

    // Show demo message (if present)
    if (responseData.demoMessage) {
      chatbox.innerHTML += `
        <div class="demo-message">
          ${responseData.demoMessage}
        </div>
      `;
    }

  } catch (error) {
    chatbox.removeChild(typingIndicator);
    let errorMessage = error.message;

    // Handle specific errors
    if (error.message.includes('Unexpected token')) {
      errorMessage = 'Invalid response from the server. Please try again.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Connection failed! Check: \n1. Internet connection \n2. Server URL \n3. Workflow activation';
    } else if (error.message.includes('Demo limit reached')) {
      errorMessage = `🚨 ${error.message}\nContact me on <a href="https://www.linkedin.com/in/maryam-hmd/" target="_blank" rel="noopener noreferrer">LinkedIn</a> for full access.`;
    }
    
    chatbox.innerHTML += `
      <div class="error">
        ❌ Error: ${errorMessage}
      </div>
    `;
    console.error('Full error:', error);
  }

  document.getElementById('userInput').value = '';
  chatbox.scrollTop = chatbox.scrollHeight;
}

function copyToClipboard(messageId) {
  const contentDiv = document.getElementById(messageId);
  const textToCopy = contentDiv.innerText;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    const btn = document.querySelector(`button[onclick="copyToClipboard('${messageId}')"]`);
    btn.innerHTML = '✅ Copied!';
    setTimeout(() => {
      btn.innerHTML = '📋 Copy';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}
