// Checks the states of the git section against the replies that the declared programs give (G1 in docs/features.md). The replies are
// the forms of runtime.program.run: {code, stdout, stderr, truncated} for a program that exits, and {error} for a run that failed.
import assert from "node:assert/strict";
import test from "node:test";
import { branchState, initState, installState, repositoryState, sectionView, versionState } from "../ui/git-state.js";

const exited = (code, stdout = "", stderr = "") => ({ code, stdout, stderr, truncated: { stdout: false, stderr: false } });

test("git --version prints the version when git runs", () => {
  assert.deepEqual(versionState(exited(0, "git version 2.45.1\n")), { state: "version", version: "git version 2.45.1" });
});

test("git --version is missing when the host finds no program git", () => {
  assert.deepEqual(versionState({ error: "program not found: git" }), { state: "missing" });
});

test("git --version is missing when the macOS shim reports the absent developer path", () => {
  const stderr = "xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun\n";
  assert.deepEqual(versionState(exited(2, "", stderr)), { state: "missing" });
});

test("git --version shows its failure with the exit status and the error output", () => {
  assert.deepEqual(versionState(exited(1, "", "fatal: boom\n")), { state: "failure", text: "git --version: exited with status 1: fatal: boom" });
});

test("git --version shows a run error with its text and not as missing", () => {
  assert.deepEqual(versionState({ error: "program git: start failed: permission denied" }),
    { state: "failure", text: "git --version: program git: start failed: permission denied" });
});

test("git --version refuses a reply that is not a git version line", () => {
  assert.deepEqual(versionState(exited(0, "hello\n")), { state: "failure", text: "git --version: unexpected reply: hello" });
});

test("rev-parse prints true inside a work tree", () => {
  assert.deepEqual(repositoryState(exited(0, "true\n")), { state: "inside" });
});

test("rev-parse outside a repository with status 128 is outside", () => {
  const stderr = "fatal: not a git repository (or any of the parent directories): .git\n";
  assert.deepEqual(repositoryState(exited(128, "", stderr)), { state: "outside" });
});

test("rev-parse printing false inside a git directory is a failure, so git init does not run", () => {
  assert.deepEqual(repositoryState(exited(0, "false\n")), {
    state: "failure",
    text: "git rev-parse --is-inside-work-tree: the project folder is inside a git directory, not a work tree",
  });
});

test("rev-parse with another status is a failure with its error output", () => {
  assert.deepEqual(repositoryState(exited(129, "", "error: unknown option\n")), {
    state: "failure",
    text: "git rev-parse --is-inside-work-tree: exited with status 129: error: unknown option",
  });
});

test("branch --show-current names the branch", () => {
  assert.deepEqual(branchState(exited(0, "main\n")), { state: "branch", branch: "main" });
});

test("branch --show-current with an empty name is a detached head", () => {
  assert.deepEqual(branchState(exited(0, "\n")), { state: "detached" });
});

test("branch --show-current shows a run error as a failure", () => {
  assert.deepEqual(branchState({ error: "program git: start failed: no such file" }),
    { state: "failure", text: "git branch --show-current: program git: start failed: no such file" });
});

test("git init with status 0 is initialized", () => {
  assert.deepEqual(initState(exited(0, "Initialized empty Git repository in /project/.git/\n")), { state: "initialized" });
});

test("git init with another status is a failure with its error output", () => {
  assert.deepEqual(initState(exited(1, "", "fatal: cannot mkdir\n")), {
    state: "failure",
    text: "git init: exited with status 1: fatal: cannot mkdir",
  });
});

test("xcode-select --install with status 0 is requested", () => {
  assert.deepEqual(installState(exited(0)), { state: "requested" });
});

test("xcode-select --install with another status is a failure", () => {
  assert.deepEqual(installState(exited(1, "", "xcode-select: error: command line tools are already installed\n")), {
    state: "failure",
    text: "xcode-select --install: exited with status 1: xcode-select: error: command line tools are already installed",
  });
});

test("a reply of another form is refused with the text of the rule", () => {
  assert.throws(() => versionState({ code: "0", stdout: "", stderr: "" }), /a program reply must be/);
  assert.throws(() => repositoryState(null), /a program reply must be/);
});

// The section shows one line and the buttons of its state; git init runs only from its button.
test("sectionView shows install and check while git is missing", () => {
  assert.deepEqual(sectionView({ git: "missing" }), {
    status: { git: "missing", version: null, repository: null, branch: null, error: null },
    text: "git이 설치되어 있지 않아요. 설치를 누르면 git이 든 명령줄 개발자 도구의 설치 창이 열려요. 설치가 끝나면 다시 확인을 눌러 주세요.",
    buttons: ["install", "check"],
  });
});

test("sectionView offers git init and check for a project folder outside a repository", () => {
  assert.deepEqual(sectionView({ git: "installed", version: "git version 2.50.1", repository: "outside" }), {
    status: { git: "installed", version: "git version 2.50.1", repository: "outside", branch: null, error: null },
    text: "git version 2.50.1 · 이 프로젝트 폴더는 git 저장소가 아니에요. git init을 누르면 이 폴더에 저장소를 만들어요.",
    buttons: ["init", "check"],
  });
});

test("sectionView names the branch inside a repository, and a detached HEAD without one", () => {
  assert.deepEqual(sectionView({ git: "installed", version: "git version 2.50.1", repository: "inside", branch: "main" }).text, "git version 2.50.1 · 브랜치: main");
  assert.deepEqual(sectionView({ git: "installed", version: "git version 2.50.1", repository: "inside", branch: null }).status,
    { git: "installed", version: "git version 2.50.1", repository: "inside", branch: null, error: null });
});

test("sectionView shows the text of a failed check with the check button, and refuses a check of another form", () => {
  assert.deepEqual(sectionView({ failure: "git --version: exited with status 2" }), {
    status: { git: null, version: null, repository: null, branch: null, error: "git --version: exited with status 2" },
    text: "git --version: exited with status 2",
    buttons: ["check"],
  });
  assert.throws(() => sectionView({ git: "installed" }), /^Error: a check must be a failure, git missing or git installed with its version$/);
  assert.throws(() => sectionView({ git: "installed", version: "git version 2", repository: "inside" }), /must name the repository outside, or inside with its branch$/);
});
