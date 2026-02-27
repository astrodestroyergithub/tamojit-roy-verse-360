document.addEventListener('DOMContentLoaded', () => {

    const header = document.querySelector('.header');
    const registerBtn = document.getElementById('register-btn');
    const submitBtn = document.getElementById('submit-btn');
    const preScheduleBtn = document.getElementById('pre-schedule-btn');
    const mustVisitCardsWrapper = document.querySelector('.must-visit__cards-wrapper');
    const prevBtn = document.querySelector('.must-visit__slider-btn--prev');
    const nextBtn = document.querySelector('.must-visit__slider-btn--next');

    // ================================
    // COOKIE CONSENT
    // ================================
    const cookieConsent = document.getElementById('cookie-consent');
    const acceptButton = document.getElementById('accept-cookies');
    const declineButton = document.getElementById('decline-cookies');
    const closeButton = document.getElementById('close-cookies');

    if (!localStorage.getItem('cookieChoice')) {
        cookieConsent.style.display = 'flex';
    } else {
        cookieConsent.style.display = 'none';
    }

    acceptButton.addEventListener('click', function() {
        alert("This site is now using cookies, pixel tags and local storage for performance, personalization and marketing purposes.");
        setTimeout(() => {
            cookieConsent.classList.add('hidden');
            setTimeout(() => cookieConsent.style.display = 'none', 300);
        }, 3000);
        localStorage.setItem('cookieChoice', 'accepted');
    });

    declineButton.addEventListener('click', function() {
        cookieConsent.classList.add('hidden');
        setTimeout(() => cookieConsent.style.display = 'none', 300);
        localStorage.setItem('cookieChoice', 'declined');
    });

    closeButton.addEventListener('click', function() {
        cookieConsent.classList.add('hidden');
        setTimeout(() => cookieConsent.style.display = 'none', 300);
    });

    // ================================
    // HEADER SCROLL
    // ================================
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // ================================
    // SLIDER
    // ================================
    if (mustVisitCardsWrapper && prevBtn && nextBtn) {
        let scrollPosition = 0;
        const cardWidth = mustVisitCardsWrapper.querySelector('.must-visit__card').offsetWidth + 24;

        nextBtn.addEventListener('click', () => {
            scrollPosition += cardWidth;
            mustVisitCardsWrapper.scroll({ left: scrollPosition, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            scrollPosition -= cardWidth;
            if (scrollPosition < 0) scrollPosition = 0;
            mustVisitCardsWrapper.scroll({ left: scrollPosition, behavior: 'smooth' });
        });
    }

    // ================================
    // ⭐ RESUME TELEMETRY + INTENT
    // ================================
    let pageEnterTime = Date.now();
    let hoverStartTime = null;

    registerBtn.addEventListener('mouseenter', () => {
        hoverStartTime = Date.now();
    });

    registerBtn.addEventListener('click', async () => {

        const clientClickTime = new Date().toISOString();
        const hoverDuration = hoverStartTime ? Date.now() - hoverStartTime : 0;
        const pageDwell = Date.now() - pageEnterTime;

        const intentScore =
            (hoverDuration > 1500 ? 40 : 0) +
            (pageDwell > 10000 ? 40 : 0) +
            20;

        const sessionId =
            localStorage.getItem("sessionId") ||
            crypto.randomUUID();

        localStorage.setItem("sessionId", sessionId);

        const payload = {
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookiesEnabled: navigator.cookieEnabled,
            pageUrl: window.location.href,
            sessionId,
            clientClickTime,
            hoverDuration,
            pageDwell,
            intentScore
        };

        try {
            await fetch('/.netlify/functions/log-resume-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error('logging failed', e);
        }

        window.location.href = 'others/resume.pdf';
    });

});

// ================================
// PRE-SCHEDULE
// ================================
document.getElementById('pre-schedule-btn').addEventListener('click', function() {
    window.location.href = 'appointmentForm.html';
});

// ================================
// NEWSLETTER (unchanged)
// ================================
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const form = this;
            const emailInput = document.getElementById('newsletter-email');
            const submitBtn = form.querySelector('.newsletter__submit-btn');
            const btnText = submitBtn.querySelector('.btn__text');
            const email = emailInput.value.trim();

            const existingMessages = form.querySelectorAll('.newsletter__success, .newsletter__error');
            existingMessages.forEach(msg => msg.remove());

            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            btnText.textContent = 'SUBSCRIBING...';

            try {
                const response = await fetch('/.netlify/functions/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    const successMsg = document.createElement('div');
                    successMsg.className = 'newsletter__success show';
                    successMsg.textContent = '🎉 ' + data.message;
                    form.appendChild(successMsg);
                    form.reset();
                } else {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'newsletter__error show';
                    errorMsg.textContent = '❌ ' + (data.error || 'Failed');
                    form.appendChild(errorMsg);
                }
            } catch (error) {
                console.error(error);
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                btnText.textContent = 'SUBSCRIBE';
            }
        });
    }
});
