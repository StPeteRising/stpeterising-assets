document.addEventListener("DOMContentLoaded", () => {
  const sheetURL = 'https://opensheet.elk.sh/1e7n0NgW7swUmn6hqCW2KslFgVd3RJhQRiuVSaIY3A1c/Sheet1';
  const projectName = document.getElementById('page-title')?.textContent.trim() || '';
  const container = document.getElementById("project-info");

  if (!container) {
    console.error("Container element with id 'project-info' not found.");
    return;
  }

  console.log("Starting fetch for project:", projectName);

  fetch(sheetURL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Data fetched:", data.length, "rows");

      if (!projectName) {
        console.warn("Project name not specified.");
        container.innerHTML = "Project name not specified.";
        return;
      }

      const project = data.find(p => p["Project Name"] === projectName);

      if (!project) {
        console.error("Project not found for:", projectName);
        container.innerHTML = "Project not found.";
        return;
      }

      console.log("Found project data:", project);

      const status = (project.Status || '').trim();

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
          <div class="stat-block"><div class="label">Address</div><span>${project.Address || ''}</span></div>
          <div class="stat-block"><div class="label">Class</div><span>${project.Class || ''}</span></div>
          <div class="stat-block"><div class="label">Floors</div><span>${project.Floors || ''}</span></div>
          <div class="stat-block"><div class="label">Units</div><span>${project.Units || ''}</span></div>
          <div class="stat-block"><div class="label">Completion</div><span>${project.Completion || ''}</span></div>
        </div>
        ${lastUpdatedFormatted ? `<div class="last-updated-note">Last updated on ${lastUpdatedFormatted}</div>` : ''}
      `;

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
      console.error("Fetch error:", err);
      container.innerHTML = "Error loading project data.";
    });
});
