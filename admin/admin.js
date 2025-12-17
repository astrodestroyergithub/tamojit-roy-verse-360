// Check authentication
function checkAuth() {
  const token = localStorage.getItem("admin_token");
  if (!token && !window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
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
    localStorage.removeItem("admin_token");
    window.location.href = "index.html";
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
    };
    document.getElementById("page-title").textContent = titles[tab];

    // Load data for specific tabs
    if (tab === "overview") loadOverview();
    if (tab === "subscribers") loadSubscribers();
    if (tab === "newsletters") loadNewsletters();
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
      /*** Code to be removed completely as per instructions 
      const { response, data } = await apiCall(
        "/.netlify/functions/create-newsletter",
        {
          method: "POST",
          body: JSON.stringify(newsletter),
        }
      );
      ***/

      // The above was replaced with the below exact code as per instructions
      const { response, data } = await apiCall(
        "/.netlify/functions/create-newsletter",
        {
          method: "POST",
          body: JSON.stringify(newsletter),
        }
      );

      if (response.ok && !scheduleCheckbox.checked) {
        await apiCall("/.netlify/functions/send-newsletter", {
          method: "POST",
          body: JSON.stringify({ newsletter_id: data.id }),
        });
      }
      // End of code to be used now after removing the old code snippet

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

document.addEventListener("DOMContentLoaded", () => {
  const manualSendBtn = document.getElementById("manual-send-btn");
  const emailModal = document.getElementById("email-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const emailStringArea = document.getElementById("email-string-area");
  const copyEmailsBtn = document.getElementById("copy-emails-btn");

  // 1. Function to grab emails from the table
  manualSendBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll("#subscribers-table-body tr");
    const emails = [];

    rows.forEach((row) => {
      const emailCell = row.cells[0]; // Email is the first column
      if (emailCell) {
        emails.push(emailCell.textContent.trim());
      }
    });

    if (emails.length === 0) {
      alert("No subscribers found.");
      return;
    }

    // Join with comma and space
    emailStringArea.value = emails.join(", ");
    emailModal.style.display = "flex";
  });

  // 2. Function to copy text
  copyEmailsBtn.addEventListener("click", () => {
    emailStringArea.select();
    document.execCommand("copy");
    copyEmailsBtn.textContent = "Copied!";
    setTimeout(() => {
      copyEmailsBtn.textContent = "Copy to Clipboard";
    }, 2000);
  });

  // 3. Close Modal
  closeModalBtn.addEventListener("click", () => {
    emailModal.style.display = "none";
  });
});

// Initialize
loadOverview();
