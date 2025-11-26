type Nullable<T> = T | null;

const yearLabel = document.getElementById("year");
if (yearLabel) {
  yearLabel.textContent = new Date().getFullYear().toString();
}

const progressBars = document.querySelectorAll<HTMLDivElement>(".progress-fill");
const progressObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target as HTMLElement;
        const value = fill.getAttribute("data-progress") ?? "0";
        fill.style.width = `${value}%`;
        progressObserver.unobserve(fill);
      }
    });
  },
  { threshold: 0.4 }
);
progressBars.forEach(bar => progressObserver.observe(bar));

const animatedElements = document.querySelectorAll<HTMLElement>("[data-animate]");
const animationObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        animationObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);
animatedElements.forEach(el => animationObserver.observe(el));

const toastElement = document.getElementById("action-toast");
let toastTimer: number | undefined;

const showToast = (message: string): void => {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }
  toastTimer = window.setTimeout(() => {
    toastElement?.classList.remove("visible");
  }, 3000);
};

const scrollToSection = (selector: string): void => {
  const target = document.querySelector<HTMLElement>(selector);
  target?.scrollIntoView({ behavior: "smooth" });
};

const messageField = document.querySelector<HTMLTextAreaElement>('textarea[name="message"]');
const prefillMessage = (text: string): void => {
  if (!messageField) return;
  if (messageField.value.trim().length > 0) {
    messageField.value = `${messageField.value}\n\n${text}`;
  } else {
    messageField.value = text;
  }
};

document.querySelectorAll<HTMLButtonElement>("[data-scroll]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.scroll;
    if (target) {
      scrollToSection(target);
    }
    const message = button.dataset.message;
    if (message) {
      prefillMessage(message);
    }
    const toast = button.dataset.toast;
    if (toast) {
      showToast(toast);
    }
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-service]").forEach(button => {
  button.addEventListener("click", () => {
    const service = button.dataset.service ?? "this service";
    prefillMessage(`We would like to talk about ${service}.`);
    scrollToSection("#contact");
    showToast(`Prefilled your message with "${service}".`);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-navigate]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.navigate;
    if (target) {
      window.location.assign(target);
    }
  });
});

const buildMailLink = (to: string, subject: string, body: string): string => {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
};

document.querySelectorAll<HTMLButtonElement>("[data-mail-to]").forEach(button => {
  button.addEventListener("click", () => {
    const email = button.dataset.mailTo ?? "hello@tanrid.com";
    const subject = button.dataset.mailSubject ?? "TanRid inquiry";
    const body =
      button.dataset.mailBody ??
      "Hi TanRid team,\n\nI'd like to learn more about your services.\n\nThanks!";
    window.location.href = buildMailLink(email, subject, body);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-role]").forEach(button => {
  button.addEventListener("click", () => {
    const role = button.dataset.role ?? "TanRid opportunity";
    const subject = `${role} application`;
    const body = `Hi TanRid team,\n\nI'm interested in the ${role} role. Please find my resume attached.\n\nThank you!`;
    window.location.href = buildMailLink("jobs@tanrid.com", subject, body);
  });
});

const downloadButton = document.querySelector<HTMLButtonElement>("[data-download='latest-brief']");
downloadButton?.addEventListener("click", () => {
  const content =
    "TanRid Insights Brief\n\nThanks for downloading the latest update. We'll send fresh tactics to your inbox shortly.";
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tanrid-insights-brief.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("Brief download started.");
});

const cookieBanner = document.getElementById("cookie-consent");
const cookieAccept = document.getElementById("cookie-accept");
const cookieManage = document.getElementById("cookie-manage");
const cookieDetails = document.getElementById("cookie-details");
const COOKIE_KEY = "tanrid-cookie-consent";

const hideCookieBanner = (): void => cookieBanner?.classList.remove("visible");

if (!localStorage.getItem(COOKIE_KEY)) {
  cookieBanner?.classList.add("visible");
}

cookieAccept?.addEventListener("click", () => {
  localStorage.setItem(COOKIE_KEY, "accepted");
  hideCookieBanner();
});

cookieManage?.addEventListener("click", () => {
  cookieBanner?.classList.toggle("show-details");
  if (cookieBanner?.classList.contains("show-details")) {
    cookieManage.textContent = "Hide details";
    cookieDetails?.setAttribute("aria-hidden", "false");
  } else {
    cookieManage.textContent = "Manage preferences";
    cookieDetails?.setAttribute("aria-hidden", "true");
  }
});
