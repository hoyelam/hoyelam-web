type FeedbackTicket = {
  id: string;
  number: number;
  project: string;
  projectName: string;
  type: "bug" | "idea";
  status: "review" | "planned" | "in-progress" | "released";
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type TicketsResponse = {
  tickets: FeedbackTicket[];
  unavailableProjects?: string[];
};

type TurnstileWindow = Window & {
  turnstile?: { reset: () => void };
};

function required<T extends Element>(parent: ParentNode, selector: string) {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error(`Feedback page is missing ${selector}`);
  return element;
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

const root = required<HTMLElement>(document, "[data-feedback-root]");
const form = required<HTMLFormElement>(root, "[data-feedback-form]");
const projectSelect = required<HTMLSelectElement>(root, "[data-project-select]");
const typeSelect = required<HTMLSelectElement>(root, "[data-type-select]");
const roadmapFilter = required<HTMLSelectElement>(root, "[data-roadmap-filter]");
const formTitle = required<HTMLElement>(root, "[data-feedback-form-title]");
const formStatus = required<HTMLElement>(root, "[data-form-status]");
const submitButton = required<HTMLButtonElement>(root, "[data-submit-button]");
const board = required<HTMLElement>(root, "[data-feedback-board]");
const boardState = required<HTMLElement>(root, "[data-board-state]");
const contextDetails = required<HTMLDetailsElement>(root, "[data-context-details]");
const apiUrl = (root.dataset.apiUrl ?? "").replace(/\/$/, "");
const turnstileConfigured = root.dataset.turnstileConfigured === "true";
let tickets: FeedbackTicket[] = [];

const field = (name: string) =>
  form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;

const resetTurnstile = () => (window as TurnstileWindow).turnstile?.reset();

const projectOptions = Array.from(projectSelect.options).map((option) => ({
  id: option.value,
  name: option.textContent?.trim() || option.value,
  aliases: (option.dataset.aliases ?? "").split(",").filter(Boolean),
}));

const resolveProject = (value: string | null) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return projectOptions.find(
    (project) =>
      project.id === normalized || project.aliases.includes(normalized),
  );
};

const updateFormTitle = () => {
  const project = projectOptions.find(({ id }) => id === projectSelect.value);
  if (project) formTitle.textContent = `Feedback for ${project.name}`;
};

const updateProjectQuery = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectSelect.value);
  window.history.replaceState(null, "", url);
};

const applyDeepLink = () => {
  const params = new URLSearchParams(window.location.search);
  const project = resolveProject(params.get("project"));
  if (project) {
    projectSelect.value = project.id;
    roadmapFilter.value = project.id;
  }

  const requestedType = params.get("type")?.toLowerCase();
  if (
    requestedType === "idea" ||
    requestedType === "feature" ||
    requestedType === "request"
  ) {
    typeSelect.value = "idea";
  } else if (requestedType === "bug") {
    typeSelect.value = "bug";
  }

  const values = {
    source: params.get("source"),
    appVersion: params.get("app_version") || params.get("appVersion"),
    osVersion: params.get("os_version") || params.get("osVersion"),
    title: params.get("title"),
  };

  Object.entries(values).forEach(([name, value]) => {
    if (!value) return;
    const input = field(name);
    input.value = value.slice(0, input.maxLength > 0 ? input.maxLength : 100);
  });

  if (values.appVersion || values.osVersion) contextDetails.open = true;
  if (params.get("lock_project") === "1" && project) {
    projectSelect.disabled = true;
  }
  updateFormTitle();
};

const ticketCard = (ticket: FeedbackTicket) => {
  const article = document.createElement("article");
  article.className = "feedback-ticket";

  const meta = document.createElement("p");
  meta.className = "feedback-ticket-meta";
  meta.textContent = `${ticket.projectName} · ${ticket.type === "bug" ? "Bug" : "Idea"}`;

  const title = document.createElement("h4");
  title.textContent = ticket.title;

  article.append(meta, title);

  if (ticket.description) {
    const description = document.createElement("p");
    description.className = "feedback-ticket-description";
    description.textContent = ticket.description;
    article.append(description);
  }

  const updated = document.createElement("time");
  updated.className = "feedback-ticket-updated";
  updated.dateTime = ticket.updatedAt;
  updated.textContent = `Updated ${new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ticket.updatedAt))}`;
  article.append(updated);

  return article;
};

