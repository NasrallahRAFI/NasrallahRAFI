/*!
 * Ask Rafi — floating chat widget
 * ------------------------------------------------------------------
 * Drop-in, dependency-light chat widget. Self-injects its own markup
 * and styles, so it can be included on any page with a single
 * <script src="chatbot.js" defer></script> tag.
 *
 * Optional page dependencies (widget still works without them):
 *   - Tailwind CSS   — utility classes used throughout the markup
 *   - Lucide Icons   — https://unpkg.com/lucide  (window.lucide.createIcons)
*   - marked         — js/vendor/marked.min.js
*   - DOMPurify      — js/vendor/purify.min.js
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
        CTA_TRIGGER_TURN: 3,        // assistant reply count before showing recruiter CTA card
        MAX_PERSISTED_HISTORY: 40,
        MAX_PERSISTED_CONTENT_LENGTH: 12000,
        API_HEALTH_URL: 'https://api.nasrallahrafi.me/api/v1/health/live',
        API_HEALTH_TIMEOUT_MS: 3000,
        API_HEALTH_INTERVAL_MS: 60000
    };

    const PAGE_CONTENT = {
        default: {
            en: {
                teaser: "Curious about Rafi's work? Ask me anything.",
                suggestions: [
                    "What are Rafi's strongest engineering skills?",
                    'Tell me about the BMS project',
                    "Walk me through his experience",
                    'How can I contact Rafi?'
                ]
            },
            fr: {
                teaser: 'Curieux du travail de Rafi ? Demandez-moi.',
                suggestions: [
                    'Quelles sont les plus grandes compétences de Rafi ?',
                    'Parlez-moi du projet BMS',
                    'Présentez-moi son expérience',
                    'Comment puis-je contacter Rafi ?'
                ]
            }
        },
        bms: {
            en: {
                teaser: 'Curious about this BMS project? Ask me.',
                suggestions: [
                    'Explain the BMS architecture',
                    'What did Rafi build?',
                    'How was the SOC estimator validated?',
                    'What technologies were used?'
                ]
            },
            fr: {
                teaser: 'Curieux de ce projet BMS ? Demandez-moi.',
                suggestions: [
                    "Expliquez l'architecture du BMS",
                    "Qu'a construit Rafi ?",
                    "Comment l'estimateur de SOC a-t-il été validé ?",
                    'Quelles technologies ont été utilisées ?'
                ]
            }
        },
        waveguide: {
            en: {
                teaser: 'Want the story behind this waveguide design? Ask me.',
                suggestions: [
                    'Explain the TE10 mode',
                    'What was simulated in HFSS?',
                    'Why was Alumina used?',
                    'What was the design goal?'
                ]
            },
            fr: {
                teaser: 'Envie de connaître l’histoire de ce guide d’ondes ? Demandez-moi.',
                suggestions: [
                    'Expliquez le mode TE10',
                    "Qu'a-t-on simulé dans HFSS ?",
                    "Pourquoi l'alumine a-t-elle été utilisée ?",
                    'Quel était l’objectif de conception ?'
                ]
            }
        },
        thermal: {
            en: {
                teaser: 'Curious how this thermal analysis was done? Ask me.',
                suggestions: [
                    'Explain the thermal model',
                    'What simulation tools were used?',
                    'What were the key findings?',
                    'How does this connect to the BMS work?'
                ]
            },
            fr: {
                teaser: 'Curieux de savoir comment cette analyse thermique a été menée ? Demandez-moi.',
                suggestions: [
                    'Expliquez le modèle thermique',
                    'Quels outils de simulation ont été utilisés ?',
                    'Quels sont les résultats clés ?',
                    'Quel est le lien avec le projet BMS ?'
                ]
            }
        },
        rendezvous: {
            en: {
                teaser: 'Curious about the GNC research? Ask me.',
                suggestions: [
                    'Explain the Clohessy-Wiltshire dynamics',
                    'What is a Luenberger observer?',
                    'How does this apply to spacecraft rendezvous?',
                    "What's the status of this research?"
                ]
            },
            fr: {
                teaser: 'Curieux de cette recherche en GNC ? Demandez-moi.',
                suggestions: [
                    'Expliquez la dynamique de Clohessy-Wiltshire',
                    "Qu'est-ce qu'un observateur de Luenberger ?",
                    'Comment cela s’applique-t-il au rendez-vous spatial ?',
                    'Où en est cette recherche ?'
                ]
            }
        },
        internship: {
            en: {
                teaser: 'Curious what Rafi did during this internship? Ask me.',
                suggestions: [
                    'What did Rafi work on here?',
                    'What skills did he develop?',
                    'What tools did he use?',
                    'How does this connect to his other work?'
                ]
            },
            fr: {
                teaser: 'Curieux de ce que Rafi a fait durant ce stage ? Demandez-moi.',
                suggestions: [
                    'Sur quoi Rafi a-t-il travaillé ici ?',
                    'Quelles compétences a-t-il développées ?',
                    'Quels outils a-t-il utilisés ?',
                    'Quel est le lien avec ses autres travaux ?'
                ]
            }
        }
    };

    const UI_COPY = {
        en: {
            identity: 'Ask Rafi',
            assistantName: "Rafi's Engineering Assistant",
            dialogLabel: "Chat with Rafi's Engineering Assistant",
            cvHref: 'https://nasrallahrafi.me/assets/pdf/RAFI_Nasrallah_CV_ENG.pdf',
            greeting: "Hi! I'm Rafi's Engineering Assistant. I can answer questions about Rafi's engineering projects, technical skills, and professional experience — or share his CV. What would you like to know?",
            online: 'Online',
            offline: 'Offline',
            apiUnavailable: 'API unavailable',
            openChat: 'Ask Rafi',
            closeChat: 'Close chat',
            dismiss: 'Dismiss',
            clearConversation: 'Clear conversation',
            sendMessage: 'Send message',
            message: 'Message',
            inputPlaceholder: 'Type your message...',
            typing: 'Typing...',
            newMessages: 'New messages',
            copy: 'Copy',
            copied: 'Copied!',
            copyCode: 'Copy Code',
            copyFailed: 'Copy failed — select the text manually',
            regenerate: 'Regenerate',
            tryAgain: 'Try again',
            cancel: 'Cancel',
            emailRafi: 'Email Rafi',
            downloadCv: 'Download CV',
            offlineBanner: "You're offline — messages can't be sent right now.",
            privacy: 'Not stored on our servers — kept in your browser for 24h, then auto-deleted.',
            mistakes: 'AI can make mistakes',
            unexpected: 'An unexpected error occurred. Please try again.',
            offlineError: 'You’re offline. Reconnect and try again.',
            cancelled: 'Message cancelled.',
            dailyLimit: "I've reached my daily limits.",
            rateLimit: "You're sending messages too fast.",
            tooManyRequests: 'Too many requests. Please try again later.',
            providerOverloaded: 'The AI provider is currently overloaded.',
            timeout: 'The request timed out. Please try again.',
            networkError: 'Network error. Please check your connection and try again.',
            errorFallback: 'In the meantime, feel free to email Rafi directly at',
            interested: 'Interested in working with Rafi?',
            ctaDescription: 'You can reach out directly via email or download his full resume.',
            welcomeBack: 'Welcome back — what else can I help you find about Rafi’s work today?',
            assistantReplied: 'Assistant replied: '
        },
        fr: {
            identity: 'Demandez à Rafi',
            assistantName: 'Assistant technique de Rafi',
            dialogLabel: 'Chat avec l’assistant de Rafi',
            cvHref: 'https://nasrallahrafi.me/assets/pdf/RAFI_Nasrallah_CV_FR.pdf',
            greeting: 'Bonjour ! Je suis l’assistant technique de Rafi. Je peux répondre à vos questions sur ses projets d’ingénierie, ses compétences techniques et son expérience professionnelle, ou partager son CV. Que souhaitez-vous savoir ?',
            online: 'En ligne',
            offline: 'Hors ligne',
            apiUnavailable: 'API indisponible',
            openChat: 'Demandez à Rafi',
            closeChat: 'Fermer le chat',
            dismiss: 'Fermer',
            clearConversation: 'Effacer la conversation',
            sendMessage: 'Envoyer le message',
            message: 'Message',
            inputPlaceholder: 'Écrivez votre message...',
            typing: "En train d'écrire...",
            newMessages: 'Nouveaux messages',
            copy: 'Copier',
            copied: 'Copié !',
            copyCode: 'Copier le code',
            copyFailed: 'Échec de la copie — sélectionnez le texte manuellement',
            regenerate: 'Régénérer',
            tryAgain: 'Réessayer',
            cancel: 'Annuler',
            emailRafi: 'Envoyer un e-mail à Rafi',
            downloadCv: 'Télécharger le CV',
            offlineBanner: 'Vous êtes hors ligne — les messages ne peuvent pas être envoyés pour le moment.',
            privacy: 'Non stocké sur nos serveurs — conservé dans votre navigateur pendant 24 h, puis supprimé automatiquement.',
            mistakes: 'L’IA peut se tromper',
            unexpected: 'Une erreur inattendue s’est produite. Veuillez réessayer.',
            offlineError: 'Vous êtes hors ligne. Reconnectez-vous et réessayez.',
            cancelled: 'Message annulé.',
            dailyLimit: "J'ai atteint mes limites quotidiennes.",
            rateLimit: 'Vous envoyez des messages trop rapidement.',
            tooManyRequests: 'Trop de requêtes. Veuillez réessayer plus tard.',
            providerOverloaded: 'Le fournisseur d’IA est actuellement surchargé.',
            timeout: 'La requête a expiré. Veuillez réessayer.',
            networkError: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
            errorFallback: 'En attendant, vous pouvez écrire directement à Rafi à l’adresse',
            interested: 'Intéressé par le travail de Rafi ?',
            ctaDescription: 'Vous pouvez le contacter directement par e-mail ou télécharger son CV complet.',
            welcomeBack: 'Bon retour — que puis-je vous aider à trouver sur le travail de Rafi aujourd’hui ?',
            assistantReplied: 'Réponse de l’assistant : '
        }
    };

    // ---------------------------------------------------------------
    // State (module-scoped, populated in init)
    // ---------------------------------------------------------------
    let toggleBtn, closeBtn, clearBtn, windowEl, form, input, messages,
        sendBtn, stopBtn, scrollFab, charCounter, offlineBanner,
        statusText, statusDot, statusPulse, announcer, badgeEl;

    let isChatOpen = false;
    let isWaiting = false;
    let hasInteracted = false;
    let manualCancel = false;
    let hasShownCtaCard = false;
    let history = [];
    let currentController = null;
    let saveTimer = null;
    let lastFocusedBeforeOpen = null;
    let closeAnimationTimeoutId = null;
    let markdownLibsPromise = null;
    let connectionState = 'online';
    let apiHealthTimer = null;
    let apiHealthController = null;
    const analyticsQueue = [];

    function loadMarkdownLibs() {
        if (window.marked && window.DOMPurify) return Promise.resolve();
        if (markdownLibsPromise) return markdownLibsPromise;

        const libraries = [
            { globalName: 'marked', src: 'js/vendor/marked.min.js', integrity: 'sha384-NNQgBjjuhtXzPmmy4gurS5X7P4uTt1DThyevz4Ua0IVK5+kazYQI1W27JHjbbxQz' },
            { globalName: 'DOMPurify', src: 'js/vendor/purify.min.js', integrity: 'sha384-rneZSW/1QE+3/U5/u+/7eRNi/tRc+SzS+yXy36fltr1tDN9EHaVo1Bwz2Z8o8DA4' }
        ];
        markdownLibsPromise = Promise.all(libraries.map(function (library) {
            if (window[library.globalName]) return Promise.resolve();
            const existing = document.querySelector('script[data-chatbot-vendor="' + library.globalName + '"]');
            if (existing) return new Promise(function (resolve, reject) {
                existing.addEventListener('load', resolve, { once: true });
                existing.addEventListener('error', reject, { once: true });
            });
            return new Promise(function (resolve, reject) {
                const script = document.createElement('script');
                script.src = library.src;
                script.async = true;
                script.integrity = library.integrity;
                script.crossOrigin = 'anonymous';
                script.dataset.chatbotVendor = library.globalName;
                script.addEventListener('load', resolve, { once: true });
                script.addEventListener('error', reject, { once: true });
                document.head.appendChild(script);
            });
        })).catch(function (error) {
            markdownLibsPromise = null;
            console.warn('[chatbot] Markdown libraries could not be loaded:', error);
        });
        return markdownLibsPromise;
    }

    function getWidgetCopy() {
        const lang = getClientLang();
        const pageKey = getPageKey();
        return Object.assign({}, UI_COPY[lang], PAGE_CONTENT[pageKey]?.[lang] || PAGE_CONTENT.default[lang], { lang: lang, pageKey: pageKey });
    }

    function getPageKey() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('project-smart-bms')) return 'bms';
        if (path.includes('project-waveguide')) return 'waveguide';
        if (path.includes('project-thermal')) return 'thermal';
        if (path.includes('project-rendezvous')) return 'rendezvous';
        if (path.includes('internship-onee') || path.includes('internship-smcv')) return 'internship';
        return 'default';
    }

    // ---------------------------------------------------------------
    // Analytics Helper
    // ---------------------------------------------------------------
    function trackEvent(eventName, payload) {
        payload = payload || {};
        const event = Object.assign({}, payload, { event: eventName, timestamp: Date.now() });
        try {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, event);
            } else {
                analyticsQueue.push(event);
                if (analyticsQueue.length > 50) analyticsQueue.shift();
                if (window.__NR_CHATBOT_DEBUG__) {
                    window.__nrChatbotAnalyticsQueue = analyticsQueue;
                }
            }
        } catch (e) {
            analyticsQueue.push(event);
            if (analyticsQueue.length > 50) analyticsQueue.shift();
            if (window.__NR_CHATBOT_DEBUG__) {
                window.__nrChatbotAnalyticsQueue = analyticsQueue;
            }
        }
    }

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    function init() {
        injectMarkup();
        cacheDom();
        wireEvents();
        setupVisualViewport();
        setupTeaser();
        restoreConversation();
        setupReturningVisitor();
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
        statusDot = document.getElementById('chatbot-status-dot');
        statusPulse = document.getElementById('chatbot-status-pulse');
        announcer = document.getElementById('chatbot-sr-announcer');
        badgeEl = document.getElementById('chatbot-badge');
    }

    // ---------------------------------------------------------------
    // Markup (template strings, no framework dependency)
    // ---------------------------------------------------------------
    function widgetMarkup() {
        const copy = getWidgetCopy();
        return `
        <style>
            /* ── Chatbot self-contained styles ─────────────────────────── */
            /* Sizing & layout classes missing from compiled Tailwind */
            #chatbot-window {
                height: min(550px, calc(100vh - 7rem));
                height: min(550px, calc(100dvh - 7rem));
                min-height: min(300px, calc(100vh - 7rem));
                min-height: min(300px, calc(100dvh - 7rem));
                background-color: rgba(5,5,5,0.98) !important;
                backdrop-filter: blur(24px) !important;
                -webkit-backdrop-filter: blur(24px) !important;
            }
            .w-\\[350px\\] { width: 350px; }
            @media (min-width:640px) { .sm\\:w-\\[400px\\] { width: 400px; } }
            .h-\\[auto\\] { height: auto; }
            .min-h-\\[300px\\] { min-height: 300px; }
            .max-h-\\[550px\\] { max-height: 550px; max-height: min(550px, calc(100vh - 7rem)); max-height: min(550px, calc(100dvh - 7rem)); }
            .max-h-\\[80vh\\] { max-height: 80vh; }
            .max-w-\\[90\\%\\] { max-width: 90%; }
            .max-w-\\[85\\%\\] { max-width: 85%; }
            .min-h-0 { min-height: 0; }
            .z-\\[100\\] { z-index: 100; }
            #chatbot-window > :first-child,
            #chatbot-window > :last-child,
            #chatbot-offline-banner { flex: 0 0 auto; }
            #chatbot-window > .relative,
            #chatbot-messages { min-height: 0; }

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
            @keyframes typingPulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
            .chat-msg-animate { animation: slideUpFade 0.22s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
            .bot-icon-animate { transition: opacity 150ms ease, color 150ms ease; }
            .typing-dot { animation: typingPulse 1.1s ease-in-out infinite; }
            .chatbot-fab-in { animation: slideUpFade 0.18s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
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
            .chatbot-msg-actions { opacity: 0.72; min-height: 1.5rem; flex-wrap: wrap; transition: opacity 0.15s ease; }
            .chatbot-ai-row:hover .chatbot-msg-actions,
            .chatbot-msg-actions:focus-within { opacity: 1; }
            #chatbot-clear-btn,
            #chatbot-close-btn,
            #chatbot-send-btn,
            #chatbot-stop-btn,
            .chatbot-msg-action-btn {
                min-width: 44px;
                min-height: 44px;
            }
            #chatbot-clear-btn,
            #chatbot-close-btn { padding: 0.625rem; }
            #chatbot-send-btn,
            #chatbot-stop-btn { width: auto; height: auto; padding: 0.75rem; }
            .chatbot-msg-action-btn { padding: 0.75rem 0.625rem; border-radius: 0.375rem; }
            .suggestion-chip,
            .chatbot-retry-btn,
            .chatbot-cta-btn,
            #chatbot-teaser-close,
            .code-copy-btn {
                min-width: 44px;
                min-height: 44px;
            }
            .suggestion-chip { padding: 0.75rem 1rem; }
            .chatbot-retry-btn { padding: 0.75rem 0.625rem; }
            .chatbot-cta-btn { padding: 0.75rem; }
            #chatbot-teaser-close { padding: 0.75rem; }
            .code-copy-btn { padding: 0.75rem; }
            /* Keep the teaser as a compact notification card, not a full-width bar. */
            #chatbot-teaser {
                width: min(300px, calc(100vw - 2rem));
                max-width: 300px;
                box-sizing: border-box;
            }
            #chatbot-teaser > div {
                width: 100%;
                min-width: 0;
            }
            #chatbot-teaser .flex-1 {
                min-width: 0;
            }
            #chatbot-teaser p {
                overflow-wrap: anywhere;
            }
            #chatbot-teaser-close {
                flex: 0 0 44px;
                width: 44px;
                height: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .chatbot-teaser-identity {
                letter-spacing: 0;
                text-transform: none;
            }
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
                #chatbot-window, #chatbot-teaser { transition: opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease !important; transform: none !important; }
            }
            @media (max-width: 479px) {
                #chatbot-container { left: 0.75rem; right: 0.75rem; bottom: 0.75rem; }
                #chatbot-window {
                    width: 100%;
                    height: min(550px, calc(100dvh - 5.5rem));
                    max-height: calc(100dvh - 5.5rem);
                }
                #chatbot-toggle-btn { width: 3rem; height: 3rem; }
            }
        </style>
        <div id="chatbot-container" class="fixed bottom-6 right-6 z-[100] font-sans flex flex-col items-end gap-4 pointer-events-none">
                <div id="chatbot-window" role="dialog" aria-label="${copy.dialogLabel}" class="hidden flex-col w-[350px] sm:w-[400px] h-auto min-h-[300px] max-h-[550px] bg-[#050505]/80 backdrop-blur-2xl border-t border-l border-white/10 border-b border-r border-black/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden transition-[transform,opacity] duration-200 ease-out transform scale-95 opacity-0 origin-bottom-right pointer-events-auto">
                <div class="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10 backdrop-blur-md">
                    <div class="flex items-center gap-3">
                        <div class="relative flex h-2.5 w-2.5 mt-0.5">
                            <span id="chatbot-status-pulse" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span id="chatbot-status-dot" class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" style="box-shadow: 0 0 8px rgba(var(--primary-rgb, 6, 182, 212), 0.8);"></span>
                        </div>
                        <div>
                        <h3 class="text-white font-semibold text-[15px] tracking-wide m-0 leading-none antialiased">${copy.identity}</h3>
                            <p id="chatbot-status-text" aria-live="polite" aria-atomic="true" class="text-[10.5px] text-cyan-400/70 m-0 leading-none mt-1">${copy.online}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1">
                        <button id="chatbot-clear-btn" type="button" class="text-slate-500 hover:text-white transition-colors duration-300 p-1.5 rounded-full hover:bg-white/5" aria-label="${copy.clearConversation}" title="${copy.clearConversation}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5" aria-hidden="true"></i>
                        </button>
                    <button id="chatbot-close-btn" type="button" class="text-slate-400 hover:text-white transition-colors duration-300 hover:rotate-90 p-1.5 rounded-full hover:bg-white/5" aria-label="${copy.closeChat}">
                            <i data-lucide="x" class="w-4 h-4" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div id="chatbot-offline-banner" class="hidden px-4 py-2 text-[11px] text-center bg-amber-500/10 text-amber-300 border-b border-amber-500/20">${copy.offlineBanner}</div>
                <div class="relative flex-1 flex flex-col min-h-0">
                    <div id="chatbot-messages" role="log" aria-label="Conversation" class="flex-1 min-h-0 p-5 overflow-y-auto flex flex-col gap-4 scroll-smooth text-[13.5px] tracking-wide antialiased">
                        ${greetingBlockHTML()}
                    </div>
                    <button id="chatbot-scroll-fab" type="button" class="hidden absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-cyan-500/40 text-cyan-300 text-[11px] font-medium shadow-lg hover:bg-black transition-colors chatbot-fab-in">
                        <i data-lucide="arrow-down" class="w-3 h-3" aria-hidden="true"></i> ${copy.newMessages}
                    </button>
                </div>
                <div class="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
                    <form id="chatbot-form" class="relative flex items-end">
                        <span id="chatbot-char-counter" class="hidden absolute -top-5 right-1 text-[10px] text-slate-500"></span>
                        <textarea id="chatbot-input" rows="1" maxlength="${CONFIG.MAX_MESSAGE_LENGTH}" class="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:bg-white/10 focus:ring-0 rounded-2xl pl-4 pr-12 py-3 mb-0 text-[14px] text-white placeholder-slate-400 outline-none transition-[border-color,background-color,box-shadow] duration-200 ease-out shadow-inner" placeholder="${copy.inputPlaceholder}" aria-label="${copy.message}"></textarea>
                        <button type="submit" id="chatbot-send-btn" class="absolute w-9 h-9 flex items-center justify-center rounded-full bg-transparent hover:bg-white/10 text-cyan-400 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed" style="right: 0.5rem; bottom: 0.5rem;" aria-label="${copy.sendMessage}">
                            <i data-lucide="send" class="w-4 h-4 ml-0.5" aria-hidden="true"></i>
                        </button>
                        <button type="button" id="chatbot-stop-btn" class="hidden absolute w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-red-400 transition-colors duration-300" style="right: 0.5rem; bottom: 0.5rem;" aria-label="${copy.cancel}" title="${copy.cancel}">
                            <i data-lucide="square" class="w-3.5 h-3.5" aria-hidden="true"></i>
                        </button>
                    </form>
                    <div class="text-[11px] leading-relaxed text-center text-slate-400 pt-3 mt-1 font-medium">${copy.mistakes} · ${copy.privacy}</div>
                </div>
            </div>
            <div id="chatbot-teaser" style="background-color: rgba(8, 8, 12, 0.9);" class="hidden relative mb-3 p-3.5 rounded-2xl bg-[#08080c]/90 backdrop-blur-xl border border-cyan-500/30 text-white shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(var(--primary-rgb,6,182,212),0.2)] pointer-events-auto cursor-pointer max-w-[280px] transition-[transform,opacity] duration-200 ease-out transform scale-95 opacity-0 origin-bottom-right">
                <div class="flex items-start gap-3">
                    <div class="relative flex-shrink-0 mt-0.5">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-cyan-500/10 border border-cyan-500/40 flex items-center justify-center">
                            <i data-lucide="bot" class="w-4 h-4 text-cyan-400"></i>
                        </div>
                        <span class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black"></span>
                    </div>
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <span class="chatbot-teaser-identity text-[11px] font-semibold text-cyan-300">${copy.identity}</span>
                        </div>
                        <p class="text-[12.5px] text-slate-200 m-0 leading-snug font-normal">${copy.teaser}</p>
                    </div>
                    <button id="chatbot-teaser-close" type="button" class="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 -mt-1 -mr-1" aria-label="${copy.dismiss}">
                        <i data-lucide="x" class="w-3.5 h-3.5 pointer-events-none"></i>
                    </button>
                </div>
            </div>
            <button id="chatbot-toggle-btn" type="button" class="relative w-14 h-14 rounded-full bg-black/80 backdrop-blur-md border border-cyan-500/50 text-white hover:bg-black hover:border-cyan-400 transition-[transform,background-color,border-color] duration-180 flex items-center justify-center group bot-toggle-btn pointer-events-auto" aria-labelledby="chatbot-toggle-label" aria-expanded="false" aria-controls="chatbot-window">
                <i data-lucide="bot" class="w-6 h-6 group-[.chat-open]:hidden text-cyan-400 bot-icon-animate" style="filter: drop-shadow(0 0 8px rgba(var(--primary-rgb, 6, 182, 212), 0.8));" aria-hidden="true"></i>
                <i data-lucide="chevron-down" class="w-6 h-6 hidden group-[.chat-open]:block text-cyan-300" aria-hidden="true"></i>
                <span id="chatbot-toggle-label" class="sr-only">${copy.openChat}</span>
                <span id="chatbot-badge" class="hidden absolute -top-1 -right-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-lg ring-2 ring-black animate-pulse" aria-hidden="true">1</span>
            </button>
        </div>
        <div id="chatbot-sr-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>`;
    }

    function greetingBlockHTML() {
        const copy = getWidgetCopy();
        const chips = copy.suggestions.map(function (prompt) {
            return '<button type="button" class="suggestion-chip px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 text-[12px] text-slate-300 hover:text-cyan-300 transition-[background-color,border-color,color,transform] duration-180" data-prompt="' + prompt.replace(/"/g, '&quot;') + '">' + prompt + '</button>';
        }).join('');
        return '<div id="chatbot-greeting" class="self-start max-w-[90%] chat-msg-animate">'
            + '<div class="flex items-start gap-3">' + avatarHTML()
            + '<div class="inline-block px-5 py-4 rounded-2xl rounded-tl-sm bg-black/50 border border-white/5 text-slate-300 chat-markdown shadow-sm">'
            + '<p class="leading-relaxed m-0">' + copy.greeting + '</p></div></div>'
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
            if (e.key === 'Tab' && isChatOpen) trapFocus(e);
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

        // Event delegation: covers greeting chips, dynamic chips, and CTA buttons
        messages.addEventListener('click', function (e) {
            const chip = e.target.closest('.suggestion-chip');
            if (chip) {
                trackEvent('chip_click', { label: chip.textContent, prompt: chip.dataset.prompt });
                sendMessage(chip.dataset.prompt);
                return;
            }
            const ctaBtn = e.target.closest('.chatbot-cta-btn');
            if (ctaBtn) {
                trackEvent('cta_click', { cta: ctaBtn.dataset.cta, href: ctaBtn.getAttribute('href') });
            }
        });

        window.addEventListener('online', function () { setOfflineState(false); });
        window.addEventListener('offline', function () { setOfflineState(true); });
        window.addEventListener('pagehide', flushPersistedState);
        window.addEventListener('beforeunload', flushPersistedState);
    }

    // ---------------------------------------------------------------
    // Open / close
    // ---------------------------------------------------------------
    function toggleChat() {
        const copy = getWidgetCopy();
        isChatOpen = !isChatOpen;
        toggleBtn.setAttribute('aria-expanded', String(isChatOpen));
        const toggleLabel = document.getElementById('chatbot-toggle-label');
        if (toggleLabel) toggleLabel.textContent = isChatOpen ? copy.closeChat : copy.openChat;

        if (badgeEl) badgeEl.classList.add('hidden');

        if (isChatOpen) {
            if (closeAnimationTimeoutId !== null) {
                clearTimeout(closeAnimationTimeoutId);
                closeAnimationTimeoutId = null;
            }
            loadMarkdownLibs();
            startApiHealthMonitor();
            toggleBtn.classList.add('hidden');
            trackEvent('chat_open');
            lastFocusedBeforeOpen = document.activeElement;
            windowEl.classList.remove('hidden');
            windowEl.classList.add('flex');
            requestAnimationFrame(function () {
                windowEl.classList.remove('opacity-0', 'scale-95');
                windowEl.classList.add('opacity-100', 'scale-100');
                if (hasInteracted) scrollToBottom();
            });
            toggleBtn.classList.add('chat-open');
            input.focus();
            refreshIcons();
        } else {
            trackEvent('chat_close');
            stopApiHealthMonitor();
            toggleBtn.classList.remove('hidden');
            windowEl.classList.remove('opacity-100', 'scale-100');
            windowEl.classList.add('opacity-0', 'scale-95');
            toggleBtn.classList.remove('chat-open');
            closeAnimationTimeoutId = setTimeout(function () {
                windowEl.classList.add('hidden');
                windowEl.classList.remove('flex');
                closeAnimationTimeoutId = null;
            }, 300);
            if (lastFocusedBeforeOpen && lastFocusedBeforeOpen.focus) lastFocusedBeforeOpen.focus();
        }
    }

    // ---------------------------------------------------------------
    // Sending messages
    // ---------------------------------------------------------------
    async function sendMessage(rawText, options) {
        options = options || {};
        const copy = getWidgetCopy();
        const text = (rawText || '').trim();
        if (!text || isWaiting || text.length > CONFIG.MAX_MESSAGE_LENGTH) return;

        if (!navigator.onLine) {
            renderAssistantBubble(copy.offlineError, { isError: true, retryText: text });
            return;
        }

        hasInteracted = true;
        hideSuggestions();
        input.value = '';
        autoGrowInput();
        updateCharCounter();

        if (!options.reuseVisibleUserBubble) renderUserBubble(text);
        history.push({ role: 'user', content: text });
        persistState();

        isWaiting = true;
        manualCancel = false;
        setBusyUI(true);
        showTyping();

        const controller = new AbortController();
        currentController = controller;
        const timeoutId = setTimeout(function () { controller.abort(); }, CONFIG.REQUEST_TIMEOUT_MS);
        const markdownReady = loadMarkdownLibs();

        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history.slice(-CONFIG.MAX_HISTORY_SENT),
                    contextUrl: window.location.href,
                    lang: getClientLang()
                }),
                signal: controller.signal
            });

            await markdownReady;
            hideTyping();

            if (!res.ok) {
                const err = await res.json().catch(function () { return {}; });
                let msg = copy.unexpected;
                if (res.status === 429) {
                    if (err.code === 'BUDGET_EXCEEDED') msg = copy.dailyLimit;
                    else if (err.code === 'RATE_LIMIT_EXCEEDED') msg = copy.rateLimit;
                    else msg = copy.tooManyRequests;
                } else if (res.status === 503) {
                    msg = copy.providerOverloaded;
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
                    checkAndTriggerCta();
                } else {
                    throw new Error('Invalid response');
                }
            }
        } catch (err) {
            hideTyping();
            if (err.name === 'AbortError') {
                const msg = manualCancel ? copy.cancelled : copy.timeout;
                renderAssistantBubble(msg, { isError: true, retryText: text });
            } else {
                console.error('Chat API Error:', err);
                renderAssistantBubble(copy.networkError, { isError: true, retryText: text });
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

    function trapFocus(e) {
        const focusable = Array.prototype.slice.call(windowEl.querySelectorAll(
            'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(function (element) {
            return element.offsetParent !== null;
        });
        if (!focusable.length) {
            e.preventDefault();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || !windowEl.contains(document.activeElement))) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !windowEl.contains(document.activeElement))) {
            e.preventDefault();
            first.focus();
        }
    }

    function setConnectionStatus(state) {
        connectionState = state;
        const copy = getWidgetCopy();
        const status = state === 'online' ? copy.online
            : state === 'api-unreachable' ? copy.apiUnavailable
                : copy.offline;
        const colors = {
            online: { dot: '#22c55e', text: '#86efac' },
            'api-unreachable': { dot: '#f59e0b', text: '#fbbf24' },
            'browser-offline': { dot: '#ef4444', text: '#fca5a5' }
        };
        const color = colors[state] || colors['browser-offline'];
        if (statusText && !isWaiting) {
            statusText.textContent = status;
            statusText.style.color = color.text;
        }
        if (statusDot) {
            statusDot.style.backgroundColor = color.dot;
            statusDot.style.boxShadow = '0 0 8px ' + color.dot;
        }
        if (statusPulse) statusPulse.style.backgroundColor = color.dot;
    }

    function startApiHealthMonitor() {
        stopApiHealthMonitor();
        checkApiHealth();
        apiHealthTimer = setInterval(checkApiHealth, CONFIG.API_HEALTH_INTERVAL_MS);
    }

    function stopApiHealthMonitor() {
        if (apiHealthTimer !== null) {
            clearInterval(apiHealthTimer);
            apiHealthTimer = null;
        }
        if (apiHealthController) {
            apiHealthController.abort();
            apiHealthController = null;
        }
    }

    async function checkApiHealth() {
        if (!navigator.onLine) {
            setConnectionStatus('browser-offline');
            return;
        }

        if (apiHealthController) apiHealthController.abort();
        const controller = new AbortController();
        apiHealthController = controller;
        const timeoutId = setTimeout(function () { controller.abort(); }, CONFIG.API_HEALTH_TIMEOUT_MS);

        try {
            const response = await fetch(CONFIG.API_HEALTH_URL, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });
            if (!response.ok) throw new Error('Health check failed with status ' + response.status);
            if (apiHealthController === controller) setConnectionStatus('online');
        } catch (error) {
            if (apiHealthController !== controller) return;
            setConnectionStatus(navigator.onLine ? 'api-unreachable' : 'browser-offline');
        } finally {
            clearTimeout(timeoutId);
            if (apiHealthController === controller) apiHealthController = null;
        }
    }

    function setBusyUI(busy) {
        sendBtn.classList.toggle('hidden', busy);
        stopBtn.classList.toggle('hidden', !busy);
        sendBtn.disabled = busy;
        if (busy) messages.setAttribute('aria-busy', 'true');
        else messages.removeAttribute('aria-busy');
        const copy = getWidgetCopy();
        statusText.textContent = busy ? copy.typing : (connectionState === 'online' ? copy.online : connectionState === 'api-unreachable' ? copy.apiUnavailable : copy.offline);
    }

    function checkAndTriggerCta() {
        if (hasShownCtaCard) return;
        const assistantTurnCount = history.filter(function (t) { return t.role === 'assistant'; }).length;
        if (assistantTurnCount >= CONFIG.CTA_TRIGGER_TURN) {
            renderCtaCard();
        }
    }

    function renderCtaCard() {
        if (hasShownCtaCard) return;
        hasShownCtaCard = true;
        const copy = getWidgetCopy();

        const outer = document.createElement('div');
        outer.className = 'self-start max-w-[90%] chat-msg-animate chatbot-cta-card';
        const row = document.createElement('div');
        row.className = 'flex items-start gap-3';
        row.innerHTML = avatarHTML();

        const inner = document.createElement('div');
        inner.className = 'inline-block p-4 rounded-2xl rounded-tl-sm bg-gradient-to-br from-cyan-950/40 to-black/80 border border-cyan-500/30 text-slate-200 shadow-md';
        inner.innerHTML = '<p class="text-[12.5px] font-medium text-cyan-300 m-0 mb-1">' + copy.interested + '</p>'
            + '<p class="text-[11.5px] text-slate-400 m-0 mb-3">' + copy.ctaDescription + '</p>'
            + '<div class="flex flex-wrap gap-2">'
            + '<a href="mailto:nasrollahrafi@gmail.com" class="chatbot-cta-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/30 transition-colors" data-cta="email"><i data-lucide="mail" class="w-3.5 h-3.5"></i> ' + copy.emailRafi + '</a>'
            + '<a href="' + copy.cvHref + '" target="_blank" rel="noopener" class="chatbot-cta-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300 hover:bg-white/10 transition-colors" data-cta="resume"><i data-lucide="file-text" class="w-3.5 h-3.5"></i> ' + copy.downloadCv + '</a>'
            + '</div>';

        row.appendChild(inner);
        outer.appendChild(row);
        outer.appendChild(timestampEl('pl-10'));
        appendToLog(outer);
        refreshIcons();
        trackEvent('cta_shown', { trigger: 'turn_count' });
    }

    function clearConversation() {
        if (isWaiting) return;
        history = [];
        clearPersistedState();
        hasInteracted = false;
        hasShownCtaCard = false;
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
            trackEvent('error_occurred', { message: text });
            inner.textContent = text;
            const emailFallback = document.createElement('div');
            emailFallback.className = 'mt-2 pt-2 border-t border-red-500/20 text-[11.5px] text-red-200';
            const copy = getWidgetCopy();
            emailFallback.innerHTML = copy.errorFallback + ' <a href="mailto:nasrollahrafi@gmail.com" class="chatbot-cta-btn underline hover:text-white font-medium" data-cta="error_fallback_email">nasrollahrafi@gmail.com</a>';
            inner.appendChild(emailFallback);

            if (opts.retryText) {
                const retryBtn = document.createElement('button');
                retryBtn.type = 'button';
                retryBtn.className = 'chatbot-retry-btn mt-2 block text-[11px] font-medium text-red-300 hover:text-red-200 underline underline-offset-2';
                retryBtn.textContent = copy.tryAgain;
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
            try {
                el.innerHTML = DOMPurify.sanitize(marked.parse(text));
                attachCodeBlockCopy(el);
            } catch (error) {
                console.warn('[chatbot] Markdown rendering failed; using plain text:', error);
                el.textContent = text;
            }
        } else {
            el.textContent = text;
        }
    }

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text)
                .then(function () { return true; })
                .catch(function () { return fallbackCopyText(text); });
        }
        return fallbackCopyText(text);
    }

    function fallbackCopyText(text) {
        return new Promise(function (resolve) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            let copied = false;
            try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
            textarea.remove();
            resolve(copied);
        });
    }

    function showCopyFailure(button) {
        const copy = getWidgetCopy();
        const parent = button.parentElement || button;
        const previous = parent.querySelector('.chatbot-copy-failure');
        if (previous) previous.remove();
        const notice = document.createElement('span');
        notice.className = 'chatbot-copy-failure text-[10px] text-red-300';
        notice.textContent = copy.copyFailed;
        parent.appendChild(notice);
        setTimeout(function () { notice.remove(); }, 3000);
    }

    function attachCodeBlockCopy(container) {
        const pres = container.querySelectorAll('pre');
        Array.prototype.forEach.call(pres, function (pre) {
            if (pre.querySelector('.code-copy-btn')) return;
            pre.style.position = 'relative';
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'code-copy-btn absolute top-2 right-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-mono transition-opacity';
            const copy = getWidgetCopy();
            copyBtn.textContent = copy.copyCode;
            copyBtn.addEventListener('click', function () {
                const code = pre.querySelector('code') ? pre.querySelector('code').textContent : pre.textContent;
                copyText(code).then(function (copied) {
                    if (!copied) {
                        showCopyFailure(copyBtn);
                        return;
                    }
                    copyBtn.textContent = copy.copied;
                    setTimeout(function () { copyBtn.textContent = copy.copyCode; }, 1500);
                });
            });
            pre.appendChild(copyBtn);
        });
    }

    function getClientLang() {
        const htmlLang = document.documentElement.lang || '';
        if (htmlLang.toLowerCase().startsWith('fr') || window.location.pathname.includes('-fr.html')) {
            return 'fr';
        }
        return 'en';
    }

    function setupVisualViewport() {
        if (!window.visualViewport) return;
        window.visualViewport.addEventListener('resize', function () {
            if (!isChatOpen) return;
            const vv = window.visualViewport;
            if (window.innerWidth < 640) {
                const maxHeight = Math.min(550, vv.height - 80);
                windowEl.style.maxHeight = maxHeight + 'px';
                if (document.activeElement === input) {
                    input.scrollIntoView({ block: 'nearest' });
                }
            }
        });
    }

    function setupTeaser() {
        const teaser = document.getElementById('chatbot-teaser');
        if (!teaser) return;

        // Keep the localized teaser markup available for an intentional future
        // trigger, but do not auto-open a floating notification over page content.
        teaser.classList.add('hidden');
    }

    function setupReturningVisitor() {
        try {
            const hasSessionVisited = sessionStorage.getItem('nr-session-visited-v1');
            sessionStorage.setItem('nr-session-visited-v1', 'true');
            if (hasSessionVisited && history.length === 0) {
                const greetingPara = messages.querySelector('#chatbot-greeting p');
                if (greetingPara) greetingPara.textContent = getWidgetCopy().welcomeBack;
            }
        } catch (e) {}
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
        Array.prototype.forEach.call(row.parentElement.children, function (child) {
            if (child.classList && child.classList.contains('chatbot-msg-actions')) child.remove();
        });

        const bar = document.createElement('div');
        bar.className = 'chatbot-msg-actions flex items-center gap-2 mt-1 ml-8';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'chatbot-msg-action-btn inline-flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-cyan-300 transition-colors';
        const copy = getWidgetCopy();
        copyBtn.innerHTML = '<i data-lucide="copy" class="w-3 h-3" aria-hidden="true"></i><span>' + copy.copy + '</span>';
        copyBtn.addEventListener('click', function () {
            copyText(rawText).then(function (copied) {
                if (!copied) {
                    showCopyFailure(copyBtn);
                    return;
                }
                const label = copyBtn.querySelector('span');
                const original = label.textContent;
                label.textContent = copy.copied;
                setTimeout(function () { label.textContent = original; }, 1500);
            });
        });
        bar.appendChild(copyBtn);

        if (isLatest) {
            const regenBtn = document.createElement('button');
            regenBtn.type = 'button';
            regenBtn.dataset.regenerate = 'true';
            regenBtn.className = 'chatbot-msg-action-btn inline-flex items-center gap-1 text-[10.5px] text-slate-500 hover:text-cyan-300 transition-colors';
            regenBtn.innerHTML = '<i data-lucide="refresh-cw" class="w-3 h-3" aria-hidden="true"></i><span>' + copy.regenerate + '</span>';
            regenBtn.addEventListener('click', function () { regenerateLast(); });
            bar.appendChild(regenBtn);
        }

        row.parentElement.appendChild(bar);
    }

    function removeStaleRegenerateButtons() {
        messages.querySelectorAll('[data-regenerate]').forEach(function (btn) {
            const bar = btn.closest('.chatbot-msg-actions');
            btn.remove();
            if (bar && !bar.querySelector('button')) bar.remove();
        });
    }

    function regenerateLast() {
        if (isWaiting) return;
        // Find the last user turn so we can resend the same request.
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'user') {
                // Remove the previous assistant turn and its visible bubble.
                if (history[history.length - 1].role === 'assistant') history.pop();
                const assistantBubbles = messages.querySelectorAll('.chatbot-ai-row');
                const previousAssistantBubble = assistantBubbles[assistantBubbles.length - 1];
                if (previousAssistantBubble) previousAssistantBubble.remove();
                removeStaleRegenerateButtons();
                persistState();
                sendMessage(history.pop().content, { reuseVisibleUserBubble: true });
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
        if (isOffline) {
            setConnectionStatus('browser-offline');
        } else if (isChatOpen) {
            checkApiHealth();
        } else {
            setConnectionStatus('online');
        }
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function announce(text) {
        if (!announcer) return;
        announcer.textContent = '';
        // Re-set on next tick so assistive tech reliably announces repeats.
        setTimeout(function () { announcer.textContent = getWidgetCopy().assistantReplied + text; }, 30);
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

        const lastAssistantIndex = history.reduce(function (latest, turn, index) {
            return turn.role === 'assistant' ? index : latest;
        }, -1);

        history.forEach(function (turn, index) {
            if (turn.role === 'user') {
                renderUserBubble(turn.content);
            } else {
                renderAssistantBubble(turn.content, { animate: false, latest: index === lastAssistantIndex });
            }
        });

        refreshIcons();
        scrollToBottom();
    }

    function loadPersistedState() {
        try {
            const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.history) || !parsed.history.every(function (turn) {
                return turn && typeof turn === 'object'
                    && (turn.role === 'user' || turn.role === 'assistant')
                    && typeof turn.content === 'string'
                    && turn.content.length <= CONFIG.MAX_PERSISTED_CONTENT_LENGTH;
            })) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }
            const savedAt = Number(parsed.savedAt);
            if (!Number.isFinite(savedAt) || Date.now() - savedAt > CONFIG.STORAGE_TTL_MS) {
                localStorage.removeItem(CONFIG.STORAGE_KEY);
                return null;
            }
            const trimmedHistory = parsed.history.slice(-CONFIG.MAX_PERSISTED_HISTORY);
            if (trimmedHistory.length !== parsed.history.length) {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({ history: trimmedHistory, savedAt: savedAt }));
            }
            return { history: trimmedHistory, savedAt: savedAt };
        } catch (e) {
            console.warn('[chatbot] Could not restore saved conversation:', e);
            try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (removeError) { /* ignore */ }
            return null;
        }
    }

    function persistState() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                    history: history.slice(-CONFIG.MAX_PERSISTED_HISTORY),
                    savedAt: Date.now()
                }));
                saveTimer = null;
            } catch (e) {
                console.warn('[chatbot] Could not save conversation:', e);
            }
        }, 250);
    }

    function flushPersistedState() {
        if (saveTimer !== null) clearTimeout(saveTimer);
        saveTimer = null;
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                history: history.slice(-CONFIG.MAX_PERSISTED_HISTORY),
                savedAt: Date.now()
            }));
        } catch (e) {
            console.warn('[chatbot] Could not flush saved conversation:', e);
        }
    }

    function clearPersistedState() {
        try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch (e) { /* storage unavailable — ignore */ }
    }
})();
