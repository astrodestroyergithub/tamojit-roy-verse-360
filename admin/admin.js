// Check authentication
function checkAuth() {
  const token = localStorage.getItem("admin_token");
  if (!token && !window.location.pathname.includes("index.html")) {
    // window.location.href = "index.html";
  }
}

checkAuth();

// API Helper
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("admin_token");
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(endpoint, { ...defaultOptions, ...options });
  const data = await response.json();

  if (response.status === 401) {
    // localStorage.removeItem("admin_token");
    // window.location.href = "index.html";
  }

  return { response, data };
}

// Tab Navigation
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    const tab = this.dataset.tab;

    // Update active nav
    document
      .querySelectorAll(".nav-item")
      .forEach((n) => n.classList.remove("active"));
    this.classList.add("active");

    // Update active tab
    document
      .querySelectorAll(".tab-content")
      .forEach((t) => t.classList.remove("active"));
    document.getElementById(`${tab}-tab`).classList.add("active");

    // Update page title
    const titles = {
      overview: "Overview",
      subscribers: "Subscribers",
      newsletters: "All Newsletters",
      create: "Create Newsletter",
      upload: "Upload Documents",
      freelance: "Freelance Dashboard",
    };
    document.getElementById("page-title").textContent = titles[tab];

    // Load data for specific tabs
    if (tab === "overview") loadOverview();
    if (tab === "subscribers") loadSubscribers();
    if (tab === "newsletters") loadNewsletters();
    if (tab === "upload") loadUploads();
    if (tab === "freelance") loadFreelance();
  });
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("admin_token");
  window.location.href = "index.html";
});

// Load Overview
async function loadOverview() {
  const { data: subscribers } = await apiCall(
    "/.netlify/functions/get-subscribers"
  );
  const { data: newsletters } = await apiCall(
    "/.netlify/functions/get-newsletters"
  );

  document.getElementById("total-subscribers").textContent = subscribers.length;
  document.getElementById("total-newsletters").textContent = newsletters.length;
  document.getElementById("sent-newsletters").textContent = newsletters.filter(
    (n) => n.status === "sent"
  ).length;
  document.getElementById("scheduled-newsletters").textContent =
    newsletters.filter((n) => n.status === "scheduled").length;

  // Show recent newsletters
  const recentList = document.getElementById("recent-newsletters");
  const recent = newsletters.slice(0, 5);

  if (recent.length === 0) {
    recentList.innerHTML = '<p style="color: #999;">No newsletters yet</p>';
  } else {
    recentList.innerHTML = recent
      .map(
        (n) => `
            <div class="activity-item">
                <h4>${n.title}</h4>
                <p>Status: <span class="status-badge status-${n.status}">${
          n.status
        }</span></p>
                <p>${new Date(n.created_at).toLocaleDateString()}</p>
            </div>
        `
      )
      .join("");
  }
}

// Load Subscribers
async function loadSubscribers() {
  const { data: subscribers } = await apiCall(
    "/.netlify/functions/get-subscribers"
  );
  const tbody = document.getElementById("subscribers-table-body");

  if (subscribers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align: center; color: #999;">No subscribers yet</td></tr>';
  } else {
    tbody.innerHTML = subscribers
      .map(
        (s) => `
            <tr>
                <td>${s.email}</td>
                <td>${new Date(s.subscribed_at).toLocaleString()}</td>
                <td>${s.ip_address || "N/A"}</td>
            </tr>
        `
      )
      .join("");
  }
}

