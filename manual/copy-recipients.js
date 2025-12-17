// API Helper - Fetches subscribers from the Netlify Function
async function fetchSubscribers() {
    try {
        const response = await fetch('/.netlify/functions/get-subscribers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token') || 'public'}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subscribers');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return [];
    }
}

// Format date for the UI
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Get initials from email for the avatar circle
function getInitials(email) {
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase();
}

// Render recipients into the grid with animation delays
function renderRecipients(subscribers) {
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const recipientsGrid = document.getElementById('recipients-grid');
    const totalCount = document.getElementById('total-count');
    const activeCount = document.getElementById('active-count');

    // Update stats
    totalCount.textContent = subscribers.length;
    activeCount.textContent = subscribers.length;

    // Hide loading
    loadingState.style.display = 'none';

    if (subscribers.length === 0) {
        emptyState.style.display = 'block';
        recipientsGrid.style.display = 'none';
        return;
    }

    // Show grid
    emptyState.style.display = 'none';
    recipientsGrid.style.display = 'grid';

    // Render cards with stagger animation
    recipientsGrid.innerHTML = subscribers.map((subscriber, index) => `
        <div class="recipient-card" style="animation-delay: ${index * 0.05}s">
            <div class="recipient-avatar">${getInitials(subscriber.email)}</div>
            <div class="recipient-info">
                <div class="recipient-email" title="${subscriber.email}">${subscriber.email}</div>
                <div class="recipient-date">Joined ${formatDate(subscriber.subscribed_at)}</div>
            </div>
        </div>
    `).join('');
}

// Open modal and generate the comma-separated string
function openModal(subscribers) {
    const modal = document.getElementById('modal');
    const emailsTextarea = document.getElementById('emails-textarea');
    const modalEmailCount = document.getElementById('modal-email-count');

    // Format: email1, email2, email3
    const emailList = subscribers.map(s => s.email).join(', ');

    emailsTextarea.value = emailList;
    modalEmailCount.textContent = subscribers.length;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Reset copy button state if it was changed
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.classList.remove('copied');
    copyBtn.querySelector('.copy-text').textContent = 'Copy to Clipboard';
    copyBtn.querySelector('.copy-icon').style.display = 'inline-block';
    copyBtn.querySelector('.check-icon').style.display = 'none';
}

// Initialize application
let currentSubscribers = [];

async function init() {
    currentSubscribers = await fetchSubscribers();
    renderRecipients(currentSubscribers);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    init();

    // Copy All button (Main UI)
    document.getElementById('copy-all-btn').addEventListener('click', () => {
        if (currentSubscribers.length === 0) {
            alert('No subscribers to copy!');
            return;
        }
        openModal(currentSubscribers);
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', async () => {
        const loadingState = document.getElementById('loading-state');
        const recipientsGrid = document.getElementById('recipients-grid');
        
        loadingState.style.display = 'block';
        recipientsGrid.style.display = 'none';
        
        currentSubscribers = await fetchSubscribers();
        renderRecipients(currentSubscribers);
    });

    // Modal Close buttons
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);

    // Copy logic within Modal
    document.getElementById('copy-btn').addEventListener('click', async () => {
        const emailsTextarea = document.getElementById('emails-textarea');
        const copyBtn = document.getElementById('copy-btn');
        const copyText = copyBtn.querySelector('.copy-text');
        const copyIcon = copyBtn.querySelector('.copy-icon');
        const checkIcon = copyBtn.querySelector('.check-icon');

        try {
            // Select and copy
            emailsTextarea.select();
            await navigator.clipboard.writeText(emailsTextarea.value);

            // Visual Success Feedback
            copyBtn.classList.add('copied');
            copyText.textContent = 'Copied!';
            copyIcon.style.display = 'none';
            checkIcon.style.display = 'inline-block';

            // Reset after 2 seconds
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyText.textContent = 'Copy to Clipboard';
                copyIcon.style.display = 'inline-block';
                checkIcon.style.display = 'none';
            }, 2000);

        } catch (err) {
            console.error('Copy failed', err);
            alert('Failed to copy to clipboard.');
        }
    });
});
