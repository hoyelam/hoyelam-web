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

const root = document.querySelector<HTMLElement>("[data-feedback-root]");

if (root) {
  const form = root.querySelector<HTMLFormElement>("[data-feedback-form]");
  const projectSelect = root.querySelector<HTMLSelectElement>(
    "[data-project-select]",
  );
  const typeSelect =
    root.querySelector<HTMLSelectElement>("[data-type-select]");
  const roadmapFilter = root.querySelector<HTMLSelectElement>(
    "[data-roadmap-filter]",
  );
  const formTitle = root.querySelector<HTMLElement>(
    "[data-feedback-form-title]",
  );
  const formStatus = root.querySelector<HTMLElement>("[data-form-status]");
  const submitButton = root.querySelector<HTMLButtonElement>(
    "[data-submit-button]",
  );
  const board = root.querySelector<HTMLElement>("[data-feedback-board]");
  const boardState = root.querySelector<HTMLElement>("[data-board-state]");
  const contextDetails = root.querySelector<HTMLDetailsElement>(
    "[data-context-details]",
  );
  const apiUrl = (root.dataset.apiUrl || "").replace(/\/$/, "");
  const turnstileConfigured = root.dataset.turnstileConfigured === "true";
  let tickets: FeedbackTicket[] = [];

  const input = (name: string) =>
    form?.elements.namedItem(name) as HTMLInputElement | null;

  const projectOptions = projectSelect
    ? Array.from(projectSelect.options).map((option) => ({
        id: option.value,
        name: option.textContent?.trim() || option.value,
        aliases: (option.dataset.aliases || "").split(",").filter(Boolean),
      }))
    : [];

  const resolveProject = (value: string | null) => {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    return projectOptions.find(
      (project) =>
        project.id === normalized || project.aliases.includes(normalized),
    );
  };

  const selectedProject = () =>
    projectOptions.find((project) => project.id === projectSelect?.value);

  const updateFormTitle = () => {
    const project = selectedProject();
    if (formTitle && project)
      formTitle.textContent = `Feedback for ${project.name}`;
  };

  const updateProjectQuery = () => {
    if (!projectSelect) return;
    const url = new URL(window.location.href);
    url.searchParams.set("project", projectSelect.value);
    window.history.replaceState(null, "", url);
  };

  const applyDeepLink = () => {
    const params = new URLSearchParams(window.location.search);
    const project = resolveProject(params.get("project"));
    if (projectSelect && project) {
      projectSelect.value = project.id;
      if (roadmapFilter) roadmapFilter.value = project.id;
    }

    const requestedType = params.get("type")?.toLowerCase();
    if (typeSelect) {
      if (
        requestedType === "idea" ||
        requestedType === "feature" ||
        requestedType === "request"
      ) {
        typeSelect.value = "idea";
      } else if (requestedType === "bug") {
        typeSelect.value = "bug";
      }
    }

    const values = {
      source: params.get("source"),
      appVersion: params.get("app_version") || params.get("appVersion"),
      osVersion: params.get("os_version") || params.get("osVersion"),
      title: params.get("title"),
    };

    Object.entries(values).forEach(([name, value]) => {
      const field = input(name);
      if (field && value)
        field.value = value.slice(
          0,
          Number(field.maxLength) > 0 ? field.maxLength : 100,
        );
    });

    if ((values.appVersion || values.osVersion) && contextDetails)
      contextDetails.open = true;
    if (params.get("lock_project") === "1" && projectSelect && project) {
      projectSelect.disabled = true;
      projectSelect.dataset.locked = "true";
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
    if (!board) return;
    const filter = roadmapFilter?.value || "all";
    const visibleTickets =
      filter === "all"
        ? tickets
        : tickets.filter((ticket) => ticket.project === filter);

    board
      .querySelectorAll<HTMLElement>("[data-status-column]")
      .forEach((column) => {
        const list = column.querySelector<HTMLElement>("[data-ticket-list]");
        const count = column.querySelector<HTMLElement>("[data-status-count]");
        if (!list) return;
        list.replaceChildren();
        const columnTickets = visibleTickets.filter(
          (ticket) => ticket.status === column.dataset.statusColumn,
        );
        if (count) count.textContent = String(columnTickets.length);

        if (columnTickets.length === 0) {
          const empty = document.createElement("p");
          empty.className = "feedback-column-empty";
          empty.textContent = "No public tickets";
          list.append(empty);
        } else {
          list.append(...columnTickets.map(ticketCard));
        }
      });
  };

  const loadTickets = async () => {
    if (!board || !boardState) return;
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
      const unavailable = payload.unavailableProjects?.length || 0;
      boardState.textContent = unavailable
        ? `Loaded ${tickets.length} public tickets. ${unavailable} product source is temporarily unavailable.`
        : tickets.length
          ? `${tickets.length} public ${tickets.length === 1 ? "ticket" : "tickets"}.`
          : "No public tickets yet.";
    } catch {
      boardState.textContent =
        "Public tickets could not be loaded. Try again later.";
      renderBoard();
    } finally {
      board.setAttribute("aria-busy", "false");
    }
  };

  projectSelect?.addEventListener("change", () => {
    updateFormTitle();
    updateProjectQuery();
    if (roadmapFilter) {
      roadmapFilter.value = projectSelect.value;
      renderBoard();
    }
  });

  roadmapFilter?.addEventListener("change", renderBoard);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity() || !formStatus || !submitButton) return;

    if (!apiUrl || !turnstileConfigured) {
      formStatus.dataset.kind = "error";
      formStatus.textContent = "Feedback submission is not connected yet.";
      return;
    }

    const turnstileToken = input("cf-turnstile-response")?.value || "";
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
      project: projectSelect?.value,
      type: typeSelect?.value,
      title: input("title")?.value,
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement | null
      )?.value,
      email: input("email")?.value,
      appVersion: input("appVersion")?.value,
      osVersion: input("osVersion")?.value,
      source: input("source")?.value,
      website: input("website")?.value,
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
      if (!response.ok)
        throw new Error(result.error || "Ticket creation failed.");

      input("title")!.value = "";
      (form.elements.namedItem("description") as HTMLTextAreaElement).value =
        "";
      input("email")!.value = "";
      formStatus.dataset.kind = "success";
      formStatus.textContent = result.reference
        ? `Submitted for review. Reference: ${result.reference}.`
        : "Submitted for review.";
      (window as TurnstileWindow).turnstile?.reset();
    } catch (error) {
      formStatus.dataset.kind = "error";
      formStatus.textContent =
        error instanceof Error
          ? error.message
          : "Ticket creation failed. Try again.";
      (window as TurnstileWindow).turnstile?.reset();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit feedback";
    }
  });

  applyDeepLink();
  renderBoard();
  void loadTickets();
}
