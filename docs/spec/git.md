# Git section

[한국어](git.ko.md)

The git plugin shows the state of git and of the project folder in the sidebar section `git.status`, and runs the git install dialog and `git init` from its buttons. The plugin format is defined in [plugins](https://github.com/soksak-app/core/blob/main/docs/spec/plugins.md).

## Declarations

- `sections`: `git.status`, a view section of `ui/status.html` with height 160, which holds four lines of the message and the buttons in a sidebar of the default width. The plugin declares no sidebar set; a person places the section through the sidebar sets of the settings.
- `programs`: `git-version` (`git --version`), `git-inside-work-tree` (`git rev-parse --is-inside-work-tree`), `git-init` (`git init`), `git-branch` (`git branch --show-current`) and `xcode-select-install` (`xcode-select --install`). Each program takes only the literal arguments that it lists. A plugin with sections and no surface runs its programs from the page of a section ([program runs](https://github.com/soksak-app/core/blob/main/docs/spec/native-surfaces.md#program-runs)), which core F1152 provides.
- `exposes.commands`: `git.install` runs `xcode-select-install`; `git.init` runs `git-init`, then checks again; `git.check` checks again. None takes a parameter.
- `exposes.status`: `git.state`, the last check `{git, version, repository, branch, error}`: `git` is `installed`, `missing` or null after a failed check; `repository` is `inside`, `outside` or null; `branch` is null for a detached HEAD; `error` is the text of a failed check. The value is null before the first check ends.
- `exposes.element`: the buttons `git.status.install`, `git.status.init` and `git.status.check`, each bound to its command.

## Checks

The section checks when it shows and when `git.check` runs, in this order, and stops at the first state that it cannot continue from:

1. `git-version`. A run whose program `git` is not found, or whose macOS command shim reports `xcrun: error: invalid active developer path`, is the state `missing`. Any other failure is a failed check.
2. `git-inside-work-tree` in the project folder. Output `true` is `inside`; exit status 128 with `not a git repository` is `outside`. Output `false`, which git prints inside its own git directory, is a failed check.
3. For `inside`, `git-branch` names the branch. An empty name is a detached HEAD.

## View

The section shows one line and the buttons of the state:

| State | Line | Buttons |
| --- | --- | --- |
| `missing` | git is not installed; 설치 opens the install dialog of the command line developer tools, which provide git; 다시 확인 checks after the installation | 설치, 다시 확인 |
| `outside` | the git version, and that the project folder is not a git repository and that `git init` creates one | git init, 다시 확인 |
| `inside` | the git version and the branch, or that the HEAD is detached | 다시 확인 |
| failed check | the text of the failure | 다시 확인 |

`git init` runs only from its button, so the section never writes the project folder by itself.

## Failures

The page is the error display of its errors: a failed check, or a command of a button that fails, shows its text in the error color of the section and is recorded through `runtime.error` at that moment, which writes `error workbench surface <surface> git.status: <text>` to the application log. The text names the program and the reason: the error of the run, or the exit status with the error output of the program. A reply of another form is refused with the text of the rule.

## Scope

The section checks when it shows and when `git.check` runs; it does not poll, because no event reports an installation of git or a change of the project folder to the section. It does not change git configuration.
