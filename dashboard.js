const API_BASE = window.TANRID_API || "https://tanrid-technologies.onrender.com";
const TOKEN_KEY = "tanrid_token";
const USER_KEY = "tanrid_user";
const VIDEO_PROGRESS_KEY = "tanrid_video_progress";

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
    tabs.forEach(item => item.classList.remove("active"));
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

const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
let currentUser = null;
try {
  currentUser = storedUser ? JSON.parse(storedUser) : null;
} catch (error) {
  currentUser = null;
}

const instructorEmail = "test@tanrid.com";
const isInstructor =
  (currentUser?.email || "").toLowerCase() === instructorEmail.toLowerCase();

const handleUnauthorized = response => {
  if (response.status !== 401) return false;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = "/login.html?mode=signin";
  return true;
};

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
  if (!chatLog) return;
  const div = document.createElement("div");
  div.className = `chat-message ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: "smooth" });
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
    if (handleUnauthorized(response)) return;
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

const MAX_VIDEO_MB = 150;
const uploadToggles = document.querySelectorAll(".upload-toggle");
const instructorNote = document.getElementById("instructor-note");

const categorySections = {
  educational: {
    section: document.getElementById("edu-upload-section"),
    form: document.getElementById("edu-upload-form"),
    fileInput: document.getElementById("edu-video-file"),
    preview: document.getElementById("edu-video-preview"),
    previewPlayer: document.getElementById("edu-video-preview-player"),
    grid: document.getElementById("edu-video-grid"),
    empty: document.getElementById("edu-video-empty"),
  },
  workshop: {
    section: document.getElementById("workshop-upload-section"),
    form: document.getElementById("workshop-upload-form"),
    fileInput: document.getElementById("workshop-video-file"),
    preview: document.getElementById("workshop-video-preview"),
    previewPlayer: document.getElementById("workshop-video-preview-player"),
    grid: document.getElementById("workshop-video-grid"),
    empty: document.getElementById("workshop-video-empty"),
  },
};

Object.values(categorySections).forEach(section => {
  if (section.section) {
    section.section.hidden = !isInstructor;
  }
});

if (instructorNote) {
  instructorNote.hidden = isInstructor;
}

uploadToggles.forEach(button => {
  button.toggleAttribute("disabled", !isInstructor);
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    if (!targetId) return;
    const target = document.getElementById(targetId);
    if (!target) return;
    target.hidden = !target.hidden;
  });
});

const resolveVideoUrl = url =>
  url && url.startsWith("http") ? url : `${API_BASE}${url || ""}`;

const loadVideoProgress = () => {
  try {
    const raw = localStorage.getItem(VIDEO_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
};

const saveVideoProgress = progressMap => {
  localStorage.setItem(VIDEO_PROGRESS_KEY, JSON.stringify(progressMap));
};

const updateVideoProgress = (videoId, currentTime, duration) => {
  if (!videoId || !Number.isFinite(currentTime) || !Number.isFinite(duration)) {
    return;
  }
  const progressMap = loadVideoProgress();
  progressMap[videoId] = {
    currentTime,
    duration,
    updatedAt: Date.now(),
  };
  saveVideoProgress(progressMap);
};

const myVideoGrid = document.getElementById("my-video-grid");
const myVideoEmpty = document.getElementById("my-video-empty");
const myVideoSearch = document.getElementById("my-video-search");
let allVideosCache = [];

const attachVideoTracking = (videoEl, videoId) => {
  if (!(videoEl instanceof HTMLVideoElement) || !videoId) return;

  const handleTimeUpdate = () => {
    const now = Math.floor(videoEl.currentTime);
    const lastSaved = Number(videoEl.dataset.lastSaved || "0");
    if (now - lastSaved < 5) return;
    videoEl.dataset.lastSaved = String(now);
    updateVideoProgress(videoId, videoEl.currentTime, videoEl.duration || 0);
  };

  const handleLoaded = () => {
    updateVideoProgress(videoId, videoEl.currentTime, videoEl.duration || 0);
  };

  const handleEnded = () => {
    updateVideoProgress(videoId, videoEl.duration || 0, videoEl.duration || 0);
  };

  const playPreview = () => {
    if (videoEl.readyState < 2) return;
    videoEl.muted = true;
    videoEl.play().catch(() => {});
  };

  const stopPreview = () => {
    if (!videoEl.paused) {
      videoEl.pause();
    }
  };

  videoEl.addEventListener("timeupdate", handleTimeUpdate);
  videoEl.addEventListener("loadedmetadata", handleLoaded);
  videoEl.addEventListener("ended", handleEnded);
  videoEl.addEventListener("mouseenter", playPreview);
  videoEl.addEventListener("mouseleave", stopPreview);
  videoEl.addEventListener("focus", playPreview);
  videoEl.addEventListener("blur", stopPreview);
};

const renderMyVideos = videos => {
  if (!myVideoGrid || !myVideoEmpty) return;
  allVideosCache = videos;
  const progressMap = loadVideoProgress();
  const query = (myVideoSearch?.value || "").trim().toLowerCase();
  const filtered = videos.filter(video => {
    if (!query) return true;
    const title = (video.title || "").toLowerCase();
    const caption = (video.caption || "").toLowerCase();
    return title.includes(query) || caption.includes(query);
  });

  myVideoGrid.innerHTML = "";
  if (!filtered.length) {
    myVideoEmpty.hidden = false;
    myVideoGrid.appendChild(myVideoEmpty);
    return;
  }
  myVideoEmpty.hidden = true;
  filtered.forEach(video => {
    const card = document.createElement("article");
    card.className = "my-video-card";
    const progress = progressMap[video.id];
    const percent = progress?.duration
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round((progress.currentTime / progress.duration) * 100)
          )
        )
      : 0;
    const minutesLeft = progress?.duration
      ? Math.max(0, Math.ceil((progress.duration - progress.currentTime) / 60))
      : null;
    const statusLabel = percent > 0 && percent < 100 ? "In progress" : "New";
    card.innerHTML = `
      <video data-video-id="${video.id}" controls preload="metadata" src="${resolveVideoUrl(
        video.videoUrl
      )}"></video>
      <div>
        <h3>${video.title}</h3>
        ${video.caption ? `<p>${video.caption}</p>` : ""}
      </div>
      <div class="my-video-badges">
        <span class="my-video-badge">${statusLabel}</span>
        <span class="my-video-badge">${video.category || "Lesson"}</span>
      </div>
      <div class="course-progress">
        <div class="progress-bar">
          <span class="progress-fill" style="width: ${percent}%;"></span>
        </div>
        <div class="my-video-meta">
          <span>${percent}% complete</span>
          <span>${minutesLeft !== null ? `${minutesLeft} min left` : "Not started"}</span>
        </div>
      </div>
      <div class="my-video-actions">
        <button class="btn primary" data-resume-video="${video.id}">${
          percent > 0 && percent < 100 ? "Resume" : "Start"
        }</button>
        <button class="btn ghost" data-open-library="${video.id}">View in library</button>
      </div>
    `;
    myVideoGrid.appendChild(card);
    const player = card.querySelector("video");
    if (player instanceof HTMLVideoElement) {
      attachVideoTracking(player, video.id);
    }
  });
};

const handleResume = event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const resumeId =
    target.getAttribute("data-resume-video") ||
    target.getAttribute("data-open-library");
  if (!resumeId) return;
  const localCard = target.closest(".my-video-card");
  if (localCard && target.getAttribute("data-resume-video")) {
    const player = localCard.querySelector("video");
    if (player instanceof HTMLVideoElement) {
      player.play().catch(() => {});
      player.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }
  const overviewTab = document.querySelector(".nav-tab[data-panel='overview']");
  if (overviewTab instanceof HTMLButtonElement) {
    overviewTab.click();
  }
  const videoCard = document.querySelector(
    `.video-card[data-video-id="${resumeId}"]`
  );
  if (!videoCard) return;
  videoCard.scrollIntoView({ behavior: "smooth", block: "center" });
  if (target.getAttribute("data-resume-video")) {
    const player = videoCard.querySelector("video");
    if (player instanceof HTMLVideoElement) {
      player.play().catch(() => {});
    }
  }
};

myVideoGrid?.addEventListener("click", handleResume);
myVideoSearch?.addEventListener("input", () => renderMyVideos(allVideosCache));

const clearPreview = section => {
  if (section.previewPlayer instanceof HTMLVideoElement) {
    section.previewPlayer.removeAttribute("src");
    section.previewPlayer.load();
  }
  if (section.preview) {
    section.preview.hidden = true;
  }
};

const initPreview = section => {
  if (!section.fileInput || !section.previewPlayer) return;
  section.fileInput.addEventListener("change", () => {
    const file = section.fileInput.files?.[0];
    if (!file || !(section.previewPlayer instanceof HTMLVideoElement)) {
      clearPreview(section);
      return;
    }
    clearPreview(section);
    const previewUrl = URL.createObjectURL(file);
    section.previewPlayer.src = previewUrl;
    if (section.preview) {
      section.preview.hidden = false;
    }
    section.previewPlayer.addEventListener(
      "loadeddata",
      () => URL.revokeObjectURL(previewUrl),
      { once: true }
    );
  });
};

Object.values(categorySections).forEach(initPreview);

const renderVideos = (videos, section, label) => {
  if (!section.grid || !section.empty) return;
  section.grid.innerHTML = "";
  if (!videos.length) {
    section.empty.hidden = false;
    section.grid.appendChild(section.empty);
    return;
  }
  section.empty.hidden = true;
  videos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";
    card.dataset.videoId = video.id;
    const deleteButton = isInstructor
      ? `<button class="delete-video" type="button" data-video-id="${video.id}">Delete</button>`
      : "";
    card.innerHTML = `
      <video data-video-id="${video.id}" controls preload="metadata" src="${resolveVideoUrl(
        video.videoUrl
      )}"></video>
      <h4>${video.title}</h4>
      ${video.caption ? `<p>${video.caption}</p>` : ""}
      <span class="meta">${label} · ${new Date(video.createdAt).toLocaleString()}</span>
      ${deleteButton}
    `;
    section.grid.appendChild(card);
  });

  section.grid.querySelectorAll("video[data-video-id]").forEach(videoEl => {
    if (!(videoEl instanceof HTMLVideoElement)) return;
    const videoId = videoEl.dataset.videoId;
    if (!videoId) return;
    attachVideoTracking(videoEl, videoId);
  });
};

const loadVideos = async () => {
  try {
    const response = await fetch(`${API_BASE}/videos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (handleUnauthorized(response)) return;
    if (!response.ok) throw new Error("Unable to load videos.");
    const videos = await response.json();
    const educational = videos.filter(video => video.category === "educational");
    const workshops = videos.filter(video => video.category === "workshop");
    renderVideos(educational, categorySections.educational, "Educational");
    renderVideos(workshops, categorySections.workshop, "Workshop");
    renderMyVideos(videos);
  } catch (error) {
    Object.values(categorySections).forEach(section => {
      if (!section.empty) return;
      section.empty.textContent = error.message || "Unable to load videos.";
      section.empty.hidden = false;
    });
  }
};