// Export Subscribers
document
  .getElementById("export-subscribers")
  .addEventListener("click", async () => {
    const { data: subscribers } = await apiCall(
      "/.netlify/functions/get-subscribers"
    );

    const csv = [
      ["Email", "Subscribed Date", "IP Address"],
      ...subscribers.map((s) => [
        s.email,
        new Date(s.subscribed_at).toISOString(),
        s.ip_address || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  });

// Load Newsletters
async function loadNewsletters() {
  const { data: newsletters } = await apiCall(
    "/.netlify/functions/get-newsletters"
  );
  const container = document.getElementById("newsletters-list");
  if (newsletters.length === 0) {
    container.innerHTML =
      '<p style="color: #999;">No newsletters yet. Create your first one!</p>';
  } else {
    container.innerHTML = newsletters
      .map(
        (n) => `
        <div class="newsletter-card">
            <div class="newsletter-info">
                <h3>${n.title}</h3>
                <div class="newsletter-meta">
                    <span class="meta-item">📧 Subject: ${n.subject}</span>
                    <span class="meta-item">👥 Recipients: ${
                      n.total_recipients || 0
                    }</span>
                    <span class="meta-item">✅ Sent: ${
                      n.successful_sends || 0
                    }</span>
                    ${
                      n.scheduled_at
                        ? `<span class="meta-item">⏰ ${new Date(
                            n.scheduled_at
                          ).toLocaleString()}</span>`
                        : ""
                    }
                </div>
                <span class="status-badge status-${
                  n.status
                }">${n.status.toUpperCase()}</span>
            </div>
            <div class="newsletter-actions">
                <button class="btn-small btn-delete" onclick="deleteNewsletter(${
                  n.id
                })">Delete</button>
            </div>
        </div>
    `
      )
      .join("");
  }
}

// Delete Newsletter
async function deleteNewsletter(id) {
  if (!confirm("Are you sure you want to delete this newsletter?")) return;
  await apiCall("/.netlify/functions/delete-newsletter", {
    method: "POST",
    body: JSON.stringify({ id }),
  });

  loadNewsletters();
  loadOverview();
}

// Schedule Toggle
document
  .getElementById("schedule-send")
  .addEventListener("change", function () {
    const scheduleGroup = document.getElementById("schedule-group");
    const sendBtnText = document.getElementById("send-btn-text");
    if (this.checked) {
      scheduleGroup.style.display = "block";
      sendBtnText.textContent = "Schedule Newsletter";
    } else {
      scheduleGroup.style.display = "none";
      sendBtnText.textContent = "Send Now";
    }
  });

// Newsletter Form Submit
document
  .getElementById("newsletter-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("newsletter-title").value;
    const subject = document.getElementById("newsletter-subject").value;
    const content = document.getElementById("newsletter-content").value;
    const imageUrl = document.getElementById("newsletter-image").value;
    const scheduleCheckbox = document.getElementById("schedule-send");
    const scheduleDatetime = document.getElementById("schedule-datetime").value;

    const newsletter = {
      title,
      subject,
      content,
      image_url: imageUrl,
      status: scheduleCheckbox.checked ? "scheduled" : "sending",
      scheduled_at: scheduleCheckbox.checked ? scheduleDatetime : null,
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
      const { response, data } = await apiCall(
        "/.netlify/functions/create-newsletter",
        {
          method: "POST",
          body: JSON.stringify(newsletter),
        }
      );

      if (response.ok) {
        alert("Newsletter created successfully!");
        e.target.reset();
        document.getElementById("schedule-group").style.display = "none";
        loadOverview();
        loadNewsletters();
      } else {
        alert(data.error || "Failed to create newsletter");
      }
    } finally {
      btn.disabled = false;
      btn.textContent = scheduleCheckbox.checked
        ? "Schedule Newsletter"
        : "Send Now";
    }
  });

// Save Draft
document
  .getElementById("save-draft-btn")
  .addEventListener("click", async () => {
    const title = document.getElementById("newsletter-title").value;
    const subject = document.getElementById("newsletter-subject").value;
    const content = document.getElementById("newsletter-content").value;
    const imageUrl = document.getElementById("newsletter-image").value;
    if (!title || !subject || !content) {
      alert("Please fill in at least title, subject, and content");
      return;
    }

    const newsletter = {
      title,
      subject,
      content,
      image_url: imageUrl,
      status: "draft",
    };

    const btn = document.getElementById("save-draft-btn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      await apiCall("/.netlify/functions/create-newsletter", {
        method: "POST",
        body: JSON.stringify(newsletter),
      });

      alert("Draft saved successfully!");
      document.getElementById("newsletter-form").reset();
    } finally {
      btn.disabled = false;
      btn.textContent = "Save as Draft";
    }
  });

// Copy Emails Modal Functionality
const copyEmailsBtn = document.getElementById("copy-emails-btn");
const copyEmailsModal = document.getElementById("copy-emails-modal");
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalCancel = document.getElementById("modal-cancel");
const copyToClipboardBtn = document.getElementById("copy-to-clipboard-btn");
const emailsTextarea = document.getElementById("emails-textarea");
const emailCount = document.getElementById("email-count");

