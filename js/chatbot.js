document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML dynamically so it works on all pages without duplicating HTML
    if (!document.getElementById('chatbot-container')) {
        const chatbotHTML = `
        <style>
            @keyframes slideUpFade {
                from { opacity: 0; transform: translateY(10px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .chat-msg-animate {
                animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            /* Custom scrollbar for chatbot */
            #chatbot-messages::-webkit-scrollbar { width: 4px; }
            #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
            #chatbot-messages::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
            #chatbot-messages::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        </style>
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-[100] font-sans">
            <div id="chatbot-window" class="hidden flex-col w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] bg-[#050505]/80 backdrop-blur-2xl border-t border-l border-white/10 border-b border-r border-black/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] mb-4 overflow-hidden transition-all duration-400 ease-out transform scale-95 opacity-0 origin-bottom-right">
                <div class="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
                    <div class="flex items-center gap-3">
                        <div class="relative flex h-2.5 w-2.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                        </div>
                        <h3 class="text-white font-semibold text-[15px] tracking-wide m-0 leading-none antialiased">AI Assistant</h3>
                    </div>
                    <button id="chatbot-close-btn" class="text-slate-400 hover:text-white transition-colors duration-300 hover:rotate-90" aria-label="Close Chat">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <div id="chatbot-messages" class="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scroll-smooth text-[13.5px] tracking-wide antialiased">
                    <div class="self-start max-w-[85%] chat-msg-animate">
                        <div class="inline-block px-4 py-3 rounded-2xl rounded-tl-sm bg-black/50 border border-white/5 text-slate-300 chat-markdown shadow-sm">
                            <p class="leading-relaxed">Hi! I'm an AI assistant trained on Nasrallah's portfolio. How can I help you today?</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <form id="chatbot-form" class="relative flex items-center">
                        <input type="text" id="chatbot-input" class="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 focus:ring-0 rounded-full pl-5 pr-12 py-3 text-[13px] text-white placeholder-slate-400 outline-none transition-all duration-300 shadow-inner" placeholder="Ask about his experience..." autocomplete="off">
                        <button type="submit" id="chatbot-send-btn" class="absolute right-1.5 w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-cyan-400 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed">
                            <i data-lucide="send" class="w-4 h-4 ml-0.5"></i>
                        </button>
                    </form>
                    <div class="text-[9px] uppercase tracking-widest text-center text-slate-600 mt-3 font-medium">AI can make mistakes</div>
                </div>
            </div>
            <button id="chatbot-toggle-btn" class="absolute bottom-0 right-0 w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_32px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center group" aria-label="Open Chat">
                <i data-lucide="sparkles" class="w-5 h-5 group-[.chat-open]:hidden text-cyan-400"></i>
                <i data-lucide="chevron-down" class="w-6 h-6 hidden group-[.chat-open]:block text-slate-300"></i>
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
        outer.className = (role === 'user' ? 'self-end max-w-[85%]' : 'self-start max-w-[85%]') + ' chat-msg-animate';

        const inner = document.createElement('div');
        if (role === 'user') {
            inner.className = 'inline-block px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 text-slate-200 shadow-sm leading-relaxed';
            inner.textContent = text;
        } else {
            inner.className = 'inline-block px-4 py-3 rounded-2xl rounded-tl-sm chat-markdown shadow-sm leading-relaxed '
                + (isError ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                           : 'bg-black/50 border border-white/5 text-slate-300');
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
        el.className = 'self-start max-w-[85%] chat-msg-animate';
        const dots = document.createElement('div');
        dots.className = 'inline-flex items-center gap-1.5 px-4 py-4 rounded-2xl rounded-tl-sm bg-black/50 border border-white/5 h-11 shadow-sm';
        for (let i = 0; i < 3; i++) {
            const d = document.createElement('div');
            d.className = 'w-1.5 h-1.5 bg-cyan-500/50 rounded-full typing-dot';
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
                body: JSON.stringify({ 
                    messages: history,
                    contextUrl: window.location.href,
                    contextTitle: document.title
                })
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
                    msg = typeof err.error === 'object' ? (err.error.message || JSON.stringify(err.error)) : err.error;
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
