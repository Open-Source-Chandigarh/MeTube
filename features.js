// ===== TIMER FUNCTIONALITY =====
let timerInterval = null;
let timerSeconds = 0;
let timerTotalSeconds = 0;
let timerRunning = false;

function openTimer() {
    document.getElementById('timerModal').classList.add('active');
}

function closeTimer() {
    document.getElementById('timerModal').classList.remove('active');
}

function setTimerPreset(hours, minutes, seconds) {
    document.getElementById('timerHours').value = hours;
    document.getElementById('timerMinutes').value = minutes;
    document.getElementById('timerSeconds').value = seconds;
}

function startTimer() {
    if (timerRunning) return;
    
    const hours = parseInt(document.getElementById('timerHours').value) || 0;
    const minutes = parseInt(document.getElementById('timerMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('timerSeconds').value) || 0;
    
    timerTotalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    if (timerTotalSeconds === 0) {
        alert('Please set a time!');
        return;
    }
    
    timerSeconds = timerTotalSeconds;
    timerRunning = true;
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
            updateTimerProgress();
        } else {
            clearInterval(timerInterval);
            timerRunning = false;
            
            // Auto-pause video playback
            pauseAllVideos();
            
            alert('⏰ Timer finished! Video playback has been paused.');
            playNotificationSound();
        }
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerRunning = false;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSeconds = 0;
    timerTotalSeconds = 0;
    updateTimerDisplay();
    updateTimerProgress();
    document.getElementById('timerHours').value = 0;
    document.getElementById('timerMinutes').value = 0;
    document.getElementById('timerSeconds').value = 0;
}

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    
    const display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
}

function updateTimerProgress() {
    const progress = document.querySelector('.timer-progress');
    if (progress && timerTotalSeconds > 0) {
        const percentage = (timerSeconds / timerTotalSeconds);
        const offset = 565 - (565 * percentage);
        progress.style.strokeDashoffset = offset;
    }
}

// ===== AUTO SHUTDOWN FUNCTIONALITY =====
let shutdownTimeout = null;
let shutdownTime = null;

function openShutdown() {
    document.getElementById('shutdownModal').classList.add('active');
}

function closeShutdown() {
    document.getElementById('shutdownModal').classList.remove('active');
}

function setShutdown(minutes) {
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
    }
    
    shutdownTime = new Date(Date.now() + minutes * 60000);
    updateShutdownDisplay();
    
    shutdownTimeout = setTimeout(() => {
        performShutdown();
    }, minutes * 60000);
    
    alert(`✅ Auto shutdown set for ${minutes} minutes`);
}

function setCustomShutdown() {
    const minutes = parseInt(document.getElementById('customShutdown').value);
    
    if (!minutes || minutes < 1) {
        alert('Please enter a valid number of minutes!');
        return;
    }
    
    setShutdown(minutes);
    document.getElementById('customShutdown').value = '';
}

function cancelShutdown() {
    if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
        shutdownTimeout = null;
        shutdownTime = null;
        document.getElementById('shutdownTime').textContent = 'Not set';
        alert('❌ Auto shutdown cancelled');
    }
}

function updateShutdownDisplay() {
    if (shutdownTime) {
        const timeString = shutdownTime.toLocaleTimeString();
        document.getElementById('shutdownTime').textContent = `Scheduled for ${timeString}`;
    }
}

function performShutdown() {
    // Pause all playing videos
    pauseAllVideos();
    
    // Show notification
    alert('🌙 Auto shutdown activated! Video playback paused. Goodnight!');
    
    // Reset shutdown state
    shutdownTime = null;
    document.getElementById('shutdownTime').textContent = 'Not set';
    
    // Try to close the window (works if opened by script)
    try {
        window.close();
    } catch (e) {
        console.log('Cannot close window - not opened by script');
    }
}

// ===== AI ASSISTANT FUNCTIONALITY =====
function openAIAssistant() {
    document.getElementById('aiAssistantModal').classList.add('active');
}

function closeAIAssistant() {
    document.getElementById('aiAssistantModal').classList.remove('active');
}

function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addAIMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = getAIResponse(message);
        addAIMessage(response, 'assistant');
    }, 500);
}

function askAI(question) {
    document.getElementById('aiInput').value = question;
    sendAIMessage();
}

function addAIMessage(text, sender) {
    const container = document.getElementById('aiChatContainer');
    
    // Remove welcome message if it exists
    const welcome = container.querySelector('.ai-welcome');
    if (welcome) {
        welcome.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    container.appendChild(messageDiv);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function getAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced AI responses with more intelligence
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
        return "I'd be happy to recommend videos! Try searching for topics you're interested in using the search bar. Popular categories include Music, Gaming, Entertainment, and News. What are you in the mood for?";
    } else if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
        return "Video summarization is coming soon! This feature will allow you to get quick summaries of video content. For now, you can check the video description and comments for key information.";
    } else if (lowerMessage.includes('transcript')) {
        return "Transcript generation is a planned feature! Once implemented, you'll be able to get text transcripts of videos. Stay tuned for updates!";
    } else if (lowerMessage.includes('timer')) {
        return "The Timer feature lets you set a countdown for your viewing session. When the timer ends, video playback automatically pauses. Click the purple timer button, set your time, and click Start!";
    } else if (lowerMessage.includes('shutdown')) {
        return "Auto Shutdown helps you manage screen time. Set a time, and MeTube will automatically pause all video playback when the timer expires. Perfect for bedtime or limiting watch time!";
    } else if (lowerMessage.includes('shortcut') || lowerMessage.includes('keyboard')) {
        return "Here are some keyboard shortcuts:\n• Space - Play/Pause\n• F - Fullscreen\n• M - Mute\n• Arrow keys - Seek forward/backward\n• Esc - Exit fullscreen\nClick the keyboard icon in the footer for more!";
    } else if (lowerMessage.includes('dark mode') || lowerMessage.includes('theme')) {
        return "You can change themes by clicking the palette icon in the top right! We have Light, Dark, Sepia, and High Contrast modes available.";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello! 👋 I'm here to help you with MeTube. Feel free to ask me anything about features, recommendations, or how to use the app!";
    } else if (lowerMessage.includes('thank')) {
        return "You're welcome! Happy to help. Enjoy your videos! 🎬";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
        return "I can help you with:\n• Video recommendations\n• Timer and Auto Shutdown features\n• Keyboard shortcuts\n• Theme customization\n• Video summaries (coming soon)\n• Transcripts (coming soon)\nWhat would you like to know?";
    } else {
        return "I'm here to help! You can ask me about:\n• Video recommendations\n• How to use Timer and Auto Shutdown\n• Keyboard shortcuts\n• Theme options\n• Video summaries and transcripts (coming soon)\n• Any other MeTube features!";
    }
}

function playNotificationSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('feature-modal')) {
        e.target.classList.remove('active');
    }
});

// Helper function to pause all videos
function pauseAllVideos() {
    // Pause HTML5 video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
    
    // Pause YouTube iframes
    const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
    iframes.forEach(iframe => {
        try {
            // Send pause command to YouTube iframe
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {
            console.log('Cannot pause iframe video');
        }
    });
    
    // Pause any video player with ID
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer) {
        if (videoPlayer.tagName === 'VIDEO' && !videoPlayer.paused) {
            videoPlayer.pause();
        } else if (videoPlayer.tagName === 'IFRAME') {
            try {
                videoPlayer.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            } catch (e) {
                console.log('Cannot pause video player');
            }
        }
    }
}

// Initialize timer display
updateTimerDisplay();
