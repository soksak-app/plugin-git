// Checks the declarations of plugin.json and package.json, and the files that they name, with literal expectations.
// The application validates plugin.json at installation; this test checks the declaration against the manifest rules of
// core docs/spec/plugins.md (plugin.json table, sections, programs and exposes) without reading core.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));
const manifest = JSON.parse(read("plugin.json"));
const pkg = JSON.parse(read("package.json"));

// The members that the manifest of this plugin declares. A member that core lists later is added here with its test.
// The plugin declares no sidebar set: a person places the section through the sidebar sets of the settings.
const DECLARED_MEMBERS = ["id", "name", "description", "sections", "programs", "exposes"];

test("plugin.json declares only the members of this plugin", () => {
  assert.deepEqual(Object.keys(manifest).sort(), [...DECLARED_MEMBERS].sort());
});

test("plugin.json declares the identifier git and a description of one to two hundred characters", () => {
  assert.equal(manifest.id, "git");
  assert.match(manifest.id, /^[a-z][a-z0-9-]*$/);
  assert.equal(manifest.name, "git");
  assert.ok(manifest.description.length >= 1 && manifest.description.length <= 200, "description length is outside 1 to 200");
});

test("plugin.json declares the git status section as a view section of fixed height", () => {
  assert.deepEqual(manifest.sections, [
    {
      id: "git.status",
      name: "git",
      composition: { kind: "view", page: "ui/status.html" },
      height: 160,
    },
  ]);
});

test("every section id starts with the plugin id and is unique, and every height is fill or a positive integer", () => {
  const ids = manifest.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "a section id repeats");
  for (const section of manifest.sections) {
    assert.ok(section.id.startsWith(`${manifest.id}.`), `${section.id} does not start with ${manifest.id}.`);
    assert.ok(section.height === "fill" || (Number.isInteger(section.height) && section.height > 0), `${section.id} height`);
    for (const refused of ["status", "module", "fill"]) assert.equal(section[refused], undefined, `${section.id} declares ${refused}`);
  }
});

// A view page begins with a doctype and holds no import map (core docs/spec/plugin-processes.md, rule 4); the host inserts the map.
test("each section page of plugin.json exists, begins with a doctype and holds no import map", () => {
  for (const section of manifest.sections) {
    const page = section.composition.page;
    assert.ok(exists(page), `${page} does not exist`);
    assert.match(read(page), /^<!doctype html>/i, `${page} has no doctype at its start`);
    assert.doesNotMatch(read(page), /<script\b[^>]*\btype\s*=\s*["']?importmap\b/i, `${page} holds an import map`);
  }
});

test("programs declare the five git and xcode-select runs, each with literal argument slots", () => {
  assert.deepEqual(manifest.programs, {
    "git-version": { program: "git", args: ["--version"] },
    "git-inside-work-tree": { program: "git", args: ["rev-parse", "--is-inside-work-tree"] },
    "git-init": { program: "git", args: ["init"] },
    "git-branch": { program: "git", args: ["branch", "--show-current"] },
    "xcode-select-install": { program: "xcode-select", args: ["--install"] },
  });
  for (const [name, entry] of Object.entries(manifest.programs)) {
    assert.match(name, /^[a-z][a-z0-9-]*$/, `program name ${name}`);
    assert.ok(entry.args.length <= 16, `program ${name} has more than 16 slots`);
    for (const slot of entry.args) assert.equal(typeof slot, "string", `program ${name} has a slot that is not a text`);
  }
});

test("exposes declares the commands install, init and check without parameters, the status git.state and the three buttons", () => {
  assert.deepEqual(Object.keys(manifest.exposes).sort(), ["commands", "element", "status"]);
  assert.deepEqual(manifest.exposes.commands.map((command) => command.name), ["git.install", "git.init", "git.check"]);
  for (const command of manifest.exposes.commands) {
    assert.deepEqual(command.params, { type: "object", properties: {} }, `${command.name} params`);
    assert.deepEqual(command.result, { type: "null" }, `${command.name} result`);
    assert.ok(command.description.length >= 1 && command.description.length <= 1000, `${command.name} description length`);
  }
  assert.deepEqual(manifest.exposes.status.map((status) => status.name), ["git.state"]);
  assert.deepEqual(manifest.exposes.status[0].schema.required, ["git", "version", "repository", "branch", "error"]);
  assert.deepEqual(manifest.exposes.element.map((element) => element.name), ["git.status.install", "git.status.init", "git.status.check"]);
});

test("package.json names the plugin, its repository and the engine range of core 0.0.53", () => {
  assert.equal(pkg.name, "@soksak/plugin-git");
  assert.equal(pkg.version, "0.0.0");
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, "module");
  assert.equal(pkg.repository.url, "git+https://github.com/soksak-app/plugin-git.git");
  assert.deepEqual(pkg.engines, { soksak: "^0.0.53" });
  assert.deepEqual(pkg.files, ["plugin.json", "ui"]);
  assert.equal(pkg.scripts.test, "node --test --test-timeout=120000 test/");
});
