document.addEventListener('DOMContentLoaded', () => {

    // BEM Naming Convention
    const header = document.querySelector('.header');
    const registerBtn = document.getElementById('register-btn');
    const submitBtn = document.getElementById('submit-btn');
    const preScheduleBtn = document.getElementById('pre-schedule-btn');
    const mustVisitCardsWrapper = document.querySelector('.must-visit__cards-wrapper');
    const prevBtn = document.querySelector('.must-visit__slider-btn--prev');
    const nextBtn = document.querySelector('.must-visit__slider-btn--next');
    
    // Cookie Consent Elements
    const cookieConsent = document.getElementById('cookie-consent');
    const acceptButton = document.getElementById('accept-cookies');
    const declineButton = document.getElementById('decline-cookies');

    // Check if user has already made a cookie choice
    if (!localStorage.getItem('cookieChoice')) {
        cookieConsent.style.display = 'flex';
    } else {
        cookieConsent.style.display = 'none';
    }

    const closeButton = document.getElementById('close-cookies');

    // Handle cookie consent accept
    acceptButton.addEventListener('click', function() {
        // Show alert message
        alert("This site is now using cookies, pixel tags and local storage for performance, personalization and marketing purposes.");
        
        // Hide after 3 seconds
        setTimeout(function() {
            cookieConsent.classList.add('hidden');
            
            // After animation completes, set display to none
            setTimeout(function() {
                cookieConsent.style.display = 'none';
            }, 300);
        }, 3000);
        
        // Store the choice
        localStorage.setItem('cookieChoice', 'accepted');
    });

    // Handle cookie consent decline
    declineButton.addEventListener('click', function() {
        cookieConsent.classList.add('hidden');
        
        // After animation completes, set display to none
        setTimeout(function() {
            cookieConsent.style.display = 'none';
        }, 300);
        
        // Store the choice
        localStorage.setItem('cookieChoice', 'declined');
    });

    // Handle close button click
    closeButton.addEventListener('click', function() {
        cookieConsent.classList.add('hidden');
        
        // After animation completes, set display to none
        setTimeout(function() {
            cookieConsent.style.display = 'none';
        }, 300);
    });

    // Toggle button state on click for Register, Submit, and Pre-schedule buttons
    const toggleButtonState = (button) => {
        button.classList.toggle('active');
    };

    registerBtn.addEventListener('click', () => toggleButtonState(registerBtn));
    submitBtn.addEventListener('click', () => toggleButtonState(submitBtn));
    preScheduleBtn.addEventListener('click', () => toggleButtonState(preScheduleBtn));

    // Sticky Header Scroll Animation
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Exhibition Must-Visit Slider Navigation
    if (mustVisitCardsWrapper && prevBtn && nextBtn) {
        let scrollPosition = 0;
        const cardWidth = mustVisitCardsWrapper.querySelector('.must-visit__card').offsetWidth + 24; // Card width + gap

        nextBtn.addEventListener('click', () => {
            scrollPosition += cardWidth;
            mustVisitCardsWrapper.scroll({
                left: scrollPosition,
                behavior: 'smooth'
            });
        });

        prevBtn.addEventListener('click', () => {
            scrollPosition -= cardWidth;
            if (scrollPosition < 0) {
                scrollPosition = 0;
            }
            mustVisitCardsWrapper.scroll({
                left: scrollPosition,
                behavior: 'smooth'
            });
        });
    }

});