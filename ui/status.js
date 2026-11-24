// The git section (G1 in docs/features.md): checks git and the repository of the project when the section shows and when git.check runs,
// through the programs that plugin.json declares. The replies are read by the rules of git-state.js, and sectionView gives the line, the
// buttons and the value of the status git.state. The page is the error display of its errors: a failed check shows its text and is
// recorded through runtime.error at that moment. git init runs only from its button, so the section never writes the project folder
// by itself.
import { createExpose } from "@soksak/plugin-api";
import { createViewBridge } from "@soksak/plugin-api/view";
import { exposurePort } from "./exposure-port.js";
import { branchState, initState, installState, repositoryState, sectionView, versionState } from "./git-state.js";

const INSTALL = "git.install";
const INIT = "git.init";
const CHECK = "git.check";
const STATE = "git.state";
const WHERE = "git.status";

// Errors that occur before the bridge exists wait in losses and are written to the application log once it does.
const losses = [];
let reportError = (where, text) => losses.push([where, text]);
const bridge = createViewBridge({
  handler: window.webkit.messageHandlers["sok-view"],
  report: (event) => { if (event.kind !== "open-calls") reportError("view calls", JSON.stringify(event)); },
});
reportError = (where, text) => bridge.runtime.error(where, text);
for (const [where, text] of losses.splice(0)) reportError(where, text);

const start = window.sokSurface;
if (start === null || typeof start !== "object") throw new Error("the git section has no start values: window.sokSurface is missing");

const message = document.getElementById("message");
const buttons = { install: document.getElementById("install"), init: document.getElementById("init"), check: document.getElementById("check") };

const exposure = createExpose(exposurePort(bridge, WHERE, reportError), () => start.declarations);

// Runs a declared program with its arguments, which equal the literal slots of its declaration. A run that the host refuses or that ends with an error answers {error} with the text of that error, which the
// rules of git-state.js turn into a failure with that text.
async function run(name, args) {
  try {
    return await bridge.runtime.program.run(name, args);
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}

// The value of the status git.state and its watchers; it is null until the first check ends.
let state = null;
const watchers = new Set();

// Shows the view of a check and publishes its status. A failure is recorded at the moment the page shows it.
function show(check) {
  const view = sectionView(check);
  message.textContent = view.text;
  message.classList.toggle("error", view.status.error !== null);
  for (const [name, button] of Object.entries(buttons)) button.hidden = !view.buttons.includes(name);
  if (view.status.error !== null) reportError(WHERE, view.status.error);
  state = view.status;
  for (const watcher of watchers) watcher(state);
}

// Checks git and the project folder: git --version first, then git rev-parse --is-inside-work-tree, and inside a work tree git branch
// --show-current.
async function check() {
  const version = versionState(await run("git-version", ["--version"]));
  if (version.state === "failure") return { failure: version.text };
  if (version.state === "missing") return { git: "missing" };
  const repository = repositoryState(await run("git-inside-work-tree", ["rev-parse", "--is-inside-work-tree"]));
  if (repository.state === "failure") return { failure: repository.text };
  if (repository.state === "outside") return { git: "installed", version: version.version, repository: "outside" };
  const branch = branchState(await run("git-branch", ["branch", "--show-current"]));
  if (branch.state === "failure") return { failure: branch.text };
  return { git: "installed", version: version.version, repository: "inside", branch: branch.state === "detached" ? null : branch.branch };
}

// The command git.check: checks again and shows the result. A rule that refuses a reply shows its text as a failure.
async function checkAgain() {
  let result;
  try {
    result = await check();
  } catch (error) {
    result = { failure: `the git state could not be read: ${error?.message ?? error}` };
  }
  show(result);
  return null;
}

// The command git.init: runs git init in the project folder, then checks again. A failed run throws with its text.
async function initRepository() {
  const created = initState(await run("git-init", ["init"]));
  if (created.state === "failure") throw new Error(created.text);
  await checkAgain();
  return null;
}

// The command git.install: runs xcode-select --install through its declared program, which opens the system dialog that installs the
// command line developer tools. A failed run throws with its text.
async function installTools() {
  const requested = installState(await run("xcode-select-install", ["--install"]));
  if (requested.state === "failure") throw new Error(requested.text);
  return null;
}

// A command that a button runs and that fails shows its text as the failure of the section.
const failed = (error) => show({ failure: String(error?.message ?? error) });
await Promise.all([
  exposure.command(INSTALL, installTools), bridge.commands.register(INSTALL, installTools),
  exposure.command(INIT, initRepository), bridge.commands.register(INIT, initRepository),
  exposure.command(CHECK, checkAgain), bridge.commands.register(CHECK, checkAgain),
  exposure.status(STATE, () => state, (watcher) => { watchers.add(watcher); return () => watchers.delete(watcher); }),
  exposure.element("git.status.install", buttons.install),
  exposure.element("git.status.init", buttons.init),
  exposure.element("git.status.check", buttons.check),
]);
await Promise.all([
  exposure.bind(buttons.install, INSTALL, {}, { failed }),
  exposure.bind(buttons.init, INIT, {}, { failed }),
  exposure.bind(buttons.check, CHECK, {}, { failed }),
]);
await checkAgain();
