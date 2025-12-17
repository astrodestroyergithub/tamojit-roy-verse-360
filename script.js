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

document.getElementById('pre-schedule-btn').addEventListener('click', function() {
    window.location.href = 'appointmentForm.html';
});

// Newsletter Form Submission
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
            
            // Remove any existing messages
            const existingMessages = form.querySelectorAll('.newsletter__success, .newsletter__error');
            existingMessages.forEach(msg => msg.remove());
            
            // Disable button and show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            btnText.textContent = 'SUBSCRIBING...';
            
            try {
                const response = await fetch('/.netlify/functions/subscribe', {
                    method: 'POST',
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success
                    const successMsg = document.createElement('div');
                    successMsg.className = 'newsletter__success show';
                    successMsg.textContent = '🎉 ' + data.message;
                    form.appendChild(successMsg);
                    
                    // Reset form
                    form.reset();
                    
                    // Remove success message after 5 seconds
                    setTimeout(() => {
                        successMsg.classList.remove('show');
                        setTimeout(() => successMsg.remove(), 300);
                    }, 5000);
                } else {
                    // Error
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'newsletter__error show';
                    errorMsg.textContent = '❌ ' + (data.error || 'Failed to subscribe. Please try again.');
                    form.appendChild(errorMsg);
                    
                    // Remove error message after 5 seconds
                    setTimeout(() => {
                        errorMsg.classList.remove('show');
                        setTimeout(() => errorMsg.remove(), 300);
                    }, 5000);
                }
            } catch (error) {
                console.error('Error:', error);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'newsletter__error show';
                errorMsg.textContent = '❌ Network error. Please check your connection and try again.';
                form.appendChild(errorMsg);
                
                setTimeout(() => {
                    errorMsg.classList.remove('show');
                    setTimeout(() => errorMsg.remove(), 300);
                }, 5000);
            } finally {
                // Re-enable button
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                btnText.textContent = 'SUBSCRIBE';
            }
        });
    }
});