// Open modal
copyEmailsBtn.addEventListener("click", async () => {
  // Fetch subscribers
  const { data: subscribers } = await apiCall(
    "/.netlify/functions/get-subscribers"
  );

  if (subscribers.length === 0) {
    alert("No subscribers found!");
    return;
  }

  // Create comma-separated email list
  const emailList = subscribers.map((s) => s.email).join(", ");

  // Update modal content
  emailsTextarea.value = emailList;
  emailCount.textContent = subscribers.length;

  // Show modal
  copyEmailsModal.classList.add("show");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
});

// Close modal functions
function closeModal() {
  copyEmailsModal.classList.remove("show");
  document.body.style.overflow = "auto"; // Re-enable scrolling
}

modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

// Close on ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && copyEmailsModal.classList.contains("show")) {
    closeModal();
  }
});

// Copy to clipboard
copyToClipboardBtn.addEventListener("click", async () => {
  const emailList = emailsTextarea.value;

  try {
    // Modern clipboard API
    await navigator.clipboard.writeText(emailList);

    // Show success feedback
    const btnText = copyToClipboardBtn.querySelector(".btn-text");
    const originalText = btnText.textContent;

    copyToClipboardBtn.classList.add("btn-success");
    btnText.textContent = "Copied!";

    // Reset after 2 seconds
    setTimeout(() => {
      copyToClipboardBtn.classList.remove("btn-success");
      btnText.textContent = originalText;
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    emailsTextarea.select();
    document.execCommand("copy");

    alert("Email addresses copied to clipboard!");
  }
});

// Initialize
loadOverview();

// Keep all existing functions from original admin.js and add new ones

// ============================================
// UPLOAD TAB FUNCTIONALITY
// ============================================

// Update filename preview
function updateFilenamePreview() {
  const title = document.getElementById('upload-doc-newsletter-title').value.replace(/\s+/g, '_');
  const subject = document.getElementById('upload-doc-email-subject').value.replace(/\s+/g, '_');
  const status = document.getElementById('upload-doc-status').value;
  const scheduledTime = document.getElementById('upload-doc-scheduled-time').value;
  
  if (!title || !subject || !status) {
    document.getElementById('upload-doc-preview-filename').textContent = '-';
    return;
  }
  
  const today = new Date().toISOString().split('T')[0];
  let filename = `${title}_${subject}_${status}`;
  
  if (status === 'scheduled' && scheduledTime) {
    filename += `_${scheduledTime.replace('T', 'T')}`;
  }
  
  filename += `_${today}.docx`;
  document.getElementById('upload-doc-preview-filename').textContent = filename;
}

// Show/hide scheduled time field
document.getElementById('upload-doc-status')?.addEventListener('change', function() {
  const scheduledGroup = document.getElementById('upload-doc-scheduled-group');
  if (this.value === 'scheduled') {
    scheduledGroup.style.display = 'block';
  } else {
    scheduledGroup.style.display = 'none';
  }
  updateFilenamePreview();
});

// Update preview on input
['upload-doc-newsletter-title', 'upload-doc-email-subject', 'upload-doc-scheduled-time'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', updateFilenamePreview);
});

// Upload form submission
document.getElementById('upload-doc-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fileInput = document.getElementById('upload-doc-file');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    alert('File size must be less than 10MB');
    return;
  }
  
  const btn = document.getElementById('upload-doc-submit-btn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Uploading...';
  
  try {
    // Read file as base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64Content = reader.result.split(',')[1];
      const filename = document.getElementById('upload-doc-preview-filename').textContent;
      
      const uploadData = {
        filename,
        content: base64Content,
        newsletterTitle: document.getElementById('upload-doc-newsletter-title').value,
        emailSubject: document.getElementById('upload-doc-email-subject').value,
        status: document.getElementById('upload-doc-status').value,
        scheduledTimestamp: document.getElementById('upload-doc-scheduled-time').value || null
      };
      
      const { response, data } = await apiCall('/.netlify/functions/upload-document', {
        method: 'POST',
        body: JSON.stringify(uploadData)
      });
      
      if (response.ok) {
        alert('Document uploaded successfully!');
        document.getElementById('upload-doc-form').reset();
        document.getElementById('upload-doc-preview-filename').textContent = '-';
        loadUploads();
      } else {
        alert(data.error || 'Upload failed');
      }
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Upload Document';
  }
});

// Reset form
document.getElementById('upload-doc-reset-btn')?.addEventListener('click', () => {
  document.getElementById('upload-doc-form').reset();
  document.getElementById('upload-doc-preview-filename').textContent = '-';
  document.getElementById('upload-doc-scheduled-group').style.display = 'none';
});

