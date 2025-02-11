// Theme toggle functionality with proper initialization and event handling
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const html = document.documentElement;

    // Function to update theme and icons
    function updateTheme(isDark) {
        if (isDark) {
            html.classList.add('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            html.classList.remove('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
            document.body.setAttribute('data-theme', 'light');
        }
    }

    // Initialize theme based on saved preference or system preference
    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && systemDarkMode);
        updateTheme(isDark);
    }

    // Listen for theme toggle clicks
    themeToggle.addEventListener('click', () => {
        const isDark = !html.classList.contains('dark');
        updateTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateTheme(e.matches);
        }
    });

    // Initialize theme on page load
    initializeTheme();
});
// Chat functionality
const GEMINI_API_KEY = config.API_KEY;
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Store conversation history
let conversationHistory = [{
    role: "assistant",
    content: "Hi! I'm your AI career counselor. Let's explore careers that match your skills. What subjects or activities do you enjoy the most?"
}];

// Function to format and add a message to the chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-3 rounded-lg max-w-xs md:max-w-md lg:max-w-lg break-words whitespace-pre-line ${
        isUser 
            ? 'bg-blue-500 text-white self-end' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white self-start'
    }`;

    // Convert markdown-like text to proper HTML format
    content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)(\n|$)/g, '• $1\n')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = content;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Show/hide typing indicator
function toggleTypingIndicator(show) {
    typingIndicator.classList.toggle('hidden', !show);
}

// Generate AI response
async function generateResponse(userMessage) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
    You are an empathetic career counselor AI focused on helping people discover fulfilling career paths. Your approach should:

    1. Begin with open-ended questions about:
       - Educational background
       - Current skills and interests
       - Work/internship experience (if any)
       - Values and work-life balance preferences
       - Salary expectations

    2. Use a conversational tone and maintain context from previous responses

    3. Analyze responses to identify:
       - Core strengths
       - Potential growth areas
       - Industry alignment
       - Skills gaps

    4. Provide personalized recommendations including:
       - 2-3 primary career paths
       - Required qualifications/certifications
       - Learning resources
       - Estimated timeline for transition

    5. Share actionable next steps:
       - Relevant job boards
       - Certification programs
       - Networking opportunities
       - Portfolio/resume tips

    **User's conversation history**:
    ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

    **User's latest response**:
    User: ${userMessage}

    Now, as an AI counselor, provide a career recommendation AND ask a follow-up question to keep the conversation going avoid headings like "AI counsellor", "follow up question":
    `;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data?.candidates?.length > 0 && data.candidates[0]?.content?.parts?.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected API response:", data);
            return "I'm having trouble generating a response. Please try again.";
        }
    } catch (error) {
        console.error('API Error:', error);
        return "I apologize, but I'm having trouble connecting right now. Please try again later.";
    }
}

// Handle send button click
async function handleSend() {
    const message = userInput.value.trim();
    if (!message) return;

    sendBtn.disabled = true;
    userInput.disabled = true;

    addMessage(message, true);
    conversationHistory.push({ role: "user", content: message });

    userInput.value = '';

    toggleTypingIndicator(true);

    const response = await generateResponse(message);
    toggleTypingIndicator(false);
    addMessage(response);
    conversationHistory.push({ role: "assistant", content: response });

    sendBtn.disabled = false;
    userInput.disabled = false;
    userInput.focus();
}

// Event listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});