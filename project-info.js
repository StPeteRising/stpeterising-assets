document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const projectName = document.getElementById('page-title')?.textContent.trim() || '';
  const container = document.getElementById("project-info");

  if (!container) return;

  fetch(sheetURL)
    .then(response => response.json())
    .then(data => {
      if (!projectName) {
        container.innerHTML = "Project name not specified.";
        return;
      }

      const project = data.find(p => p["Project Name"] === projectName);
      if (!project) {
        container.innerHTML = "Project not found.";
        return;
      }

      const status = project.Status.trim();

      const fillProposed = ['Proposed', 'Approved', 'Under Construction', 'Complete'].includes(status);
      const fillApproved = ['Approved', 'Under Construction', 'Complete'].includes(status);
      const fillUnderConstruction = ['Under Construction', 'Complete'].includes(status);
      const fillComplete = status === 'Complete';

      const lastUpdatedRaw = project["Last Updated"] || project["LastUpdated"] || '';
      let lastUpdatedFormatted = '';
      if (lastUpdatedRaw) {
        const d = new Date(lastUpdatedRaw);
        if (!isNaN(d)) {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          lastUpdatedFormatted = d.toLocaleDateString(undefined, options);
        }
      }

      container.innerHTML = `
        <div class="project-status-wrapper">
          <div class="project-status-label">Status</div>
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
          <div class="stat-block"><div class="label">Address</div><span>${project.Address}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors}</span></div>
          <div class="stat-block"><div class="label">Units</div><span>${project.Units}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion}</span></div>
        </div>
        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
      `;

      // Highlight completed steps
      const steps = ['Proposed', 'Approved', 'Under Construction', 'Complete'];
      const currentIndex = steps.indexOf(status);
      steps.forEach((step, i) => {
        if (i <= currentIndex) {
          const id = `status-label-${step.toLowerCase().replace(/\s+/g, '-')}`;
          const el = document.getElementById(id);
          if (el) el.style.color = "#000";
        }
      });
    })
    .catch(err => {
      container.innerHTML = "Error loading project data.";
      console.error(err);
    });
});