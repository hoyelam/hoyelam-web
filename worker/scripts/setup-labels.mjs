import { feedbackProjects } from "../../feedback/projects.js";
import { githubHeaders } from "../src/core.js";

const labels = [
  {
    name: "feedback",
    color: "1d76db",
    description: "Submitted through the product feedback form",
  },
  {
    name: "public",
    color: "0e8a16",
    description: "Safe to display on the public roadmap",
  },
  {
    name: "type:bug",
    color: "d73a4a",
    description: "Something is not working",
  },
  {
    name: "type:idea",
    color: "a2eeef",
    description: "A product or feature suggestion",
  },
  { name: "status:review", color: "ededed", description: "Under review" },
  { name: "status:planned", color: "fbca04", description: "Planned work" },
  {
    name: "status:in-progress",
    color: "0052cc",
    description: "Currently being worked on",
  },
  {
    name: "status:released",
    color: "0e8a16",
    description: "Released to users",
  },
];

async function saveLabel(project, token, label) {
  const base = `https://api.github.com/repos/${project.repository}/labels`;
  const headers = githubHeaders(token);
  const body = JSON.stringify(label);
  const created = await fetch(base, { method: "POST", headers, body });
  if (created.status === 201) return "created";
  if (created.status !== 422)
    throw new Error(
      `${project.repository}: ${label.name} returned ${created.status}`,
    );

  const updated = await fetch(`${base}/${encodeURIComponent(label.name)}`, {
    method: "PATCH",
    headers,
    body,
  });
  if (!updated.ok)
    throw new Error(
      `${project.repository}: ${label.name} returned ${updated.status}`,
    );
  return "updated";
}

let failed = false;

for (const project of feedbackProjects) {
  const token = process.env[project.tokenBinding];
  if (!token) {
    console.error(`${project.repository}: missing ${project.tokenBinding}`);
    failed = true;
    continue;
  }

  for (const label of labels) {
    try {
      const result = await saveLabel(project, token, label);
      console.log(`${project.repository}: ${result} ${label.name}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      failed = true;
    }
  }
}

if (failed) process.exitCode = 1;