// Load uploads
async function loadUploads() {
  try {
    const { data: uploads } = await apiCall('/.netlify/functions/get-uploads');
    const container = document.getElementById('upload-doc-list-container');
    
    if (uploads.length === 0) {
      container.innerHTML = `
        <div class="upload-doc-empty-state">
          <div class="upload-doc-empty-icon">📭</div>
          <p>No documents uploaded yet</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = uploads.map(upload => `
      <div class="upload-doc-card">
        <div class="upload-doc-file-icon">📄</div>
        <div class="upload-doc-card-info">
          <h4>${upload.newsletter_title}</h4>
          <p>${upload.email_subject}</p>
          <div class="upload-doc-card-meta">
            <span class="upload-doc-meta-item">📅 ${new Date(upload.upload_date).toLocaleDateString()}</span>
            <span class="upload-doc-meta-item">📦 ${(upload.file_size / 1024).toFixed(2)} KB</span>
          </div>
          <span class="upload-doc-status-badge upload-doc-status-${upload.status}">${upload.status.toUpperCase()}</span>
          ${upload.scheduled_timestamp ? `<p style="margin-top: 8px; color: #856404;">⏰ Scheduled: ${new Date(upload.scheduled_timestamp).toLocaleString()}</p>` : ''}
        </div>
        <div class="upload-doc-card-actions">
          <a href="${upload.github_url}" download class="upload-doc-btn-download">📥 Download</a>
          <button class="upload-doc-btn-delete" onclick="deleteUpload(${upload.id}, '${upload.filename}', '${upload.github_sha}')">🗑️ Delete</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Load uploads error:', error);
  }
}

// Delete upload
async function deleteUpload(id, filename, sha) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  
  try {
    await apiCall('/.netlify/functions/delete-upload', {
      method: 'POST',
      body: JSON.stringify({ id, filename, sha })
    });
    
    alert('Document deleted successfully');
    loadUploads();
  } catch (error) {
    console.error('Delete error:', error);
    alert('Delete failed: ' + error.message);
  }
}

// ============================================
// FREELANCE TAB FUNCTIONALITY
// ============================================

let appointmentsData = null;
let chartInstances = {};

/*** COMMENTING OUT FOR NOW
// Load freelance data
async function loadFreelance() {
  try {
    const { data } = await apiCall('/.netlify/functions/get-appointments');
    appointmentsData = data;
    
    // Update stats
    document.getElementById('freelance-total-appointments').textContent = data.analytics.total_appointments;
    document.getElementById('freelance-pending-count').textContent = data.analytics.pending_count;
    document.getElementById('freelance-confirmed-count').textContent = data.analytics.confirmed_count;
    document.getElementById('freelance-urgent-count').textContent = data.analytics.urgent_count;
    
    // Render charts
    renderServiceChart(data.serviceStats);
    renderBudgetChart(data.budgetStats);
    renderMonthlyChart(data.monthlyTrends);
    renderMeetingChart(data.meetingTypeStats);
    
    // Render table
    renderAppointmentsTable(data.appointments);
    
  } catch (error) {
    console.error('Load freelance error:', error);
  }
}

// Render service chart
function renderServiceChart(serviceStats) {
  const ctx = document.getElementById('freelance-service-chart');
  if (!ctx) return;
  
  if (chartInstances.service) chartInstances.service.destroy();
  
  chartInstances.service = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: serviceStats.map(s => s.service),
      datasets: [{
        label: 'Requests',
        data: serviceStats.map(s => s.count),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Render budget chart
function renderBudgetChart(budgetStats) {
  const ctx = document.getElementById('freelance-budget-chart');
  if (!ctx) return;
  
  if (chartInstances.budget) chartInstances.budget.destroy();
  
  chartInstances.budget = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: budgetStats.map(b => b.budget),
      datasets: [{
        data: budgetStats.map(b => b.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Render monthly chart
function renderMonthlyChart(monthlyTrends) {
  const ctx = document.getElementById('freelance-monthly-chart');
  if (!ctx) return;
  
  if (chartInstances.monthly) chartInstances.monthly.destroy();
  
  chartInstances.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthlyTrends.map(m => m.month).reverse(),
      datasets: [{
        label: 'Appointments',
        data: monthlyTrends.map(m => m.count).reverse(),
        borderColor: 'rgba(118, 75, 162, 1)',
        backgroundColor: 'rgba(118, 75, 162, 0.2)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Render meeting chart
function renderMeetingChart(meetingTypeStats) {
  const ctx = document.getElementById('freelance-meeting-chart');
  if (!ctx) return;
  
  if (chartInstances.meeting) chartInstances.meeting.destroy();
  
  chartInstances.meeting = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: meetingTypeStats.map(m => m.meeting_type),
      datasets: [{
        data: meetingTypeStats.map(m => m.count),
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(156, 39, 176, 0.8)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
} ***/

