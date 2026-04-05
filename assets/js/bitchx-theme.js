document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const commandInput = document.getElementById("command-input");
  const desktopGate = document.getElementById("desktop-gate");
  const baseUrl = document.body.dataset.baseurl || "";
  const githubUrl = document.body.dataset.githubUrl || "";
  const staticStartupBanner = [
    "   ░██    ░██         ░██████                ░████                                               ░██ ░██████",
    "   ░██    ░██        ░██   ░██              ░██ ░██                                                 ░██   ░██",
    "░████████ ░████████        ░██             ░██ ░████  ░███████   ░███████  ░██    ░██ ░████████  ░██      ░██ ░██░████",
    "   ░██    ░██    ░██   ░█████              ░██░██░██ ░██    ░██ ░██    ░██ ░██    ░██ ░██    ░██ ░██  ░█████  ░███",
    "   ░██    ░██    ░██       ░██             ░████ ░██ ░██        ░██        ░██    ░██ ░██    ░██ ░██      ░██ ░██",
    "   ░██    ░██    ░██ ░██   ░██              ░██ ░██  ░██    ░██ ░██    ░██ ░██   ░███ ░███   ░██ ░██░██   ░██ ░██",
    "    ░████ ░██    ░██  ░██████  ░██████████   ░████    ░███████   ░███████   ░█████░██ ░██░█████  ░██ ░██████  ░██",
    "                                                                                      ░██",
    "                                                                                      ░██"
  ].join("\n");

  const channelRoutes = {
    blog: "/",
    exploit: "/exploit/",
    about: "/about/",
    projects: "/projects/",
    github: "__github__"
  };

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildAnsiGraffiti() {
    return staticStartupBanner;
  }

  function renderStartupGraffiti() {
    const graffitiHost = document.getElementById("startup-graffiti");
    if (!graffitiHost) {
      return;
    }
    const graffiti = buildAnsiGraffiti();
    graffitiHost.innerHTML = `<span class="timestamp">00:00</span> <pre class="ansi-graffiti"></pre>`;
    const pre = graffitiHost.querySelector(".ansi-graffiti");
    if (pre) {
      pre.textContent = graffiti;
    }
  }
  renderStartupGraffiti();

  const lines = document.querySelectorAll(".chat-line.replay");
  if (chatLog) {
    chatLog.scrollTop = 0;
  }
  lines.forEach((line, index) => {
    const delay = 130 * index;
    window.setTimeout(() => {
      line.classList.add("visible");
    }, delay);
  });

  if (!commandInput || !chatLog) {
    return;
  }

  commandInput.focus({ preventScroll: true });

  function nowStamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function addCommandLine(text, type) {
    const p = document.createElement("p");
    p.className = `chat-line visible ${type || ""}`.trim();
    p.innerHTML = `<span class="timestamp">${nowStamp()}</span> ${text}`;
    chatLog.appendChild(p);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function evaluateDesktopGate() {
    if (!desktopGate) {
      return;
    }

    const isSmallViewport = window.matchMedia("(max-width: 960px)").matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const forceGate = isSmallViewport || isCoarsePointer;

    desktopGate.classList.toggle("active", forceGate);
    desktopGate.setAttribute("aria-hidden", forceGate ? "false" : "true");
    document.body.style.overflow = forceGate ? "hidden" : "";
  }

  evaluateDesktopGate();
  window.addEventListener("resize", evaluateDesktopGate);

  function joinChannel(rawName) {
    const clean = (rawName || "").replace(/^#/, "").toLowerCase();
    if (!channelRoutes[clean]) {
      addCommandLine("<span class='ansi ansi-red'>-!-</span> Unknown channel.", "cmd-system");
      return;
    }
    const target = clean === "github" ? githubUrl : `${baseUrl}${channelRoutes[clean]}`;
    addCommandLine(`<span class='ansi ansi-cyan'>-!-</span> Joining #${clean} ...`, "cmd-system");
    window.setTimeout(() => {
      window.location.href = target;
    }, 180);
  }

  commandInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const raw = commandInput.value.trim();
    if (!raw) {
      return;
    }

    addCommandLine(`&lt;you&gt; ${escapeHtml(raw)}`, "cmd-user");

    const parts = raw.split(/\s+/);
    const verb = parts[0].toLowerCase();

    if (verb === "/help" || verb === "help") {
      addCommandLine("Commands: /help, /join #blog|#exploit|#about|#projects|#github, /msg &lt;nick&gt; &lt;text&gt;, blog, exploit, about, projects, github", "cmd-system");
      commandInput.value = "";
      return;
    }

    if (verb === "/join") {
      joinChannel(parts[1] || "");
      commandInput.value = "";
      return;
    }

    if (verb === "/msg") {
      const nick = parts[1];
      const message = parts.slice(2).join(" ");
      if (!nick || !message) {
        addCommandLine("<span class='ansi ansi-red'>-!-</span> Usage: /msg &lt;nick&gt; &lt;text&gt;", "cmd-system");
      } else {
        addCommandLine(`-&gt; *msg* to ${escapeHtml(nick)}: ${escapeHtml(message)}`, "cmd-system");
      }
      commandInput.value = "";
      return;
    }

    if (verb === "/tag") {
      addCommandLine("<span class='ansi ansi-yellow'>-!-</span> /tag is disabled in static-banner mode.", "cmd-system");
      commandInput.value = "";
      return;
    }

    if (channelRoutes[verb]) {
      joinChannel(verb);
      commandInput.value = "";
      return;
    }

    addCommandLine("<span class='ansi ansi-red'>-!-</span> Unknown command. Type /help.", "cmd-system");
    commandInput.value = "";
  });
});
