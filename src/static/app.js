document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const toggleAuthButton = document.getElementById("toggle-auth");
  const logoutButton = document.getElementById("logout");
  const authStatus = document.getElementById("auth-status");
  let authToken = localStorage.getItem("authToken");

  function authHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");
  }

  function updateAuthView(user) {
    const loggedIn = Boolean(user);
    loginForm.classList.toggle("hidden", loggedIn);
    registerForm.classList.add("hidden");
    toggleAuthButton.classList.toggle("hidden", loggedIn);
    logoutButton.classList.toggle("hidden", !loggedIn);
    authStatus.classList.toggle("hidden", !loggedIn);
    authStatus.textContent = loggedIn
      ? `Signed in as ${user.name} (${user.email})`
      : "";
    toggleAuthButton.textContent = "Create a profile";
    signupForm.querySelector("button[type=submit]").disabled = !loggedIn;
  }

  async function loadProfile() {
    if (!authToken) {
      updateAuthView(null);
      return;
    }

    const response = await fetch("/auth/me", { headers: authHeaders() });
    if (!response.ok) {
      localStorage.removeItem("authToken");
      authToken = null;
      updateAuthView(null);
      return;
    }
    updateAuthView(await response.json());
  }

  async function authenticate(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "Authentication failed");
    }
    return result;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await authenticate("/auth/login", {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      });
      authToken = result.access_token;
      localStorage.setItem("authToken", authToken);
      updateAuthView(result.user);
      showMessage("Logged in successfully.", "success");
      loginForm.reset();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await authenticate("/auth/register", {
        name: document.getElementById("register-name").value,
        student_id: document.getElementById("register-student-id").value,
        department: document.getElementById("register-department").value,
        email: document.getElementById("register-email").value,
        password: document.getElementById("register-password").value,
      });
      showMessage("Profile created. You can now log in.", "success");
      registerForm.reset();
      toggleAuthButton.click();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  toggleAuthButton.addEventListener("click", () => {
    const showingRegistration = registerForm.classList.toggle("hidden");
    loginForm.classList.toggle("hidden", !showingRegistration);
    toggleAuthButton.textContent = showingRegistration
      ? "Back to log in"
      : "Create a profile";
  });

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    authToken = null;
    updateAuthView(null);
    showMessage("Logged out.", "success");
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
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

  // Initialize app
  loadProfile();
  fetchActivities();
});