// Render appointments table
async function renderAppointmentsTable() {
  const { data: appointments } = await apiCall(
    "/.netlify/functions/get-appointments"
  );
  const tbody = document.getElementById('freelance-appointments-table');

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No appointments yet</td></tr>';
  } else {
    tbody.innerHTML = appointments
      .map(
        (a) => `
          <tr>
            <td>${new Date(a.created_at).toLocaleString()}</td>
            <td>${a.email}</td>
            <td>${a.project_title}</td>
            <td>${a.budget}</td>
            <td>${a.status}</td>
            <td>${a.meeting_type}</td>
          </tr>
        `
      ).join("");
  }
}
/*** COMMENTING OUT FOR NOW
function renderAppointmentsTable(appointments) {
  const tbody = document.getElementById('freelance-appointments-table');
  if (!tbody) return;
  
  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No appointments yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = appointments.map(apt => `
    <tr>
      <td>${new Date(apt.submission_date).toLocaleDateString()}</td>
      <td>${apt.first_name} ${apt.last_name}<br><small>${apt.email}</small></td>
      <td>${apt.project_title}</td>
      <td>${apt.budget}</td>
      <td>
        <select class="freelance-status-select freelance-status-${apt.status}" 
                onchange="updateAppointmentStatus(${apt.id}, this.value)">
          <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="freelance-view-details-btn" onclick="viewAppointmentDetails(${apt.id})">View</button>
      </td>
    </tr>
  `).join('');
} ***/

// Update appointment status
async function updateAppointmentStatus(id, status) {
  try {
    await apiCall('/.netlify/functions/update-appointment-status', {
      method: 'POST',
      body: JSON.stringify({ id, status })
    });
    
    loadFreelance();
  } catch (error) {
    console.error('Update status error:', error);
    alert('Failed to update status');
  }
}

// View appointment details
function viewAppointmentDetails(id) {
  const appointment = appointmentsData.appointments.find(a => a.id === id);
  if (!appointment) return;
  
  // Create and show modal (you can enhance this further)
  alert(`
Appointment Details:

Client: ${appointment.first_name} ${appointment.last_name}
Email: ${appointment.email}
Phone: ${appointment.phone}
Company: ${appointment.company || 'N/A'}

Project: ${appointment.project_title}
Description: ${appointment.project_description}

Budget: ${appointment.budget}
Timeline: ${appointment.timeline}

Meeting Type: ${appointment.meeting_type}
Preferred Date: ${new Date(appointment.preferred_date).toLocaleDateString()}
Preferred Time: ${appointment.preferred_time}

Services: ${appointment.services.join(', ')}

Status: ${appointment.status}
Urgent: ${appointment.urgent_request ? 'Yes' : 'No'}
NDA Required: ${appointment.nda_required ? 'Yes' : 'No'}
  `);
}

// Export appointments
document.getElementById('freelance-export-btn')?.addEventListener('click', () => {
  if (!appointmentsData) return;
  
  const csv = [
    ['Date', 'Name', 'Email', 'Phone', 'Project', 'Budget', 'Status'],
    ...appointmentsData.appointments.map(a => [
      new Date(a.submission_date).toISOString(),
      `${a.first_name} ${a.last_name}`,
      a.email,
      a.phone,
      a.project_title,
      a.budget,
      a.status
    ])
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appointments-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
});

// ============================================
// UPDATE TAB NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    const tab = this.dataset.tab;
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    this.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    const titles = {
      overview: 'Overview',
      subscribers: 'Subscribers',
      newsletters: 'All Newsletters',
      create: 'Create Newsletter',
      upload: 'Upload Documents',
      freelance: 'Freelance Dashboard'
    };
    document.getElementById('page-title').textContent = titles[tab];
    
    // Load data for specific tabs
    if (tab === 'overview') loadOverview();
    if (tab === 'subscribers') loadSubscribers();
    if (tab === 'newsletters') loadNewsletters();
    if (tab === 'upload') loadUploads();
    if (tab === 'freelance') loadFreelance();
  });
});
