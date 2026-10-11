document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let activitiesData = {};

  function renderActivities() {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activitiesData).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participantsList = details.participants.length
        ? details.participants
            .map(
              (participant) => `
                <li class="participant-item">
                  <span>${participant}</span>
                  <button
                    type="button"
                    class="delete-participant"
                    data-activity="${name}"
                    data-email="${participant}"
                    aria-label="Remove ${participant} from ${name}"
                    title="Remove participant"
                  >
                    ✕
                  </button>
                </li>
              `
            )
            .join("")
        : "<li class='participant-empty'>No participants yet.</li>";

      activityCard.innerHTML = `
        <div class="activity-header">
          <h4>${name}</h4>
          <span class="spot-badge">${spotsLeft} spots left</span>
        </div>
        <p class="activity-description">${details.description}</p>
        <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
        <div class="participants">
          <h5>Participants</h5>
          <ul>${participantsList}</ul>
        </div>
      `;

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    document.querySelectorAll(".delete-participant").forEach((button) => {
      button.addEventListener("click", async () => {
        const activityName = button.dataset.activity;
        const email = button.dataset.email;

        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
            { method: "DELETE" }
          );
          const result = await response.json();

          if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = "success";
            if (activitiesData[activityName]) {
              activitiesData[activityName].participants = activitiesData[activityName].participants.filter(
                (participant) => participant !== email
              );
            }
            renderActivities();
          } else {
            messageDiv.textContent = result.detail || "Unable to unregister participant.";
            messageDiv.className = "error";
          }

          messageDiv.classList.remove("hidden");
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } catch (error) {
          messageDiv.textContent = "Failed to unregister participant.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          console.error("Error unregistering participant:", error);
        }
      });
    });
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesData = activities;
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        if (activitiesData[activity]) {
          activitiesData[activity].participants = [...activitiesData[activity].participants, email];
        }
        renderActivities();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
