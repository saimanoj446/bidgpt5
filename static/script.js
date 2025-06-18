// BidGPT Chatbot JavaScript
class BidGPTChatbot {
    constructor() {
        this.isOpen = false;
        this.isFeedbackModalOpen = false;
        this.messages = [];
        this.currentRating = 0;
        this.feedbackText = '';
        this.stopRequested = false;
        this.isBotResponding = false;
        this.currentBotTyping = null;
        this.currentBotTypingElement = null;
        this.currentBotTypingMessage = '';
        this.currentBotTypingIndex = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        // Add stop button event listener after DOM is loaded
        setTimeout(() => {
            const stopButton = document.getElementById('stopBotResponse');
            if (stopButton) {
                stopButton.addEventListener('click', () => this.handleStopBot());
            }
        }, 0);
    }

    renderMarkdown(text) {
        const escaped = this.escapeHtml(text);

        const lines = escaped.split('\n').map(line => {
            if (line.trim().startsWith('^')) {
                const content = line.trim().replace(/^(\^)\s*/, '');
                return `<div class="ml-6 list-disc list-inside text-sm">• ${content}</div>`;
            } else if (line.trim().startsWith('*')) {
                const content = line.trim().replace(/^(\*)\s*/, '');
                return `<div class="mt-2 list-disc list-inside text-sm">• ${content}</div>`;
            } else {
                return `<p>${line}</p>`;
            }
    });


        // Add bold/italic processing after bullets
        return lines.join('')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    } 

