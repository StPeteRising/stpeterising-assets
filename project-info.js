document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const slug = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const container = document.getElementById("project-info");

  if (!container) {
    console.error("Container element with id 'project-info' not found.");
    return;
  }

  console.log("Starting fetch for slug:", slug);

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Data fetched:", data.length, "rows");

      if (!slug) {
        console.warn("Slug not specified.");
        container.innerHTML = "Project slug not specified.";
        return;
      }

      const project = data.find(p => (p.Slug || '').toLowerCase() === slug);

      if (!project) {
        console.error("Project not found for slug:", slug);
        container.innerHTML = "Project not found.";
        return;
      }

      console.log("Found project data:", project);

      const statusRaw = project.Status || '';
      const status = statusRaw.trim();

      const isCancelled = status.toLowerCase() === 'cancelled';

      // Determine progress bar fill based on status (only if not cancelled)
      const fillProposed = !isCancelled && ['Proposed', 'Approved', 'Under Construction', 'Complete'].includes(status);
      const fillApproved = !isCancelled && ['Approved', 'Under Construction', 'Complete'].includes(status);
      const fillUnderConstruction = !isCancelled && ['Under Construction', 'Complete'].includes(status);
      const fillComplete = !isCancelled && status === 'Complete';

      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          lastUpdatedFormatted = d.toLocaleDateString(undefined, options);
        }
      }

      // Cancelled pill HTML
      const cancelledPillHtml = isCancelled
        ? `<span class="cancelled-tag">Cancelled</span>`
        : '';

      container.innerHTML = `
        <div class="project-status-wrapper">
          <div class="project-status-label">
            Status
            ${cancelledPillHtml}
          </div>
          <div class="status-bar-container">
            <div class="status-segment ${fillProposed ? 'proposed' : 'unfilled'}"></div>
            <div class="status-segment ${fillApproved ? 'approved' : 'unfilled'}"></div>
            <div class="status-segment ${fillUnderConstruction ? 'under-construction' : 'unfilled'}"></div>
            <div class="status-segment ${fillComplete ? 'complete' : 'unfilled'}"></div>
          </div>
          <div class="status-steps-labels">
            <div id="status-label-proposed" class="status-step-label">Proposed</div>
            <div id="status-label-approved" class="status-step-label">Approved</div>
            <div id="status-label-under-construction" class="status-step-label">Under Construction</div>
            <div id="status-label-complete" class="status-step-label">Complete</div>
          </div>
        </div>
        <div class="project-stats">
          <div class="stat-block"><div class="label">Address</div><span>${project.Address || ''}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class || ''}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors || ''}</span></div>
          <div class="stat-block"><div class="label">Units</div><span>${project.Units || ''}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion || ''}</span></div>
        </div>
        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
      `;

      // Add or remove cancelled class on main container
      if (isCancelled) {
        container.classList.add('cancelled');
      } else {
        container.classList.remove('cancelled');
      }

      // Darken current and previous steps (only if not cancelled)
      if (!isCancelled) {
        const steps = ['Proposed', 'Approved', 'Under Construction', 'Complete'];
        const currentIndex = steps.indexOf(status);
        steps.forEach((step, i) => {
          if (i <= currentIndex) {
            const id = `status-label-${step.toLowerCase().replace(/\s+/g, '-')}`;
            const el = document.getElementById(id);
            if (el) el.style.color = "#000";
          }
        });
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      container.innerHTML = "Error loading project data.";
      container.classList.remove('cancelled');
    });
});
