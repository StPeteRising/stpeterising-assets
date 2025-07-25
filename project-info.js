document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const container = document.getElementById("project-info");
  const slug = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();

  if (!container) {
    console.error("Container with id 'project-info' not found.");
    return;
  }

  const scriptURL = 'https://script.google.com/macros/s/AKfycbwu3EaIFnqf0Idj3CyieOpjw0xtfCcdfs5_GuD2FMH7-VwvXtATO0YUrhCk0VS7mvE/exec';

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) throw new Error(`Network error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const project = data.find(p => (p.Slug || '').toLowerCase() === slug);
      if (!project) {
        container.innerHTML = "Project not found.";
        return;
      }

      const statusRaw = project.Status || '';
      const status = statusRaw.trim().toLowerCase();
      const isCancelled = status === 'cancelled';

      if (isCancelled) {
        container.classList.add('cancelled');
      } else {
        container.classList.remove('cancelled');
      }

      const fillProposed = ['proposed', 'approved', 'under construction', 'complete'].includes(status);
      const fillApproved = ['approved', 'under construction', 'complete'].includes(status);
      const fillUnderConstruction = ['under construction', 'complete'].includes(status);
      const fillComplete = status === 'complete';

      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          lastUpdatedFormatted = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }

      const cancelledPillHtml = isCancelled
        ? `<span class="cancelled-tag">Cancelled</span>`
        : '';

      // Dynamic label and value for Units or Square Feet based on Class
      const classValue = (project.Class || '').toLowerCase();

      let unitsOrSqFtLabel = 'Units';
      let unitsOrSqFtValue = project.Units || '';

      if (classValue === 'retail' && 'Retail Square Footage' in project) {
        unitsOrSqFtLabel = 'Square Feet';
        unitsOrSqFtValue = project['Retail Square Footage'] || '';
      } else if (classValue === 'office' && 'Office Square Footage' in project) {
        unitsOrSqFtLabel = 'Square Feet';
        unitsOrSqFtValue = project['Office Square Footage'] || '';
      }

      container.innerHTML = `
        <div class="project-status-wrapper">
          <div class="project-status-label">Status</div>
          ${cancelledPillHtml}
          <div class="status-bar-container">
            <div class="status-segment ${fillProposed ? 'proposed' : 'unfilled'}"></div>
            <div class="status-segment ${fillApproved ? 'approved' : 'unfilled'}"></div>
            <div class="status-segment ${fillUnderConstruction ? 'under-construction' : 'unfilled'}"></div>
            <div class="status-segment ${fillComplete ? 'complete' : 'unfilled'}"></div>
          </div>
          <div class="status-steps-labels">
            <div class="status-step-label">Proposed</div>
            <div class="status-step-label">Approved</div>
            <div class="status-step-label">Under Construction</div>
            <div class="status-step-label">Complete</div>
          </div>
        </div>

        <div class="project-stats">
          <div class="stat-block"><div class="label">Address</div><span>${project.Address || ''}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class || ''}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors || ''}</span></div>
          <div class="stat-block"><div class="label">${unitsOrSqFtLabel}</div><span>${unitsOrSqFtValue}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion || ''}</span></div>
        </div>

        <div style="margin-top: 8px; margin-bottom: 12px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <a href="#" id="report-error-toggle" style="color: #666; text-decoration: underline;">Report a data error</a>
            ${lastUpdatedFormatted ? `<span style="color: #666;">Last updated on ${lastUpdatedFormatted}</span>` : ''}
          </div>
        </div>

        <!-- Popup Modal HTML -->
        <div id="data-error-modal" style="
          display:none; position:fixed; z-index:9999; left:0; top:0; width:100%; height:100%;
          background: rgba(0,0,0,0.5); justify-content:center; align-items:center;">
          <div style="
            background:#fff; padding:20px; border-radius:6px; width:90%; max-width:400px;
            box-shadow:0 0 15px rgba(0,0,0,0.3); position:relative;">
            <span id="data-error-close" style="
              position:absolute; top:8px; right:12px; font-weight:bold; font-size:24px; cursor:pointer;">&times;</span>
            <h3>Report a Data Error</h3>
            <textarea id="data-error-message" placeholder="Describe the data issue..." style="
              width:100%; height:100px; margin-bottom:12px; font-size:14px; resize:vertical;"></textarea>
            <button id="data-error-submit" style="
              padding:8px 16px; font-size:14px; cursor:pointer;">Submit</button>
            <div id="data-error-success" style="color:green; margin-top:10px; font-weight:600; display:none;">Thank you! Your report was sent.</div>
            <div id="data-error-error" style="color:red; margin-top:10px; font-weight:600; display:none;">Oops! Something went wrong. Please try again.</div>
          </div>
        </div>
      `;

      if (!isCancelled) {
        const steps = ['proposed', 'approved', 'under construction', 'complete'];
        const currentIndex = steps.indexOf(status);
        steps.forEach((step, i) => {
          const labels = container.querySelectorAll('.status-step-label');
          if (i <= currentIndex && labels[i]) {
            labels[i].style.color = "#000";
          }
        });
      }

      // Popup form elements
      const toggleLink = document.getElementById("report-error-toggle");
      const modal = document.getElementById("data-error-modal");
      const closeBtn = document.getElementById("data-error-close");
      const submitBtn = document.getElementById("data-error-submit");
      const messageBox = document.getElementById("data-error-message");
      const successMsg = document.getElementById("data-error-success");
      const errorMsg = document.getElementById("data-error-error");

      toggleLink.addEventListener("click", (e) => {
        e.preventDefault();
        successMsg.style.display = "none";
        errorMsg.style.display = "none";
        messageBox.value = "";
        modal.style.display = "flex";
        messageBox.focus();
      });

      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      window.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.style.display = "none";
        }
      });

      submitBtn.addEventListener("click", () => {
        const message = messageBox.value.trim();
        if (!message) {
          alert("Please enter a description.");
          messageBox.focus();
          return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";

        const data = new URLSearchParams();
        data.append("pageUrl", window.location.href);
        data.append("message", message);

        fetch(scriptURL, {
          method: "POST",
          body: data,
        })
          .then(response => response.json())
          .then(json => {
            if (json.result === "success") {
              successMsg.style.display = "block";
              errorMsg.style.display = "none";
              messageBox.value = "";
            } else {
              throw new Error(json.error || "Unknown error");
            }
          })
          .catch(err => {
            console.error(err);
            successMsg.style.display = "none";
            errorMsg.style.display = "block";
          })
          .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          });
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "Error loading project data.";
    });
});