const renderBoard = () => {
  const filter = roadmapFilter.value;
  const visibleTickets =
    filter === "all"
      ? tickets
      : tickets.filter((ticket) => ticket.project === filter);

  board
    .querySelectorAll<HTMLElement>("[data-status-column]")
    .forEach((column) => {
      const list = required<HTMLElement>(column, "[data-ticket-list]");
      const count = required<HTMLElement>(column, "[data-status-count]");
      const columnTickets = visibleTickets.filter(
        (ticket) => ticket.status === column.dataset.statusColumn,
      );
      count.textContent = String(columnTickets.length);

      if (columnTickets.length === 0) {
        const empty = document.createElement("p");
        empty.className = "feedback-column-empty";
        empty.textContent = "No public tickets";
        list.replaceChildren(empty);
      } else {
        list.replaceChildren(...columnTickets.map(ticketCard));
      }
    });
};

const loadTickets = async () => {
  if (!apiUrl) {
    board.setAttribute("aria-busy", "false");
    boardState.textContent =
      "The public roadmap will appear after the feedback service is connected.";
    renderBoard();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/v1/tickets`, {
      headers: { Accept: "application/json" },
    });
    const payload = (await response.json()) as TicketsResponse & {
      error?: string;
    };
    if (!response.ok || !Array.isArray(payload.tickets)) {
      throw new Error(payload.error || "Could not load public tickets.");
    }
    tickets = payload.tickets;
    renderBoard();
    const unavailable = payload.unavailableProjects?.length ?? 0;
    const loaded = `${plural(tickets.length, "public ticket")}.`;
    boardState.textContent = unavailable
      ? `${loaded} ${plural(unavailable, "product")} ${unavailable === 1 ? "is" : "are"} temporarily unavailable.`
      : tickets.length
        ? loaded
        : "No public tickets yet.";
  } catch {
    boardState.textContent =
      "Public tickets could not be loaded. Try again later.";
    renderBoard();
  } finally {
    board.setAttribute("aria-busy", "false");
  }
};

projectSelect.addEventListener("change", () => {
  updateFormTitle();
  updateProjectQuery();
  roadmapFilter.value = projectSelect.value;
  renderBoard();
});

roadmapFilter.addEventListener("change", renderBoard);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  if (!apiUrl || !turnstileConfigured) {
    formStatus.dataset.kind = "error";
    formStatus.textContent = "Feedback submission is not connected yet.";
    return;
  }

  const turnstileToken =
    (form.elements.namedItem("cf-turnstile-response") as HTMLInputElement | null)
      ?.value ?? "";
  if (!turnstileToken) {
    formStatus.dataset.kind = "error";
    formStatus.textContent = "Complete the spam check and try again.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  formStatus.dataset.kind = "loading";
  formStatus.textContent = "Creating a private ticket…";

  const payload = {
    project: projectSelect.value,
    type: typeSelect.value,
    title: field("title").value,
    description: field("description").value,
    email: field("email").value,
    appVersion: field("appVersion").value,
    osVersion: field("osVersion").value,
    source: field("source").value,
    website: field("website").value,
    turnstileToken,
  };

  try {
    const response = await fetch(`${apiUrl}/v1/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as {
      error?: string;
      reference?: string;
    };
    if (!response.ok) throw new Error(result.error || "Ticket creation failed.");

    field("title").value = "";
    field("description").value = "";
    field("email").value = "";
    formStatus.dataset.kind = "success";
    formStatus.textContent = result.reference
      ? `Submitted for review. Reference: ${result.reference}.`
      : "Submitted for review.";
  } catch (error) {
    formStatus.dataset.kind = "error";
    formStatus.textContent =
      error instanceof Error ? error.message : "Ticket creation failed. Try again.";
  } finally {
    resetTurnstile();
    submitButton.disabled = false;
    submitButton.textContent = "Submit feedback";
  }
});

applyDeepLink();
void loadTickets();
