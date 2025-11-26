type Mode = "signin" | "register";

const API_BASE =
  (window as unknown as { TANRID_API?: string }).TANRID_API || "http://localhost:4000";
const TOKEN_KEY = "tanrid_token";
const USER_KEY = "tanrid_user";
const toast = document.getElementById("login-toast");
let toastHandle: number | undefined;

const showLoginToast = (message: string): void => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  if (toastHandle) {
    window.clearTimeout(toastHandle);
  }
  toastHandle = window.setTimeout(() => toast.classList.remove("visible"), 3000);
};

const urlParams = new URLSearchParams(window.location.search);
let currentMode: Mode = (urlParams.get("mode") as Mode) || "signin";

const modeButtons = document.querySelectorAll<HTMLButtonElement>(".toggle-btn");
const panelTitle = document.getElementById("panel-title");
const panelSubtitle = document.getElementById("panel-subtitle");
const primaryAction = document.getElementById("primary-action") as HTMLButtonElement | null;

const setMode = (mode: Mode): void => {
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
    const mode = (btn.dataset.mode as Mode) || "signin";
    setMode(mode);
  });
});

setMode(currentMode);

const authForm = document.getElementById("auth-form") as HTMLFormElement | null;

const googleButton = document.getElementById("google-login");
googleButton?.addEventListener("click", () => {
  showLoginToast("Redirecting to Google secure sign-in...");
  window.setTimeout(() => {
    window.location.href = "https://accounts.google.com/signin";
  }, 800);
});

type RequestOptions = RequestInit & { auth?: boolean };

const getStoredToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { auth = true, headers, ...rest } = options;
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth) {
    const token = getStoredToken();
    if (token) {
      mergedHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { message?: string }).message || "Request failed");
  }
  return data as T;
};

const dialog = document.getElementById("reset-dialog");
const forgotButton = document.getElementById("forgot-password");
const cancelReset = document.getElementById("cancel-reset");
const closeReset = document.getElementById("close-reset");
const resetForm = document.getElementById("reset-form") as HTMLFormElement | null;

const openDialog = (): void => {
  dialog?.classList.add("visible");
  dialog?.setAttribute("aria-hidden", "false");
};

const closeDialog = (): void => {
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
  const email = new FormData(resetForm).get("reset-email") as string;
  apiRequest<{ message: string }>("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
    auth: false,
  })
    .then(response => {
      closeDialog();
      showLoginToast(response.message || `Reset instructions sent to ${email}`);
    })
    .catch(error => showLoginToast(error.message));
});

const rememberCheckbox = document.querySelector<HTMLInputElement>('input[name="remember"]');

const persistSession = (token: string, user: unknown): void => {
  const storage = rememberCheckbox?.checked ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
};

authForm?.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  };

  const endpoint = currentMode === "signin" ? "/auth/login" : "/auth/register";
  apiRequest<{ user: unknown; token: string }>(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  })
    .then(({ user, token }) => {
      persistSession(token, user);
      showLoginToast(
        currentMode === "signin"
          ? "Signed in successfully."
          : "Account created. Redirecting to dashboard..."
      );
      window.setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    })
    .catch(error => showLoginToast(error.message));
});