    bindEvents() {
        // Chat toggle functionality
        const chatButton = document.getElementById('chatButton');
        const closeChat = document.getElementById('closeChat');
        const chatWindow = document.getElementById('chatWindow');

        chatButton.addEventListener('click', () => this.toggleChat());
        closeChat.addEventListener('click', () => this.toggleChat());
    
        // Close chat when clicking backdrop on mobile
        chatWindow.addEventListener('click', (e) => {
            if (e.target === chatWindow) {
                this.toggleChat();
            }
        });

        // Feedback modal functionality
        const provideFeedbackBtn = document.getElementById('provideFeedbackBtn');
        const feedbackModal = document.getElementById('feedbackModal');
        const closeFeedbackModal = document.getElementById('closeFeedbackModal');
        const cancelFeedback = document.getElementById('cancelFeedback');
        const submitFeedback = document.getElementById('submitFeedback');
        const emojiButtons = document.querySelectorAll('.emoji-btn');

        provideFeedbackBtn.addEventListener('click', () => this.openFeedbackModal());
        closeFeedbackModal.addEventListener('click', () => this.closeFeedbackModal());
        cancelFeedback.addEventListener('click', () => this.closeFeedbackModal());
        submitFeedback.addEventListener('click', () => this.handleFeedbackSubmit());

        // Emoji rating functionality
        emojiButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.handleStarRating(rating);
                // Add visual feedback
                button.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 200);
            });
        });

        // Close feedback modal when clicking backdrop
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                this.closeFeedbackModal();
            }
        });

        // Tender options
        const tenderOptions = document.querySelectorAll('.tender-option');
        tenderOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handleTenderClick(e));
        });

        // Chat input functionality
        const chatInput = document.getElementById('chatInput');
        const sendMessage = document.getElementById('sendMessage');

        sendMessage.addEventListener('click', () => this.handleSendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // Escape key to close modals and chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isFeedbackModalOpen) {
                    this.closeFeedbackModal();
                } else if (this.isOpen) {
                    this.toggleChat();
                }
            }
        });
    }

    toggleChat() {
        const chatWindow = document.getElementById('chatWindow');
        const pulsingRing = document.querySelector('.animate-ping');
        
        if (!this.isOpen) {
            // Show chat window with pop-up animation
            chatWindow.style.display = 'block';
            // Trigger reflow
            chatWindow.offsetHeight;
            chatWindow.classList.remove('scale-0', 'opacity-0');
            // Stop pulsing animation
            pulsingRing.style.display = 'none';
            this.isOpen = true;
            
            // Focus on input after animation
            setTimeout(() => {
                const chatInput = document.getElementById('chatInput');
                chatInput.focus();
            }, 300);
        } else {
            // Hide chat window with reverse pop-up animation
            chatWindow.classList.add('scale-0', 'opacity-0');
            // Restore pulsing animation
            pulsingRing.style.display = 'block';
            setTimeout(() => {
                chatWindow.style.display = 'none';
            }, 300); // Match the duration in the CSS transition
            this.isOpen = false;
        }
            const sendBtn = document.getElementById('sendMessage');

        // Toggle visibility
        // chatWindow.classList.toggle('hidden');
    }

    openFeedbackModal() {
        const feedbackModal = document.getElementById('feedbackModal');
        this.isFeedbackModalOpen = true;
        feedbackModal.classList.remove('hidden');
        
        // Focus on textarea after animation
        setTimeout(() => {
            const feedbackText = document.getElementById('feedbackText');
            feedbackText.focus();
        }, 100);
    }

    closeFeedbackModal() {
        const feedbackModal = document.getElementById('feedbackModal');
        const feedbackText = document.getElementById('feedbackText');
        const submitButton = document.getElementById('submitFeedback');
        
        this.isFeedbackModalOpen = false;
        feedbackModal.classList.add('hidden');
        feedbackText.value = '';
        feedbackText.disabled = false;
        submitButton.classList.remove('btn-loading');
        
        // Reset emoji rating
        this.currentRating = 0;
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        emojiButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = '0.5';
        });
    }

    handleTenderClick(e) {
        const option = e.currentTarget;
        const tenderType = option.dataset.tender;
        const tenderTitle = option.querySelector('span').textContent;
        
        // Add visual feedback
        option.style.transform = 'scale(0.98)';
        setTimeout(() => {
            option.style.transform = '';
        }, 150);
        
        // Add user message
        this.addUserMessage(`Tell me about ${tenderTitle}`);
        
        // Simulate bot response
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
            let response = this.getTenderResponse(tenderType);
            this.addBotMessage(response);
        }, 2000);
    }

    getTenderResponse(tenderType) {
        switch(tenderType) {
            case 'government':
                return 'Government tenders include opportunities from various government departments and agencies. These tenders cover infrastructure, services, and procurement needs across different sectors.';
            case 'state':
                return 'State tenders are issued by state government bodies and include opportunities for local infrastructure, services, and state-specific requirements. Each state may have different procedures and requirements.';
            case 'central':
                return 'Central tenders are issued by central government ministries and departments. These are typically larger scale projects with national scope and standardized procedures.';
            default:
                return 'Please select a specific type of tender to learn more.';
        }
    }

    handleStarRating(rating) {
        this.currentRating = rating;
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        
        // Reset all emojis to default state
        emojiButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = '0.5';
        });
        
        // Activate only the selected emoji
        const selectedButton = document.querySelector(`.emoji-btn[data-rating="${rating}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
            selectedButton.style.opacity = '1';
        }

        console.log('Selected rating:', rating); // Debug line to verify rating is being set
    }

    handleFeedbackSubmit() {
        const feedbackText = document.getElementById('feedbackText');
        const feedback = feedbackText.value.trim();
        
        if (!feedback) {
            this.showNotification('Please enter your feedback before submitting.', 'warning');
            return;
        }

        if (!this.currentRating) {
            this.showNotification('Please select a rating before submitting.', 'warning');
            return;
        }

        // Store feedback text and submit
        this.feedbackText = feedback;
        this.submitFinalFeedback();
    }

    submitFinalFeedback() {
        const feedbackText = document.getElementById('feedbackText');
        const submitButton = document.getElementById('submitFeedback');
        
        submitButton.classList.add('btn-loading');
        
        setTimeout(() => {
            this.showNotification('Thank you for your feedback!', 'success');
            this.addBotMessage('Thank you for your feedback! We appreciate your input and will use it to improve our services. 🙏');
            
            // Reset everything
            feedbackText.value = '';
            feedbackText.disabled = false;
            submitButton.style.display = 'block';
            submitButton.classList.remove('btn-loading');
            this.currentRating = 0;
            this.feedbackText = '';
            
            this.closeFeedbackModal();
        }, 1500);
    }

    handleStopBot() {
        this.stopRequested = true;
        this.hideStopButton();
    }

    showStopButton() {
        const stopButton = document.getElementById('stopBotResponse');
        if (stopButton) stopButton.classList.remove('hidden');
    }

    hideStopButton() {
        const stopButton = document.getElementById('stopBotResponse');
        if (stopButton) stopButton.classList.add('hidden');
    }

    async handleSendMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();

        if (!message) return;

        // If user types "stop", stop the bot response
        if (message.toLowerCase() === 'stop') {
            this.handleStopBot();
            chatInput.value = '';
            chatInput.focus();
            return;
        }

        // Clear input
        chatInput.value = '';
        chatInput.focus();

        // Prevent chat window from closing on first message
        // Remove or comment out any code that hides the chat window here

        // Add user message to chat
        this.addUserMessage(message);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send the full message history for context (for follow-up support)
            // Only send the last N messages for efficiency (e.g., last 10 exchanges)
            const historyToSend = this.messages.slice(-5);

            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: historyToSend
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();

            // Add bot response to chat
            this.addBotMessage(data.response);

        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.addBotMessage("I apologize, but I'm having trouble connecting to the server right now. Please try again later.");
        }
    }

    addUserMessage(message) {
        const chatBody = document.getElementById('chatBody');
        const messageElement = this.createMessageElement(message, 'user');
        chatBody.appendChild(messageElement);
        this.scrollToBottom();
        this.messages.push({ type: 'user', message, timestamp: new Date() });
    }

    addBotMessage(message) {
        const chatBody = document.getElementById('chatBody');
        const messageElement = this.createMessageElement('', 'bot');
        chatBody.appendChild(messageElement);

        const p = messageElement.querySelector('p');
        let index = 0;
        this.stopRequested = false;
        this.isBotResponding = true;
        this.updateSendButtonIcon();
        this.showStopButton();

        // Calculate delay based on message length, max 20ms
        const delay = Math.min(15, Math.floor(1000 / message.length));

        const typeNextChar = () => {
            if (this.stopRequested) {
                // Render what has been typed so far, stop typing
                p.innerHTML = this.renderMarkdown(message.slice(0, index));
                this.hideStopButton();
                this.isBotResponding = false;
                this.updateSendButtonIcon();
                this.messages.push({ type: 'bot', message: message.slice(0, index), timestamp: new Date() });
                return;
            }
            if (index < message.length) {
                // Render markdown for the substring up to current index
                p.innerHTML = this.renderMarkdown(message.slice(0, index + 1));
                index++;
                this.scrollToBottom();
                this.currentBotTyping = setTimeout(typeNextChar, delay);
            } else {
                // Once typing is done, render full markdown
                p.innerHTML = this.renderMarkdown(message);
                this.hideStopButton();
                this.isBotResponding = false;
                this.updateSendButtonIcon();
                this.messages.push({ type: 'bot', message, timestamp: new Date() });
            }
        };
        typeNextChar();
    }
    createMessageElement(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex gap-3 opacity-0 transition-opacity duration-300';

        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-bubble-user p-3 shadow-sm max-w-xs ml-auto">
                    <p class="text-sm">${this.renderMarkdown(message)}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="w-10 h-10 bg-none rounded-full flex items-center justify-center flex-shrink-0">
                    <img src="logo.png" alt="Chat Icon" class="w-full h-full object-fit" />
                </div>
                <div class="message-bubble-bot p-3 max-w-xs">
                    <p class="text-sm text-gray-800">${this.renderMarkdown(message)}</p>
                </div>
            `;
        }

        requestAnimationFrame(() => {
            messageDiv.classList.add('chat-message-enter');
            messageDiv.classList.remove('opacity-0');
        });

        return messageDiv;
    }
    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.remove('hidden');
        this.isBotResponding = true;
        this.updateSendButtonIcon();
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.classList.add('hidden');
        this.isBotResponding = false;
        this.updateSendButtonIcon();
    }

    updateSendButtonIcon() {
        const sendBtn = document.getElementById('sendMessage');
        if (!sendBtn) return;
        if (this.isBotResponding) {
            // Show stop square
            sendBtn.innerHTML = `
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="5" y="5" width="10" height="10" rx="2" />
                </svg>
            `;
        } else {
            // Show send arrow
            sendBtn.innerHTML = `
                <svg class="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
            `;
        }
    }

    scrollToBottom() {
        const chatBody = document.getElementById('chatBody');
        setTimeout(() => {
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 100);
    }
    // generateBotResponse(message) {
    //     const lowerMessage = message.toLowerCase();
        
    //     // Simple keyword-based responses (replace with actual AI logic)
    //     // if (lowerMessage.includes('tender') || lowerMessage.includes('bid')) {
    //     //     return "I can help you with tender information! You can explore government, state, or central tenders using the options above. What specific type of tender are you interested in?";
    //     // } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    //     //     return "I'm here to help! I can provide information about various types of tenders, help you understand bidding processes, and guide you through different levels of tender details. How can I assist you today?";
    //     // } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    //     //     return "Tender pricing and cost information varies by project scope and requirements. I can help you understand the evaluation criteria and provide guidance on competitive bidding strategies.";
    //     // } else if (lowerMessage.includes('document') || lowerMessage.includes('requirement')) {
    //     //     return "Each tender has specific document requirements. I can help you understand what documents you'll need and guide you through the submission process. Which tender are you interested in?";
    //     // } else if (lowerMessage.includes('deadline') || lowerMessage.includes('date')) {
    //     //     return "Tender deadlines are crucial for successful submissions. I can help you track important dates and set up reminders. Would you like me to show you current tender opportunities with upcoming deadlines?";
    //     // } else if (lowerMessage.includes('feedback')) {
    //     //     return "I appreciate that you want to provide feedback! You can click the 'Provide Feedback' button in the header to share your thoughts with us. Your input helps us improve our services.";
    //     // } else {
    //     //     return "I understand you're asking about: \"" + message + "\". I'm here to help with tender-related information. You can use the options above to explore different tender categories, or ask me specific questions about bidding processes, requirements, or deadlines.";
    //     // }
    // }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm transition-all duration-300 transform translate-x-full`;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                notification.className += ' bg-green-500';
                break;
            case 'warning':
                notification.className += ' bg-yellow-500';
                break;
            case 'error':
                notification.className += ' bg-red-500';
                break;
            default:
                notification.className += ' bg-blue-500';
        }
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <p class="text-sm font-medium">${this.escapeHtml(message)}</p>
                <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bidGPTChatbot = new BidGPTChatbot();
});