document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML dynamically so it works on all pages without duplicating HTML
    if (!document.getElementById('chatbot-container')) {
        const chatbotHTML = `
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-[100] font-sans">
            <div id="chatbot-window" class="hidden flex-col w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] glass border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 mb-4 overflow-hidden transition-all duration-300 transform scale-95 opacity-0 origin-bottom-right">
                <div class="flex items-center justify-between px-4 py-3 bg-cyan-900/40 border-b border-cyan-500/30">
                    <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                        <h3 class="text-white font-bold text-lg m-0 leading-none tracking-tight">AI Assistant</h3>
                    </div>
                    <button id="chatbot-close-btn" class="text-slate-300 hover:text-white transition-colors" aria-label="Close Chat">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto flex flex-col gap-3 scroll-smooth text-sm">
                    <div class="self-start max-w-[85%]">
                        <div class="inline-block p-3 rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700 text-slate-200 chat-markdown">
                            <p>Hi! I'm an AI assistant trained on Nasrallah's portfolio. How can I help you today?</p>
                        </div>
                    </div>
                </div>
                <div class="p-3 bg-slate-900/60 border-t border-cyan-500/20">
                    <form id="chatbot-form" class="flex items-center gap-2">
                        <input type="text" id="chatbot-input" class="flex-1 bg-slate-800/50 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-full px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-all" placeholder="Ask about his experience..." autocomplete="off">
                        <button type="submit" id="chatbot-send-btn" class="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <i data-lucide="send" class="w-4 h-4 ml-0.5"></i>
                        </button>
                    </form>
                    <div class="text-[10px] text-center text-slate-500 mt-2">AI can make mistakes.</div>
                </div>
            </div>
            <button id="chatbot-toggle-btn" class="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-200 flex items-center justify-center group" aria-label="Open Chat">
                <i data-lucide="message-circle" class="w-6 h-6 group-[.chat-open]:hidden"></i>
                <i data-lucide="chevron-down" class="w-6 h-6 hidden group-[.chat-open]:block"></i>
            </button>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        if (window.lucide) window.lucide.createIcons();
    }

    const toggleBtn  = document.getElementById('chatbot-toggle-btn');
    const closeBtn   = document.getElementById('chatbot-close-btn');
    const windowEl   = document.getElementById('chatbot-window');
    const form       = document.getElementById('chatbot-form');
    const input      = document.getElementById('chatbot-input');
    const messages   = document.getElementById('chatbot-messages');
    const sendBtn    = document.getElementById('chatbot-send-btn');

    let isChatOpen = false;
    let isWaiting  = false;
    let history    = [];

    const API_URL = 'https://api.nasrallahrafi.me/api/v1/chat';

    function toggleChat() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            windowEl.classList.remove('hidden');
            windowEl.classList.add('flex');
            setTimeout(() => {
                windowEl.classList.remove('opacity-0', 'scale-95');
                windowEl.classList.add('opacity-100', 'scale-100');
            }, 10);
            toggleBtn.classList.add('chat-open');
            input.focus();
            if (window.lucide) window.lucide.createIcons();
        } else {
            windowEl.classList.remove('opacity-100', 'scale-100');
            windowEl.classList.add('opacity-0', 'scale-95');
            toggleBtn.classList.remove('chat-open');
            setTimeout(() => {
                windowEl.classList.add('hidden');
                windowEl.classList.remove('flex');
            }, 300);
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function scrollToBottom() {
        messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, role, isError) {
        const outer = document.createElement('div');
        outer.className = role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[85%]';

        const inner = document.createElement('div');
        if (role === 'user') {
            inner.className = 'inline-block p-3 rounded-2xl rounded-tr-sm bg-cyan-600 text-white';
            inner.textContent = text;
        } else {
            inner.className = 'inline-block p-3 rounded-2xl rounded-tl-sm chat-markdown '
                + (isError ? 'bg-red-900/50 border border-red-500/50 text-red-200'
                           : 'bg-slate-800 border border-slate-700 text-slate-200');
            if (isError) {
                inner.textContent = text;
            } else if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
                inner.innerHTML = DOMPurify.sanitize(marked.parse(text));
            } else {
                inner.textContent = text;
            }
        }
        outer.appendChild(inner);
        messages.appendChild(outer);
        scrollToBottom();
    }

    function showTyping() {
        const el = document.createElement('div');
        el.id = 'chatbot-typing-indicator';
        el.className = 'self-start max-w-[85%]';
        const dots = document.createElement('div');
        dots.className = 'inline-flex items-center gap-1 p-3 px-4 rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700 h-11';
        for (let i = 0; i < 3; i++) {
            const d = document.createElement('div');
            d.className = 'w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot';
            dots.appendChild(d);
        }
        el.appendChild(dots);
        messages.appendChild(el);
        scrollToBottom();
    }

    function hideTyping() {
        const el = document.getElementById('chatbot-typing-indicator');
        if (el) el.remove();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || isWaiting) return;

        input.value = '';
        isWaiting = true;
        sendBtn.disabled = true;

        addMessage(text, 'user');
        history.push({ role: 'user', content: text });
        showTyping();

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history })
            });

            hideTyping();

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                let msg = 'An unexpected error occurred. Please try again.';
                if (res.status === 429) {
                    if (err.code === 'BUDGET_EXCEEDED')
                        msg = "I've reached my daily limits. Please email Nasrallah directly.";
                    else if (err.code === 'RATE_LIMIT_EXCEEDED')
                        msg = "You're sending messages too fast. Please slow down.";
                    else msg = 'Too many requests. Please try again later.';
                } else if (res.status === 503) {
                    msg = 'The AI provider is currently overloaded. Please try again later.';
                } else if (err.error) {
                    msg = err.error;
                }
                addMessage(msg, 'system', true);
                history.pop();
            } else {
                const data = await res.json();
                if (data && data.reply) {
                    addMessage(data.reply, 'ai');
                    history.push({ role: 'model', content: data.reply });
                } else {
                    throw new Error('Invalid response');
                }
            }
        } catch (err) {
            hideTyping();
            console.error('Chat API Error:', err);
            addMessage('Network error. Please check your connection and try again.', 'system', true);
            history.pop();
        } finally {
            isWaiting = false;
            sendBtn.disabled = false;
            input.focus();
        }
    });
});
