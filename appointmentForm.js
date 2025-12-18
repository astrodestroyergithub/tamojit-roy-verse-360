// Appointment Form JavaScript - EmailJS Integration + Database Storage
// appointmentForm.js

// Initialize EmailJS with your public key
emailjs.init('l0Rkj4b0TtN4-H7Ee');

// Set minimum date to today
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('preferredDate').setAttribute('min', today);
    document.getElementById('alternateDate').setAttribute('min', today);
});

// Form submission handler
document.getElementById('appointment-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const form = e.target;
    
    // Validate at least one service is selected
    const servicesChecked = document.querySelectorAll('input[name="services"]:checked');
    if (servicesChecked.length === 0) {
        alert('Please select at least one service you are interested in.');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.querySelector('.btn__text').textContent = 'SENDING...';
    
    try {
        // Gather form data
        const formData = {
            // Personal Information
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            company: document.getElementById('company').value || 'N/A',
            
            // Services (gather all checked services)
            services: Array.from(servicesChecked).map(cb => cb.value),
            servicesText: Array.from(servicesChecked).map(cb => cb.value).join(', '), // For email
            otherServices: document.getElementById('otherServices').value || 'N/A',
            
            // Project Details
            projectTitle: document.getElementById('projectTitle').value,
            projectDescription: document.getElementById('projectDescription').value,
            budget: document.getElementById('budget').value,
            timeline: document.getElementById('timeline').value,
            deliverables: document.getElementById('deliverables').value || 'N/A',
            
            // Appointment Details
            preferredDate: document.getElementById('preferredDate').value,
            preferredTime: document.getElementById('preferredTime').value,
            alternateDate: document.getElementById('alternateDate').value || null,
            alternateTime: document.getElementById('alternateTime').value || null,
            meetingType: document.getElementById('meetingType').value,
            timezone: document.getElementById('timezone').value,
            
            // Additional Information
            referralSource: document.getElementById('referralSource').value || 'Not specified',
            additionalNotes: document.getElementById('additionalNotes').value || 'None',
            urgentRequest: document.querySelector('input[name="urgentRequest"]:checked') ? 'Yes' : 'No',
            ndaRequired: document.querySelector('input[name="nda"]:checked') ? 'Yes' : 'No',
            
            // Submission timestamp
            submissionDate: new Date().toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'long'
            })
        };
        
        // 1. Save to database first
        const dbResponse = await fetch('/.netlify/functions/save-appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const dbData = await dbResponse.json();
        
        if (!dbResponse.ok) {
            throw new Error('Database save failed: ' + (dbData.error || 'Unknown error'));
        }
        
        console.log('Saved to database with ID:', dbData.appointmentId);
        
        // 2. Send email using EmailJS
        const emailData = {
            ...formData,
            services: formData.servicesText, // Use formatted string for email
            preferredDate: formatDate(formData.preferredDate),
            preferredTime: formatTime(formData.preferredTime),
            alternateDate: formData.alternateDate ? formatDate(formData.alternateDate) : 'N/A',
            alternateTime: formData.alternateTime ? formatTime(formData.alternateTime) : 'N/A'
        };
        
        const emailResponse = await emailjs.send(
            'service_3wdbmij',
            'template_qwjtp68',
            emailData
        );
        
        console.log('Email sent successfully:', emailResponse);
        
        // Show success modal
        showSuccessModal();
        
        // Reset form
        form.reset();
        
    } catch (error) {
        console.error('Error submitting appointment:', error);
        alert('There was an error submitting your appointment request. The data has been saved, but the email notification may have failed. Please try again or contact directly via email.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.btn__text').textContent = 'SCHEDULE APPOINTMENT';
    }
});

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Helper function to format time
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.add('show');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

// Close modal when clicking outside
document.getElementById('success-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modal function
function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Handle file upload display
document.getElementById('attachments').addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        console.log(`${files.length} file(s) selected:`, Array.from(files).map(f => f.name));
    }
});

// Form validation helpers
function validateForm() {
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#ff6b6b';
            isValid = false;
        } else {
            field.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    });
    
    return isValid;
}

// Real-time validation on input
document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
    field.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#ff6b6b';
        } else {
            this.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    });
    
    field.addEventListener('focus', function() {
        this.style.borderColor = 'var(--accent-gold)';
    });
});
