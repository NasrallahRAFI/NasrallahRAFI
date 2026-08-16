(function () {
    'use strict';

    function initPageMotion() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        document.body.classList.add('smcv-motion-enabled');
        const sections = Array.from(document.querySelectorAll('main article > .content-section'));
        sections.forEach((section, index) => {
            section.classList.add('smcv-motion-section');
            section.style.setProperty('--smcv-motion-order', String(index));
        });

        const observer = new IntersectionObserver((entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('smcv-motion-visible');
                currentObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        sections.forEach((section) => observer.observe(section));
    }

    function initCarousel(carousel) {
        const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
        const previousButton = carousel.querySelector('[data-carousel-prev]');
        const nextButton = carousel.querySelector('[data-carousel-next]');
        const pauseButton = carousel.querySelector('[data-carousel-pause]');
        const pauseIcon = pauseButton?.querySelector('[data-lucide]');
        const pauseLabel = carousel.querySelector('[data-carousel-pause-label]');
        const dotsContainer = carousel.querySelector('[data-carousel-dots]');
        const counter = carousel.querySelector('[data-carousel-counter]');
        const interval = Number(carousel.dataset.autoplay) || 6000;
        const isFrench = document.documentElement.lang === 'fr';
        let activeIndex = 0;
        let timerId = null;
        let isPaused = false;

        if (slides.length < 2) return;

        const labels = isFrench
            ? { previous: 'Écran IHM précédent', next: 'Écran IHM suivant', choose: 'Choisir l’écran IHM', pause: 'Pause', play: 'Lecture' }
            : { previous: 'Previous HMI screen', next: 'Next HMI screen', choose: 'Choose an HMI screen', pause: 'Pause', play: 'Play' };

        function renderDots() {
            if (!dotsContainer) return;
            dotsContainer.setAttribute('aria-label', labels.choose);
            dotsContainer.innerHTML = slides.map((_, index) => `
                <button aria-label="${labels.choose} ${index + 1}" aria-selected="${index === activeIndex}" class="smcv-hmi-carousel__dot" data-carousel-dot="${index}" role="tab" type="button"></button>
            `).join('');
            dotsContainer.querySelectorAll('[data-carousel-dot]').forEach((dot) => {
                dot.addEventListener('click', () => show(Number(dot.dataset.carouselDot), true));
            });
        }

        function updatePauseButton() {
            if (!pauseButton) return;
            pauseButton.setAttribute('aria-pressed', String(isPaused));
            pauseButton.setAttribute('aria-label', isPaused ? labels.play : labels.pause);
            if (pauseLabel) pauseLabel.textContent = isPaused ? labels.play : labels.pause;
            if (pauseIcon) pauseIcon.setAttribute('data-lucide', isPaused ? 'play' : 'pause');
            if (window.lucide) window.lucide.createIcons();
        }

        function restartTimer() {
            window.clearInterval(timerId);
            timerId = isPaused ? null : window.setInterval(() => show(activeIndex + 1), interval);
        }

        function show(nextIndex, userInitiated) {
            const previousIndex = activeIndex;
            const normalizedIndex = (nextIndex + slides.length) % slides.length;
            const direction = normalizedIndex === previousIndex
                ? 'next'
                : ((normalizedIndex - previousIndex + slides.length) % slides.length <= slides.length / 2 ? 'next' : 'previous');
            carousel.dataset.direction = direction;
            activeIndex = normalizedIndex;
            slides.forEach((slide, index) => {
                slide.classList.toggle('is-active', index === activeIndex);
                slide.setAttribute('aria-hidden', String(index !== activeIndex));
            });
            carousel.querySelectorAll('[data-carousel-dot]').forEach((dot, index) => {
                dot.setAttribute('aria-selected', String(index === activeIndex));
            });
            if (counter) counter.textContent = `${activeIndex + 1} / ${slides.length}`;
            carousel.classList.remove('is-changing');
            void carousel.offsetWidth;
            carousel.classList.add('is-changing');
            if (userInitiated) restartTimer();
        }

        previousButton?.addEventListener('click', () => show(activeIndex - 1, true));
        nextButton?.addEventListener('click', () => show(activeIndex + 1, true));
        pauseButton?.addEventListener('click', () => {
            isPaused = !isPaused;
            updatePauseButton();
            restartTimer();
        });
        carousel.addEventListener('mouseenter', () => window.clearInterval(timerId));
        carousel.addEventListener('mouseleave', restartTimer);
        carousel.addEventListener('focusin', () => window.clearInterval(timerId));
        carousel.addEventListener('focusout', (event) => {
            if (!carousel.contains(event.relatedTarget)) restartTimer();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) window.clearInterval(timerId);
            else restartTimer();
        });
        carousel.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') show(activeIndex - 1, true);
            if (event.key === 'ArrowRight') show(activeIndex + 1, true);
        });

        renderDots();
        show(0);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) isPaused = true;
        updatePauseButton();
        restartTimer();
    }

    document.addEventListener('DOMContentLoaded', () => {
        initPageMotion();
        document.querySelectorAll('[data-carousel]').forEach(initCarousel);
    });
}());
