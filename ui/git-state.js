// The state of the git section (G1 in docs/features.md). Each function turns the reply of one declared program into the state that the
// section shows. A reply is {code, stdout, stderr, truncated} of runtime.program.run (core docs/spec/native-surfaces.md#program-runs),
// or {error} with the text of the error that the run raised. A reply of another form throws with the text of the rule.
//
// The states: version {version} or missing for git --version; outside or inside for git rev-parse --is-inside-work-tree; branch
// {branch} or detached for git branch --show-current; initialized for git init; requested for xcode-select --install. Each function
// answers {state: "failure", text} for a reply that shows an error, and the text names the program and the reason.

// The error that the host raises when the program git is not found through PATH (core docs/spec/native-surfaces.md#program-runs).
const GIT_NOT_FOUND = "program not found: git";
// The message of the git command shim of macOS when the command line developer tools are not installed; the shim exits with a status
// other than 0 and prints this line, so git is not installed.
const DEVELOPER_PATH_MISSING = /^xcrun: error: invalid active developer path/m;
// The message of git rev-parse outside a repository, with exit status 128.
const NOT_A_REPOSITORY = /not a git repository/;

// Throws with the text of the rule when the reply is neither an error nor the object of a program exit.
function replyOf(reply) {
  if (reply !== null && typeof reply === "object" && typeof reply.error === "string") return reply;
  const exited = reply !== null && typeof reply === "object" && (Number.isInteger(reply.code) || reply.code === null)
    && typeof reply.stdout === "string" && typeof reply.stderr === "string";
  if (!exited) throw new Error("a program reply must be {code, stdout, stderr, truncated} or {error}");
  return reply;
}

// The failure of a reply of a program that failed: the error text, or the exit status with the error output of the program.
function failure(where, reply) {
  if (typeof reply.error === "string") return { state: "failure", text: `${where}: ${reply.error}` };
  const status = reply.code === null ? "ended by a signal" : `exited with status ${reply.code}`;
  const output = reply.stderr.trim();
  return { state: "failure", text: output === "" ? `${where}: ${status}` : `${where}: ${status}: ${output}` };
}

/** The state of git --version: {state: "version", version} with the first line of the reply, missing, or a failure. */
export function versionState(reply) {
  const answer = replyOf(reply);
  if (answer.error === GIT_NOT_FOUND) return { state: "missing" };
  if (typeof answer.error === "string") return failure("git --version", answer);
  if (answer.code !== 0) return DEVELOPER_PATH_MISSING.test(answer.stderr) ? { state: "missing" } : failure("git --version", answer);
  const version = answer.stdout.trim();
  if (!/^git version \S+/.test(version)) return { state: "failure", text: `git --version: unexpected reply: ${version}` };
  return { state: "version", version };
}

/** The state of git rev-parse --is-inside-work-tree: inside, outside, or a failure. */
export function repositoryState(reply) {
  const answer = replyOf(reply);
  if (typeof answer.error === "string") return failure("git rev-parse --is-inside-work-tree", answer);
  if (answer.code === 0 && answer.stdout.trim() === "true") return { state: "inside" };
  // git prints false inside its own git directory, where git init must not run.
  if (answer.code === 0 && answer.stdout.trim() === "false") {
    return { state: "failure", text: "git rev-parse --is-inside-work-tree: the project folder is inside a git directory, not a work tree" };
  }
  if (answer.code === 128 && NOT_A_REPOSITORY.test(answer.stderr)) return { state: "outside" };
  return failure("git rev-parse --is-inside-work-tree", answer);
}

/** The state of git branch --show-current: {state: "branch", branch}, detached for an empty name, or a failure. */
export function branchState(reply) {
  const answer = replyOf(reply);
  if (answer.error !== undefined || answer.code !== 0) return failure("git branch --show-current", answer);
  const branch = answer.stdout.trim();
  return branch === "" ? { state: "detached" } : { state: "branch", branch };
}

/** The state of git init: initialized, or a failure. */
export function initState(reply) {
  const answer = replyOf(reply);
  if (answer.error !== undefined || answer.code !== 0) return failure("git init", answer);
  return { state: "initialized" };
}

/** The state of xcode-select --install: requested when the reply is an exit status 0, or a failure. */
export function installState(reply) {
  const answer = replyOf(reply);
  if (answer.error !== undefined || answer.code !== 0) return failure("xcode-select --install", answer);
  return { state: "requested" };
}

/**
 * The view of the section for the result of one check: {status, text, buttons}. check is {failure: text} for a check that failed,
 * {git: "missing"}, or {git: "installed", version, repository: "outside"} or {git: "installed", version, repository: "inside", branch},
 * where branch is null for a detached HEAD. status is the value of the status git.state; text is the line that the section shows; buttons
 * lists the buttons that the section shows, of install, init and check.
 */
export function sectionView(check) {
  if (typeof check?.failure === "string") {
    return { status: { git: null, version: null, repository: null, branch: null, error: check.failure }, text: check.failure, buttons: ["check"] };
  }
  if (check?.git === "missing") {
    return {
      status: { git: "missing", version: null, repository: null, branch: null, error: null },
      text: "git이 설치되어 있지 않아요. 설치를 누르면 git이 든 명령줄 개발자 도구의 설치 창이 열려요. 설치가 끝나면 다시 확인을 눌러 주세요.",
      buttons: ["install", "check"],
    };
  }
  if (check?.git !== "installed" || typeof check.version !== "string") throw new Error("a check must be a failure, git missing or git installed with its version");
  if (check.repository === "outside") {
    return {
      status: { git: "installed", version: check.version, repository: "outside", branch: null, error: null },
      text: `${check.version} · 이 프로젝트 폴더는 git 저장소가 아니에요. git init을 누르면 이 폴더에 저장소를 만들어요.`,
      buttons: ["init", "check"],
    };
  }
  if (check.repository !== "inside" || (check.branch !== null && typeof check.branch !== "string")) {
    throw new Error("a check of git installed must name the repository outside, or inside with its branch");
  }
  return {
    status: { git: "installed", version: check.version, repository: "inside", branch: check.branch, error: null },
    text: `${check.version} · ${check.branch === null ? "분리된 HEAD 상태예요." : `브랜치: ${check.branch}`}`,
    buttons: ["check"],
  };
}
