const toast = document.getElementById("login-toast");
let toastHandle;
const showLoginToast = message => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  if (toastHandle) {
    window.clearTimeout(toastHandle);
  }
  toastHandle = window.setTimeout(() => toast.classList.remove("visible"), 3000);
};
const urlParams = new URLSearchParams(window.location.search);
let currentMode = urlParams.get("mode") || "signin";
const modeButtons = document.querySelectorAll(".toggle-btn");
const panelTitle = document.getElementById("panel-title");
const panelSubtitle = document.getElementById("panel-subtitle");
const primaryAction = document.getElementById("primary-action");
const setMode = mode => {
  currentMode = mode;
  modeButtons.forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", String(isActive));
  });
  if (panelTitle) {
    panelTitle.textContent = mode === "signin" ? "Welcome back" : "Create your TanRid account";
  }
  if (panelSubtitle) {
    panelSubtitle.textContent =
      mode === "signin"
        ? "Enter your credentials to continue exploring tutorials and projects."
        : "Create an account to unlock TanRid tutorials and collaborate with your team.";
  }
  if (primaryAction) {
    primaryAction.textContent = mode === "signin" ? "Sign in" : "Create account";
  }
};
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mode || "signin";
    setMode(mode);
  });
});
setMode(currentMode);
const authForm = document.getElementById("auth-form");
authForm?.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const email = formData.get("email");
  if (currentMode === "register") {
    showLoginToast(`Account created for ${email}. Check your inbox to verify.`);
  } else {
    showLoginToast(`Signed in as ${email}`);
  }
});
const googleButton = document.getElementById("google-login");
googleButton?.addEventListener("click", () => {
  showLoginToast("Redirecting to Google secure sign-in...");
  window.setTimeout(() => {
    window.location.href = "https://accounts.google.com/signin";
  }, 800);
});
const dialog = document.getElementById("reset-dialog");
const forgotButton = document.getElementById("forgot-password");
const cancelReset = document.getElementById("cancel-reset");
const closeReset = document.getElementById("close-reset");
const resetForm = document.getElementById("reset-form");
const openDialog = () => {
  dialog?.classList.add("visible");
  dialog?.setAttribute("aria-hidden", "false");
};
const closeDialog = () => {
  dialog?.classList.remove("visible");
  dialog?.setAttribute("aria-hidden", "true");
};
forgotButton?.addEventListener("click", openDialog);
cancelReset?.addEventListener("click", closeDialog);
closeReset?.addEventListener("click", closeDialog);
dialog?.addEventListener("click", event => {
  if (event.target === dialog) {
    closeDialog();
  }
});
resetForm?.addEventListener("submit", event => {
  event.preventDefault();
  const email = new FormData(resetForm).get("reset-email");
  closeDialog();
  showLoginToast(`Reset instructions sent to ${email}`);
});
