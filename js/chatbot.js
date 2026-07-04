/*!
 * Portfolio AI Assistant — floating chat widget
 * ------------------------------------------------------------------
 * Drop-in, dependency-light chat widget. Self-injects its own markup
 * and styles, so it can be included on any page with a single
 * <script src="chatbot.js" defer></script> tag.
 *
 * Optional page dependencies (widget still works without them):
 *   - Tailwind CSS   — utility classes used throughout the markup
 *   - Lucide Icons   — https://unpkg.com/lucide  (window.lucide.createIcons)
 *   - marked         — https://cdn.jsdelivr.net/npm/marked/marked.min.js
 *   - DOMPurify      — https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js
 * marked + DOMPurify enable rich Markdown replies; without them the
 * widget safely falls back to plain text.
 *
 * Backend contract (unchanged from the original integration):
 *   POST {API_URL}  { messages: [{role, content}], contextUrl }
 *   -> 200 { reply: string }
 *   -> 4xx/5xx { code?, error? }
 * ------------------------------------------------------------------
 */
(function () {
    'use strict';

    // Guard against the script being included more than once on a page.
    if (window.__nrChatbotInitialized) return;
    window.__nrChatbotInitialized = true;

    document.addEventListener('DOMContentLoaded', init);

    // ---------------------------------------------------------------
    // Config
    // ---------------------------------------------------------------
    const CONFIG = {
        API_URL: 'https://api.nasrallahrafi.me/api/v1/chat',
        STORAGE_KEY: 'nr-chatbot-state-v1',
        STORAGE_TTL_MS: 24 * 60 * 60 * 1000, // conversations older than this start fresh
        MAX_MESSAGE_LENGTH: 2000,
        MAX_HISTORY_SENT: 20,       // trims the payload sent to the backend on long threads
        REQUEST_TIMEOUT_MS: 45000,
        TYPEWRITER_MAX_MS: 900,     // reveal is capped so long replies don't feel sluggish
        MAX_TEXTAREA_PX: 120,
        SUGGESTIONS: [
            { label: 'Projects', prompt: 'What projects have you worked on?' },
            { label: 'Skills', prompt: 'What are your technical skills?' },
            { label: 'Experience', prompt: 'Tell me about your work experience.' },
            { label: 'Contact', prompt: 'How can I get in touch with you?' }
        ]
    };

    // ---------------------------------------------------------------
    // State (module-scoped, populated in init)
    // ---------------------------------------------------------------
    let toggleBtn, closeBtn, clearBtn, windowEl, form, input, messages,
        sendBtn, stopBtn, scrollFab, charCounter, offlineBanner,
        statusText, announcer;

    let isChatOpen = false;
    let isWaiting = false;
    let hasInteracted = false;
    let manualCancel = false;
    let history = [];
    let currentController = null;
    let saveTimer = null;
    let lastFocusedBeforeOpen = null;

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    function init() {
        injectMarkup();
        cacheDom();
        wireEvents();
        restoreConversation();
        setOfflineState(!navigator.onLine);
        refreshIcons();
    }

    function injectMarkup() {
        if (document.getElementById('chatbot-container')) return;
        document.body.insertAdjacentHTML('beforeend', widgetMarkup());
    }

    function cacheDom() {
        toggleBtn = document.getElementById('chatbot-toggle-btn');
        closeBtn = document.getElementById('chatbot-close-btn');
        clearBtn = document.getElementById('chatbot-clear-btn');
        windowEl = document.getElementById('chatbot-window');
        form = document.getElementById('chatbot-form');
        input = document.getElementById('chatbot-input');
        messages = document.getElementById('chatbot-messages');
        sendBtn = document.getElementById('chatbot-send-btn');
        stopBtn = document.getElementById('chatbot-stop-btn');
        scrollFab = document.getElementById('chatbot-scroll-fab');
        charCounter = document.getElementById('chatbot-char-counter');
        offlineBanner = document.getElementById('chatbot-offline-banner');
        statusText = document.getElementById('chatbot-status-text');
        announcer = document.getElementById('chatbot-sr-announcer');
    }

    // ---------------------------------------------------------------
    // Markup (template strings, no framework dependency)
    // ---------------------------------------------------------------
    function widgetMarkup() {
        return `
        <style>
            /* ── Chatbot self-contained styles ─────────────────────────── */
            /* Sizing & layout classes missing from compiled Tailwind */
            #chatbot-window { background-color: rgba(5,5,5,0.98) !important; backdrop-filter: blur(24px) !important; -webkit-backdrop-filter: blur(24px) !important; }
            .w-\\[350px\\] { width: 350px; }
            @media (min-width:640px) { .sm\\:w-\\[400px\\] { width: 400px; } }
            .h-\\[auto\\] { height: auto; }
            .min-h-\\[300px\\] { min-height: 300px; }
            .max-h-\\[550px\\] { max-height: 550px; max-height: min(550px, calc(100vh - 7rem)); max-height: min(550px, calc(100dvh - 7rem)); }
            .max-h-\\[80vh\\] { max-height: 80vh; }
            .max-w-\\[90\\%\\] { max-width: 90%; }
            .max-w-\\[85\\%\\] { max-width: 85%; }
            .z-\\[100\\] { z-index: 100; }

            /* Custom font sizes */
            .text-\\[15px\\] { font-size: 15px; }
            .text-\\[13\\.5px\\] { font-size: 13.5px; }
            .text-\\[13px\\] { font-size: 13px; }
            .text-\\[11\\.5px\\] { font-size: 11.5px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-\\[10\\.5px\\] { font-size: 10.5px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[9px\\] { font-size: 9px; }

            /* Background colors */
            .bg-\\[\\#050505\\]\\/80 { background-color: rgba(5,5,5,0.8); }
            .bg-black { background-color: rgb(0,0,0); }
            .bg-black\\/80 { background-color: rgba(0,0,0,0.8); }
            .bg-black\\/50 { background-color: rgba(0,0,0,0.5); }
            .bg-black\\/40 { background-color: rgba(0,0,0,0.4); }
            .hover\\:bg-black:hover { background-color: rgb(0,0,0); }
            .bg-white\\/5 { background-color: rgba(255,255,255,0.05); }
            .bg-white\\/10 { background-color: rgba(255,255,255,0.1); }
            .hover\\:bg-white\\/5:hover { background-color: rgba(255,255,255,0.05); }
            .hover\\:bg-white\\/10:hover { background-color: rgba(255,255,255,0.1); }
            .hover\\:bg-white\\/20:hover { background-color: rgba(255,255,255,0.2); }
            .focus\\:bg-white\\/10:focus { background-color: rgba(255,255,255,0.1); }

            /* Border colors */
            .border-white\\/10 { border-color: rgba(255,255,255,0.1); }
            .border-white\\/5 { border-color: rgba(255,255,255,0.05); }
            .border-black\\/50 { border-color: rgba(0,0,0,0.5); }

            /* Error state (red) */
            .bg-red-950\\/40 { background-color: rgba(69,10,10,0.4); }
            .border-red-500\\/30 { border-color: rgba(239,68,68,0.3); }
            .text-red-300 { color: rgb(252,165,165); }
            .text-red-400 { color: rgb(248,113,113); }
            .hover\\:text-red-200:hover { color: rgb(254,202,202); }

            /* Offline banner (amber) */
            .bg-amber-500\\/10 { background-color: rgba(245,158,11,0.1); }
            .text-amber-300 { color: rgb(252,211,77); }
            .border-amber-500\\/20 { border-color: rgba(245,158,11,0.2); }

            /* Transition duration */
            .duration-400 { transition-duration: 400ms; }

            /* Shadow utilities — applied via IDs to avoid CSS escape conflicts in JS template literals */
            #chatbot-window { box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(var(--primary-rgb, 6, 182, 212), 0.15), 0 0 40px -12px rgba(var(--primary-rgb, 6, 182, 212), 0.25); }
            #chatbot-container .bot-toggle-btn { box-shadow: none; }
            [id="chatbot-toggle-btn"] [data-lucide="bot"] { filter: drop-shadow(0 0 8px rgba(var(--primary-rgb, 6, 182, 212), 0.8)); }

            /* Group toggle for open/close icon swap */
            .group.chat-open .group-\\[\\.chat-open\\]\\:hidden { display: none; }
            .group.chat-open .group-\\[\\.chat-open\\]\\:block { display: block; }

            /* Missing Tailwind Utilities */
            .pointer-events-auto { pointer-events: auto !important; }

            /* ── Adaptive theming ──────────────────────────────────────────
               The widget is self-contained and looks right dropped onto any
               page (falls back to the original cyan brand color below). But
               if the host page defines --accent-color / --primary-rgb (this
               portfolio's Glass/Volt/Deep Sea/Obsidian theme system), the
               widget picks those up automatically — including live, the
               instant the visitor switches themes, since CSS variables
               re-cascade the moment the theme class changes. No JS wiring
               needed for this to stay in sync. */
            .text-cyan-300, .text-cyan-400,
            .hover\\:text-cyan-300:hover, .hover\\:text-cyan-400:hover {
                color: var(--accent-color, #06b6d4) !important;
            }
            .text-cyan-400\\/70 { color: rgba(var(--primary-rgb, 6, 182, 212), 0.7) !important; }
            .bg-cyan-400, .bg-cyan-500 { background-color: var(--accent-color, #06b6d4) !important; }
            .bg-cyan-500\\/50 { background-color: rgba(var(--primary-rgb, 6, 182, 212), 0.5) !important; }
            .hover\\:border-cyan-400:hover { border-color: var(--accent-color, #06b6d4) !important; }
            .border-cyan-500\\/50, .focus\\:border-cyan-500\\/50:focus { border-color: rgba(var(--primary-rgb, 6, 182, 212), 0.5) !important; }
            .border-cyan-500\\/40, .hover\\:border-cyan-500\\/40:hover { border-color: rgba(var(--primary-rgb, 6, 182, 212), 0.4) !important; }
            .border-cyan-500\\/30 { border-color: rgba(var(--primary-rgb, 6, 182, 212), 0.3) !important; }
            .from-cyan-500\\/30.to-cyan-500\\/5 {
                background-image: linear-gradient(to bottom right, rgba(var(--primary-rgb, 6, 182, 212), 0.3), rgba(var(--primary-rgb, 6, 182, 212), 0.05)) !important;
            }

            /* ── Animations ────────────────────────────────────────────── */
            @keyframes slideUpFade { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes botPulse { 0% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 6, 182, 212), 0.6); } 70% { box-shadow: 0 0 0 15px rgba(var(--primary-rgb, 6, 182, 212), 0); } 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb, 6, 182, 212), 0); } }
            @keyframes botFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes botEyeBlink { 0%, 96%, 98% { opacity: 1; transform: scaleY(1); } 97% { opacity: 0.5; transform: scaleY(0.1); } }
            @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }
            @keyframes fabPop { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
            .chat-msg-animate { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            .bot-toggle-btn { animation: botFloat 4s ease-in-out infinite; }
            .bot-icon-animate { animation: botEyeBlink 4s infinite; }
            .typing-dot { animation: typingBounce 1.1s ease-in-out infinite; }
            .chatbot-fab-in { animation: fabPop 0.2s ease-out forwards; }
            #chatbot-messages { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.35) transparent; }
            #chatbot-messages::-webkit-scrollbar { width: 6px; }
            #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
            #chatbot-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 4px; }
            #chatbot-messages::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.55); }
            #chatbot-messages { mask-image: linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%); -webkit-mask-image: linear-gradient(to bottom, transparent 0, black 20px, black calc(100% - 20px), transparent 100%); }
            #chatbot-input { resize: none; max-height: ${CONFIG.MAX_TEXTAREA_PX}px; overflow-y: hidden; }
            #chatbot-input::-webkit-scrollbar { width: 4px; }
            #chatbot-input::-webkit-scrollbar-track { background: transparent; }
            #chatbot-input::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            #chatbot-input::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            .chatbot-msg-actions { opacity: 0; transition: opacity 0.15s ease; }
            .chatbot-ai-row:hover .chatbot-msg-actions,
            .chatbot-msg-actions:focus-within { opacity: 1; }
            #chatbot-toggle-btn:focus-visible,
            #chatbot-close-btn:focus-visible,
            #chatbot-clear-btn:focus-visible,
            #chatbot-send-btn:focus-visible,
            #chatbot-stop-btn:focus-visible,
            .suggestion-chip:focus-visible,
            .chatbot-msg-action-btn:focus-visible,
            #chatbot-input:focus-visible { outline: 2px solid rgba(var(--primary-rgb, 34, 211, 238), 0.8); outline-offset: 2px; }
            @media (prefers-reduced-motion: reduce) {
                .bot-toggle-btn, .bot-icon-animate, .typing-dot, .chat-msg-animate, .chatbot-fab-in { animation: none !important; }
                #chatbot-window { transition: opacity 0.15s ease !important; }
            }
        </style>
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-[100] font-sans flex flex-col items-end gap-4 pointer-events-none">
            <div id="chatbot-window" role="dialog" aria-label="Chat with AI Assistant" class="hidden flex-col w-[350px] sm:w-[400px] h-auto min-h-[300px] max-h-[550px] bg-[#050505]/80 backdrop-blur-2xl border-t border-l border-white/10 border-b border-r border-black/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-400 ease-out transform scale-95 opacity-0 origin-bottom-right pointer-events-auto">
                <div class="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
                    <div class="flex items-center gap-3">
                        <div class="relative flex h-2.5 w-2.5 mt-0.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" style="box-shadow: 0 0 8px rgba(var(--primary-rgb, 6, 182, 212), 0.8);"></span>
                        </div>
                        <div>
                            <h3 class="text-white font-semibold text-[15px] tracking-wide m-0 leading-none antialiased">AI Assistant</h3>
                            <p id="chatbot-status-text" class="text-[10.5px] text-cyan-400/70 m-0 leading-none mt-1">Online</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button id="chatbot-clear-btn" type="button" class="text-slate-500 hover:text-white transition-colors duration-300 p-1.5 rounded-full hover:bg-white/5" aria-label="Clear conversation" title="Clear conversation">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5" aria-hidden="true"></i>
                        </button>
                        <button id="chatbot-close-btn" type="button" class="text-slate-400 hover:text-white transition-colors duration-300 hover:rotate-90 p-1.5 rounded-full hover:bg-white/5" aria-label="Close chat">
                            <i data-lucide="x" class="w-4 h-4" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div id="chatbot-offline-banner" class="hidden px-4 py-2 text-[11px] text-center bg-amber-500/10 text-amber-300 border-b border-amber-500/20">You're offline — messages can't be sent right now.</div>
                <div class="relative flex-1 flex flex-col min-h-0">
                    <div id="chatbot-messages" role="log" aria-label="Conversation" class="flex-1 min-h-0 p-5 overflow-y-auto flex flex-col gap-4 scroll-smooth text-[13.5px] tracking-wide antialiased">
                        ${greetingBlockHTML()}
                    </div>
                    <button id="chatbot-scroll-fab" type="button" class="hidden absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium shadow-lg hover:bg-black transition-colors chatbot-fab-in">
                        <i data-lucide="arrow-down" class="w-3 h-3" aria-hidden="true"></i> New messages
                    </button>
                </div>
                <div class="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <form id="chatbot-form" class="relative flex items-end">
                        <span id="chatbot-char-counter" class="hidden absolute -top-5 right-1 text-[10px] text-slate-500"></span>
                        <textarea id="chatbot-input" rows="1" maxlength="${CONFIG.MAX_MESSAGE_LENGTH}" class="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 focus:ring-0 rounded-2xl pl-4 pr-12 py-3 text-[14px] text-white placeholder-slate-400 outline-none transition-all duration-300 shadow-inner" placeholder="Ask about his experience..." aria-label="Message"></textarea>
                        <button type="submit" id="chatbot-send-btn" class="absolute w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-cyan-400 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed" style="right: 0.5rem; bottom: 0.5rem;" aria-label="Send message">
                            <i data-lucide="send" class="w-4 h-4 ml-0.5" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="chatbot-stop-btn" class="hidden absolute w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-red-400 transition-colors duration-300" style="right: 0.5rem; bottom: 0.5rem;" aria-label="Stop generating">
                            <i data-lucide="square" class="w-3.5 h-3.5" aria-hidden="true"></i>
                        </button>
                    </form>
                    <div class="text-[9px] uppercase tracking-wider text-center text-slate-500 mt-2.5 font-medium">AI can make mistakes</div>
                </div>
            </div>
            <button id="chatbot-toggle-btn" type="button" class="w-14 h-14 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/50 text-white hover:bg-black hover:border-cyan-400 transition-all duration-300 flex items-center justify-center group bot-toggle-btn pointer-events-auto" aria-label="Open chat" aria-expanded="false">
                <i data-lucide="bot" class="w-6 h-6 group-[.chat-open]:hidden text-cyan-400 bot-icon-animate" style="filter: drop-shadow(0 0 8px rgba(var(--primary-rgb, 6, 182, 212), 0.8));" aria-hidden="true"></i>
                <i data-lucide="chevron-down" class="w-6 h-6 hidden group-[.chat-open]:block text-cyan-300" aria-hidden="true"></i>
            </button>
        </div>
        <div id="chatbot-sr-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>`;
    }

    function greetingBlockHTML() {
        const chips = CONFIG.SUGGESTIONS.map(function (s) {
            return '<button type="button" class="suggestion-chip px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 text-[12px] text-slate-300 hover:text-cyan-300 transition-all duration-200" data-prompt="' + s.prompt.replace(/"/g, '&quot;') + '">' + s.label + '</button>';
        }).join('');
        return '<div id="chatbot-greeting" class="self-start max-w-[90%] chat-msg-animate">'
            + '<div class="flex items-start gap-3">' + avatarHTML()
            + '<div class="inline-block px-5 py-4 rounded-2xl rounded-tl-sm bg-black/50 border border-white/5 text-slate-300 chat-markdown shadow-sm">'
            + '<p class="leading-relaxed m-0">Hi! I\'m an AI assistant trained on Nasrallah\'s portfolio. How can I help you today?</p></div></div>'
            + '<div id="chatbot-suggestions" class="flex flex-wrap gap-2 mt-3 pl-9">' + chips + '</div></div>';
    }

    function avatarHTML() {
        return '<div class="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 border border-cyan-500/30 flex items-center justify-center mt-0.5" aria-hidden="true"><i data-lucide="bot" class="w-3 h-3 text-cyan-400"></i></div>';
    }

    // ---------------------------------------------------------------
    // Event wiring
    // ---------------------------------------------------------------
    function wireEvents() {
        toggleBtn.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);
        clearBtn.addEventListener('click', clearConversation);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isChatOpen) toggleChat();
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            sendMessage(input.value);
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input.value);
            }
        });

        input.addEventListener('input', function () {
            autoGrowInput();
            updateCharCounter();
        });

        stopBtn.addEventListener('click', function () {
            if (currentController) {
                manualCancel = true;
                currentController.abort();
            }
        });

        scrollFab.addEventListener('click', function () {
            scrollToBottom(true);
        });

        messages.addEventListener('scroll', function () {
            scrollFab.classList.toggle('hidden', isNearBottom());
        });

        // Event delegation: covers both the static greeting chips and
        // any chips re-rendered after a "Clear conversation".
        messages.addEventListener('click', function (e) {
            const chip = e.target.closest('.suggestion-chip');
            if (chip) sendMessage(chip.dataset.prompt);
        });

        window.addEventListener('online', function () { setOfflineState(false); });
        window.addEventListener('offline', function () { setOfflineState(true); });
    }

    // ---------------------------------------------------------------
    // Open / close
    // ---------------------------------------------------------------
    function toggleChat() {
        isChatOpen = !isChatOpen;
        toggleBtn.setAttribute('aria-expanded', String(isChatOpen));
        toggleBtn.setAttribute('aria-label', isChatOpen ? 'Close chat' : 'Open chat');

        if (isChatOpen) {
            lastFocusedBeforeOpen = document.activeElement;
            windowEl.classList.remove('hidden');
            windowEl.classList.add('flex');
            requestAnimationFrame(function () {
                windowEl.classList.remove('opacity-0', 'scale-95');
                windowEl.classList.add('opacity-100', 'scale-100');
            });
            toggleBtn.classList.add('chat-open');
            input.focus();
            refreshIcons();
        } else {
            windowEl.classList.remove('opacity-100', 'scale-100');
            windowEl.classList.add('opacity-0', 'scale-95');
            toggleBtn.classList.remove('chat-open');
            setTimeout(function () {
                windowEl.classList.add('hidden');
                windowEl.classList.remove('flex');
            }, 300);
            if (lastFocusedBeforeOpen && lastFocusedBeforeOpen.focus) lastFocusedBeforeOpen.focus();
        }
    }

    // ---------------------------------------------------------------
    // Sending messages
    // ---------------------------------------------------------------
    async function sendMessage(rawText) {
        const text = (rawText || '').trim();
        if (!text || isWaiting || text.length > CONFIG.MAX_MESSAGE_LENGTH) return;

        if (!navigator.onLine) {
            renderAssistantBubble('You\u2019re offline. Reconnect and try again.', { isError: true, retryText: text });
            return;
        }

        hasInteracted = true;
        hideSuggestions();
        input.value = '';
        autoGrowInput();
        updateCharCounter();

        renderUserBubble(text);
        history.push({ role: 'user', content: text });
        persistState();

        isWaiting = true;
        manualCancel = false;
        setBusyUI(true);
        showTyping();

        const controller = new AbortController();
        currentController = controller;
        const timeoutId = setTimeout(function () { controller.abort(); }, CONFIG.REQUEST_TIMEOUT_MS);

        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.slice(-CONFIG.MAX_HISTORY_SENT),
                    contextUrl: window.location.href
                }),
                signal: controller.signal
            });

            hideTyping();

            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                let msg = 'An unexpected error occurred. Please try again.';
                if (res.status === 429) {
                    if (err.code === 'BUDGET_EXCEEDED') msg = 'I\u2019ve reached my daily limits. Please email Nasrallah directly.';
                    else if (err.code === 'RATE_LIMIT_EXCEEDED') msg = 'You\u2019re sending messages too fast. Please slow down.';
                    else msg = 'Too many requests. Please try again later.';
                } else if (res.status === 503) {
                    msg = 'The AI provider is currently overloaded. Please try again later.';
                } else if (err.error) {
                    msg = typeof err.error === 'object' ? (err.error.message || JSON.stringify(err.error)) : err.error;
                }
                renderAssistantBubble(msg, { isError: true, retryText: text });
                history.pop();
                persistState();
            } else {
                const data = await res.json();
                if (data && data.reply) {
                    history.push({ role: 'assistant', content: data.reply });
                    persistState();
                    await renderAssistantBubble(data.reply, { animate: true, latest: true });
                } else {
                    throw new Error('Invalid response');
                }
            }
        } catch (err) {
            hideTyping();
            if (err.name === 'AbortError') {
                const msg = manualCancel ? 'Message cancelled.' : 'The request timed out. Please try again.';
                renderAssistantBubble(msg, { isError: true, retryText: text });
            } else {
                console.error('Chat API Error:', err);
                renderAssistantBubble('Network error. Please check your connection and try again.', { isError: true, retryText: text });
            }
            history.pop();
            persistState();
        } finally {
            clearTimeout(timeoutId);
            currentController = null;
            isWaiting = false;
            setBusyUI(false);
            input.focus();
        }
    }

    function setBusyUI(busy) {
        sendBtn.classList.toggle('hidden', busy);
        stopBtn.classList.toggle('hidden', !busy);
        sendBtn.disabled = busy;
        statusText.textContent = busy ? 'Typing\u2026' : (navigator.onLine ? 'Online' : 'Offline');
    }

    function clearConversation() {
        if (isWaiting) return;
        history = [];
        clearPersistedState();
        hasInteracted = false;
        messages.innerHTML = greetingBlockHTML();
        refreshIcons();
        scrollFab.classList.add('hidden');
    }

    function hideSuggestions() {
        const el = document.getElementById('chatbot-suggestions');
        if (el) el.remove();
    }

    // ---------------------------------------------------------------
    // Rendering messages
    // ---------------------------------------------------------------
    function renderUserBubble(text) {
        const outer = document.createElement('div');
        outer.className = 'self-end max-w-[85%] chat-msg-animate';
        const inner = document.createElement('div');
        inner.className = 'inline-block px-5 py-4 rounded-2xl rounded-tr-sm bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 text-slate-200 shadow-sm leading-relaxed';
        inner.textContent = text;
        outer.appendChild(inner);
        outer.appendChild(timestampEl('text-right pr-1'));
        appendToLog(outer);
    }

    // Renders an assistant or error/system bubble. Returns a Promise
    // that resolves once any typewriter animation has finished.
    function renderAssistantBubble(text, opts) {
        opts = opts || {};
        const isError = !!opts.isError;
        removeStaleRegenerateButtons();

        const outer = document.createElement('div');
        outer.className = 'self-start max-w-[90%] chat-msg-animate chatbot-ai-row';

        const row = document.createElement('div');
        row.className = 'flex items-start gap-3';
        row.innerHTML = avatarHTML();

        const inner = document.createElement('div');
        inner.className = 'inline-block px-5 py-4 rounded-2xl rounded-tl-sm chat-markdown shadow-sm leading-relaxed '
            + (isError ? 'bg-red-950/40 border border-red-500/30 text-red-300' : 'bg-black/50 border border-white/5 text-slate-300');
        row.appendChild(inner);
        outer.appendChild(row);
        outer.appendChild(timestampEl('pl-10'));

        if (isError) {
            inner.textContent = text;
            if (opts.retryText) {
                const retryBtn = document.createElement('button');
                retryBtn.type = 'button';
                retryBtn.className = 'mt-2 block text-[11px] font-medium text-red-300 hover:text-red-200 underline underline-offset-2';
                retryBtn.textContent = 'Try again';
                retryBtn.addEventListener('click', function () { sendMessage(opts.retryText); });
                inner.appendChild(retryBtn);
            }
            appendToLog(outer);
            return Promise.resolve();
        }

        appendToLog(outer);
        const shouldStick = isNearBottom();

        if (opts.animate) {
            return revealText(inner, text, shouldStick).then(function () {
                attachMessageActions(row, text, !!opts.latest);
                refreshIcons();
                announce(text);
            });
        }

        renderMarkdownInto(inner, text);
        attachMessageActions(row, text, !!opts.latest);
        refreshIcons();
        return Promise.resolve();
    }

    function appendToLog(el) {
        messages.appendChild(el);
        refreshIcons();
        if (isNearBottom()) scrollToBottom();
    }

    function renderMarkdownInto(el, text) {
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            el.innerHTML = DOMPurify.sanitize(marked.parse(text));
        } else {
            el.textContent = text;
        }
    }

    // Lightweight client-side "typewriter" reveal. Plain text is
    // streamed in progressively, then swapped for sanitized Markdown
    // once complete — this avoids ever rendering half-formed HTML.
    function revealText(el, fullText, shouldStick) {
        if (prefersReducedMotion() || fullText.length < 2) {
            renderMarkdownInto(el, fullText);
            return Promise.resolve();
        }
        return new Promise(function (resolve) {
            const total = Math.min(CONFIG.TYPEWRITER_MAX_MS, 250 + fullText.length * 4);
            const start = performance.now();
            let skipped = false;
            function skip() { skipped = true; }
            el.addEventListener('click', skip, { once: true });

            function tick(now) {
                const progress = skipped ? 1 : Math.min(1, (now - start) / total);
                el.textContent = fullText.slice(0, Math.floor(fullText.length * progress));
                if (shouldStick && isNearBottom()) scrollToBottom();
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.removeEventListener('click', skip);
                    renderMarkdownInto(el, fullText);
                    resolve();
                }
            }
            requestAnimationFrame(tick);
        });
    }

    function attachMessageActions(row, rawText, isLatest) {
        const bar = document.createElement('div');
        bar.className = 'chatbot-msg-actions flex items-center gap-2 mt-1 ml-8';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'chatbot-msg-action-btn inline-flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-cyan-300 transition-colors';
        copyBtn.innerHTML = '<i data-lucide="copy" class="w-3 h-3" aria-hidden="true"></i><span>Copy</span>';
        copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(rawText).then(function () {
                const label = copyBtn.querySelector('span');
                const original = label.textContent;
                label.textContent = 'Copied';
                setTimeout(function () { label.textContent = original; }, 1500);
            }).catch(function () { /* clipboard unavailable — silently ignore */ });
        });
        bar.appendChild(copyBtn);

        if (isLatest) {
            const regenBtn = document.createElement('button');
            regenBtn.type = 'button';
            regenBtn.dataset.regenerate = 'true';
            regenBtn.className = 'chatbot-msg-action-btn inline-flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-cyan-300 transition-colors';
            regenBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3" aria-hidden="true"></i><span>Regenerate</span>';
            regenBtn.addEventListener('click', function () { regenerateLast(); });
            bar.appendChild(regenBtn);
        }

        row.parentElement.appendChild(bar);
    }

    function removeStaleRegenerateButtons() {
        messages.querySelectorAll('[data-regenerate]').forEach(function (btn) {
            btn.closest('.chatbot-msg-actions').remove();
        });
    }

    function regenerateLast() {
        if (isWaiting) return;
        // Find the last user turn so we can resend the same request.
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                // Drop the trailing assistant reply from state; its bubble
                // stays visible for context but is no longer "latest".
                if (history[history.length - 1].role === 'assistant') history.pop();
                removeStaleRegenerateButtons();
                persistState();
                sendMessage(history.pop().content);
                return;
            }
        }
    }

    function showTyping() {
        const el = document.createElement('div');
        el.id = 'chatbot-typing-indicator';
        el.className = 'self-start max-w-[85%] chat-msg-animate flex items-start gap-3';
        el.innerHTML = avatarHTML();
        const dots = document.createElement('div');
        dots.className = 'inline-flex items-center gap-1.5 px-4 py-4 rounded-2xl rounded-tl-sm bg-black/50 border border-white/5 h-11 shadow-sm';
        for (let i = 0; i < 3; i++) {
            const d = document.createElement('div');
            d.className = 'w-1.5 h-1.5 bg-cyan-500/50 rounded-full typing-dot';
            d.style.animationDelay = (i * 0.15) + 's';
            dots.appendChild(d);
        }
        el.appendChild(dots);
        appendToLog(el);
    }

    function hideTyping() {
        const el = document.getElementById('chatbot-typing-indicator');
        if (el) el.remove();
    }

    function timestampEl(extraClass) {
        const span = document.createElement('span');
        span.className = 'block text-[10px] text-slate-600 mt-1 ' + extraClass;
        span.textContent = formatTime(new Date());
        return span;
    }

    function formatTime(date) {
        try {
            return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    }

    // ---------------------------------------------------------------
    // Scroll helpers
    // ---------------------------------------------------------------
    function isNearBottom() {
        return messages.scrollHeight - messages.scrollTop - messages.clientHeight < 80;
    }

    function scrollToBottom(smooth) {
        if (smooth) {
            messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
        } else {
            messages.scrollTop = messages.scrollHeight;
        }
        scrollFab.classList.add('hidden');
    }

    // ---------------------------------------------------------------
    // Input helpers
    // ---------------------------------------------------------------
    function autoGrowInput() {
        input.style.height = 'auto';
        const atCap = input.scrollHeight > CONFIG.MAX_TEXTAREA_PX;
        input.style.height = Math.min(input.scrollHeight, CONFIG.MAX_TEXTAREA_PX) + 'px';
        // Only show a scrollbar once content genuinely exceeds the cap —
        // otherwise rows="1" plus padding can make the box report 1-2px
        // of "overflow" with nothing actually hidden, showing a phantom
        // scrollbar (styled by the page's global 10px cyan scrollbar CSS).
        input.style.overflowY = atCap ? 'auto' : 'hidden';
    }

    function updateCharCounter() {
        const len = input.value.length;
        const threshold = CONFIG.MAX_MESSAGE_LENGTH * 0.8;
        if (len >= threshold) {
            charCounter.textContent = len + ' / ' + CONFIG.MAX_MESSAGE_LENGTH;
            charCounter.classList.remove('hidden');
            charCounter.classList.toggle('text-red-400', len >= CONFIG.MAX_MESSAGE_LENGTH);
            charCounter.classList.toggle('text-slate-500', len < CONFIG.MAX_MESSAGE_LENGTH);
        } else {
            charCounter.classList.add('hidden');
        }
    }

    function setOfflineState(isOffline) {
        offlineBanner.classList.toggle('hidden', !isOffline);
        input.disabled = isOffline;
        sendBtn.disabled = isOffline || isWaiting;
        if (!isWaiting) statusText.textContent = isOffline ? 'Offline' : 'Online';
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function announce(text) {
        if (!announcer) return;
        announcer.textContent = '';
        // Re-set on next tick so assistive tech reliably announces repeats.
        setTimeout(function () { announcer.textContent = 'Assistant replied: ' + text; }, 30);
    }

    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // ---------------------------------------------------------------
    // Persistence (localStorage) — conversation survives reloads for
    // a rolling 24h window, namespaced so it won't collide with other
    // scripts on the page.
    // ---------------------------------------------------------------
    function restoreConversation() {
        const saved = loadPersistedState();
        if (!saved || !saved.history.length) return;

        history = saved.history;
        hasInteracted = true;
        hideSuggestions();

        history.forEach(function (turn) {
            if (turn.role === 'user') {
                renderUserBubble(turn.content);
            } else {
                renderAssistantBubble(turn.content, { animate: false, latest: false });
            }
        });

        // Only the most recent assistant reply should offer "Regenerate".
        const lastAi = messages.querySelectorAll('.chatbot-ai-row');
        if (lastAi.length) {
            const row = lastAi[lastAi.length - 1].querySelector('.flex.items-start.gap-3');
            const rawText = history[history.length - 1] && history[history.length - 1].role === 'assistant'
                ? history[history.length - 1].content
                : null;
            if (row && rawText) attachMessageActions(row, rawText, true);
        }

        refreshIcons();
        scrollToBottom();
    }

    function loadPersistedState() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.history)) return null;
            if (Date.now() - (parsed.savedAt || 0) > CONFIG.STORAGE_TTL_MS) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }
            return parsed;
        } catch (e) {
            console.warn('[chatbot] Could not restore saved conversation:', e);
            return null;
        }
    }

    function persistState() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ history: history, savedAt: Date.now() }));
            } catch (e) {
                console.warn('[chatbot] Could not save conversation:', e);
            }
        }, 250);
    }

    function clearPersistedState() {
        try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (e) { /* storage unavailable — ignore */ }
    }
})();
