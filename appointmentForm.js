// Appointment Form JavaScript - EmailJS Integration
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
            services: Array.from(servicesChecked).map(cb => cb.value).join(', '),
            otherServices: document.getElementById('otherServices').value || 'N/A',
            
            // Project Details
            projectTitle: document.getElementById('projectTitle').value,
            projectDescription: document.getElementById('projectDescription').value,
            budget: document.getElementById('budget').value,
            timeline: document.getElementById('timeline').value,
            deliverables: document.getElementById('deliverables').value || 'N/A',
            
            // Appointment Details
            preferredDate: formatDate(document.getElementById('preferredDate').value),
            preferredTime: formatTime(document.getElementById('preferredTime').value),
            alternateDate: document.getElementById('alternateDate').value ? 
                formatDate(document.getElementById('alternateDate').value) : 'N/A',
            alternateTime: document.getElementById('alternateTime').value ? 
                formatTime(document.getElementById('alternateTime').value) : 'N/A',
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
        
        // Send email using EmailJS
        const response = await emailjs.send(
            'service_3wdbmij',
            'template_qwjtp68',
            formData
        );
        
        console.log('Email sent successfully:', response);
        
        // Show success modal
        showSuccessModal();
        
        // Reset form
        form.reset();
        
    } catch (error) {
        console.error('Error sending email:', error);
        alert('There was an error submitting your appointment request. Please try again or contact directly via email.');
        
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