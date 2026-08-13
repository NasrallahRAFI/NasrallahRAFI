document.addEventListener('DOMContentLoaded', () => {
    const navLinks = [...document.querySelectorAll('header nav a[href^="#"]')];
    const sections = navLinks
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    const setCurrentSection = id => navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
    });
    let navFrame = null;
    const updateCurrentSection = () => {
        navFrame = null;
        const marker = window.scrollY + window.innerHeight * 0.35;
        const current = sections.reduce((active, section) => section.offsetTop <= marker ? section : active, sections[0]);
        if (current) setCurrentSection(current.id);
    };
    const requestNavUpdate = () => {
        if (navFrame) return;
        navFrame = requestAnimationFrame(updateCurrentSection);
    };
    updateCurrentSection();
    window.addEventListener('scroll', requestNavUpdate, { passive: true });
    window.addEventListener('resize', requestNavUpdate);

    document.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        const target = event.target.closest('.focus-card, .project-card, .skill-group, .timeline-item-content, .experience-column, .patent-card');
        if (!target) return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        target.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    });

    document.querySelectorAll('.project-card[data-previews]').forEach(card => {
        const previews = card.getAttribute('data-previews').split(',');
        const previewBg = card.querySelector('.preview-bg');
        if (!previewBg || !previews[0]) return;
        let currentIndex = 0;
        previewBg.style.backgroundImage = `url('${previews[0]}')`;
        if (previews.length > 1) window.setInterval(() => {
            currentIndex = (currentIndex + 1) % previews.length;
            previewBg.style.backgroundImage = `url('${previews[currentIndex]}')`;
        }, 5000);
    });

    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    }), { root: null, rootMargin: '0px', threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
});