const handleDelete = async event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest(".delete-video");
  if (!button) return;
  const videoId = button.getAttribute("data-video-id");
  if (!videoId) return;
  if (!confirm("Delete this video? This cannot be undone.")) return;
  try {
    const response = await fetch(`${API_BASE}/videos/${videoId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (handleUnauthorized(response)) return;
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Unable to delete video.");
    }
    showToast("Video deleted.");
    loadVideos();
  } catch (error) {
    showToast(error.message || "Unable to delete video.");
  }
};

Object.values(categorySections).forEach(section => {
  section.grid?.addEventListener("click", handleDelete);
});

const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const handleUpload = (section, category) => async event => {
  event.preventDefault();
  if (!section.fileInput?.files?.length) {
    showToast("Select a video to upload.");
    return;
  }
  const submitBtn = section.form?.querySelector("button[type='submit']");
  const originalLabel = submitBtn?.textContent || "";
  if (submitBtn) {
    submitBtn.textContent = "Uploading...";
  }
  submitBtn?.setAttribute("disabled", "true");
  try {
    const formData = new FormData(section.form);
    const file = section.fileInput.files[0];
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showToast(`Video too large. Max size is ${MAX_VIDEO_MB}MB.`);
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      showToast("Large file detected. Upload may take a while.");
    }
    const videoData = await readFileAsDataUrl(file);
    const payload = {
      title: formData.get("video-title"),
      caption: formData.get("video-caption"),
      videoData,
      category,
    };
    const response = await fetch(`${API_BASE}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (handleUnauthorized(response)) return;
    if (response.status === 413) {
      throw new Error(`Video too large. Max size is ${MAX_VIDEO_MB}MB.`);
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Upload failed.");
    }
    showToast("Module published.");
    section.form?.reset();
    clearPreview(section);
    loadVideos();
  } catch (error) {
    showToast(error.message || "Upload failed.");
  } finally {
    if (submitBtn) {
      submitBtn.textContent = originalLabel || "Publish module";
    }
    submitBtn?.removeAttribute("disabled");
  }
};

if (categorySections.educational.form) {
  categorySections.educational.form.addEventListener(
    "submit",
    handleUpload(categorySections.educational, "educational")
  );
}

if (categorySections.workshop.form) {
  categorySections.workshop.form.addEventListener(
    "submit",
    handleUpload(categorySections.workshop, "workshop")
  );
}

loadVideos();
