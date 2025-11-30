const API_BASE = window.TANRID_API || "http://localhost:4000";
const TOKEN_KEY = "tanrid_token";
const USER_KEY = "tanrid_user";

const toast = document.getElementById("dash-toast");
const showToast = message => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
};

const tabs = document.querySelectorAll(".nav-tab");
const panels = document.querySelectorAll(".panel");
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    panels.forEach(panel => {
      panel.classList.toggle("active", panel.id === tab.dataset.panel);
    });
  });
});

const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
if (!token) {
  window.location.href = "/login.html?mode=signin";
}

const planSelectors = document.querySelectorAll("[data-select-plan]");
const solutionsPanel = document.getElementById("solutions");
const overlay = document.getElementById("paywall-overlay");

const getPlan = () => localStorage.getItem("tanrid_plan") || "free";
const setPlan = plan => {
  localStorage.setItem("tanrid_plan", plan);
  updatePaywall();
  showToast(`Plan updated to ${plan.toUpperCase()}`);
};

const updatePaywall = () => {
  const currentPlan = getPlan();
  const locked = currentPlan === "free";
  solutionsPanel?.classList.toggle("locked", locked);
  overlay?.classList.toggle("visible", locked);
};

planSelectors.forEach(button => {
  button.addEventListener("click", () => {
    const plan = button.getAttribute("data-select-plan");
    if (!plan) return;
    if (plan === "pro") {
      setPlan("pro");
    } else if (plan === "enterprise") {
      showToast("Our team will reach out to customize your plan.");
    } else {
      setPlan("free");
    }
  });
});

document.querySelector("[data-upgrade]")?.addEventListener("click", () => setPlan("pro"));
updatePaywall();

document.getElementById("logout-btn")?.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = "/login.html?mode=signin";
});

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const appendMessage = (text, role = "bot") => {
  const div = document.createElement("div");
  div.className = `chat-message ${role}`;
  div.textContent = text;
  chatLog?.appendChild(div);
  chatLog?.scrollTo({ top: chatLog.scrollHeight, behavior: "smooth" });
};

const sendChat = async message => {
  appendMessage(message, "user");
  try {
    const response = await fetch(`${API_BASE}/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error("Assistant unavailable.");
    const data = await response.json();
    appendMessage(data.reply || "I’m here to help with anything else.");
  } catch (error) {
    appendMessage(error.message || "Something went wrong.", "bot");
  }
};

chatForm?.addEventListener("submit", event => {
  event.preventDefault();
  const value = chatInput?.value.trim();
  if (!value) return;
  chatInput.value = "";
  sendChat(value);
});
