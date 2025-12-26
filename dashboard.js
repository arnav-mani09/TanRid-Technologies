const API_BASE = window.TANRID_API || "https://tanrid-technologies.onrender.com";
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
const storedUser =
  localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
let currentUser = null;
try {
  currentUser = storedUser ? JSON.parse(storedUser) : null;
} catch (error) {
  currentUser = null;
}
const instructorEmail = "test@tanrid.com";
const isInstructor =
  (currentUser?.email || "").toLowerCase() === instructorEmail.toLowerCase();

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

const videoUploadSection = document.getElementById("video-upload-section");
const videoUploadForm = document.getElementById("video-upload-form");
const videoFileInput = document.getElementById("video-file");
const videoGrid = document.getElementById("video-grid");
const videoEmpty = document.getElementById("video-empty");
const videoPreview = document.getElementById("video-preview");
const videoPreviewPlayer = document.getElementById("video-preview-player");
let previewUrl = "";

if (videoUploadSection) {
  videoUploadSection.hidden = !isInstructor;
}

const resolveVideoUrl = url =>
  url && url.startsWith("http") ? url : `${API_BASE}${url || ""}`;

const renderVideos = videos => {
  if (!videoGrid || !videoEmpty) return;
  videoGrid.innerHTML = "";
  if (!videos.length) {
    videoEmpty.hidden = false;
    videoGrid.appendChild(videoEmpty);
    return;
  }
  videoEmpty.hidden = true;
  videos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";
    const deleteButton = isInstructor
      ? `<button class="delete-video" type="button" data-video-id="${video.id}">Delete</button>`
      : "";
    card.innerHTML = `
      <video controls preload="metadata" src="${resolveVideoUrl(video.videoUrl)}"></video>
      <h4>${video.title}</h4>
      ${video.caption ? `<p>${video.caption}</p>` : ""}
      <span class="meta">Uploaded ${new Date(video.createdAt).toLocaleString()}</span>
      ${deleteButton}
    `;
    videoGrid.appendChild(card);
  });
};

const loadVideos = async () => {
  if (!videoGrid || !videoEmpty) return;
  try {
    const response = await fetch(`${API_BASE}/videos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Unable to load modules.");
    const videos = await response.json();
    renderVideos(videos);
  } catch (error) {
    videoEmpty.textContent = error.message || "Unable to load modules.";
    videoEmpty.hidden = false;
  }
};

videoGrid?.addEventListener("click", async event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const deleteButton = target.closest(".delete-video");
  if (!deleteButton) return;
  const videoId = deleteButton.getAttribute("data-video-id");
  if (!videoId) return;
  if (!confirm("Delete this video? This cannot be undone.")) return;
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Unable to delete video.");
    }
    showToast("Video deleted.");
    loadVideos();
  } catch (error) {
    showToast(error.message || "Unable to delete video.");
  }
});

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const clearPreview = () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = "";
  }
  if (videoPreviewPlayer instanceof HTMLVideoElement) {
    videoPreviewPlayer.removeAttribute("src");
    videoPreviewPlayer.load();
  }
  if (videoPreview) {
    videoPreview.hidden = true;
  }
};

videoFileInput?.addEventListener("change", () => {
  const file = videoFileInput.files?.[0];
  if (!file || !(videoPreviewPlayer instanceof HTMLVideoElement)) {
    clearPreview();
    return;
  }
  clearPreview();
  previewUrl = URL.createObjectURL(file);
  videoPreviewPlayer.src = previewUrl;
  if (videoPreview) {
    videoPreview.hidden = false;
  }
});

videoUploadForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!videoFileInput?.files?.length) {
    showToast("Select a video to upload.");
    return;
  }
  const submitBtn = videoUploadForm.querySelector("button[type='submit']");
  const originalLabel = submitBtn?.textContent || "";
  if (submitBtn) {
    submitBtn.textContent = "Uploading...";
  }
  submitBtn?.setAttribute("disabled", "true");
  try {
    const formData = new FormData(videoUploadForm);
    const file = videoFileInput.files[0];
    if (file.size > 80 * 1024 * 1024) {
      showToast("Large file detected. Upload may take a while.");
    }
    const videoData = await readFileAsDataUrl(file);
    const payload = {
      title: formData.get("video-title"),
      caption: formData.get("video-caption"),
      videoData,
    };
    const response = await fetch(`${API_BASE}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Upload failed.");
    }
    showToast("Module published.");
    videoUploadForm.reset();
    clearPreview();
    loadVideos();
  } catch (error) {
    showToast(error.message || "Upload failed.");
  } finally {
    if (submitBtn) {
      submitBtn.textContent = originalLabel || "Publish module";
    }
    submitBtn?.removeAttribute("disabled");
  }
});

loadVideos();
