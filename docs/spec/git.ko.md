# Git section

[English](git.md)

Git plugin은 사이드바 section `git.status`에 git과 프로젝트 폴더의 상태를 보여 주고, 버튼으로 git 설치 창과 `git init`을 실행한다. Plugin 형식은 [plugins](https://github.com/soksak-app/core/blob/main/docs/spec/plugins.ko.md)가 정한다.

## 선언

- `sections`: `git.status`, 기본 너비의 사이드바에서 네 줄의 문구와 버튼이 들어가는 높이 160의 `ui/status.html` view section. Plugin은 sidebar set을 선언하지 않으며, 사람이 settings의 sidebar set으로 section을 놓는다.
- `programs`: `git-version`(`git --version`), `git-inside-work-tree`(`git rev-parse --is-inside-work-tree`), `git-init`(`git init`), `git-branch`(`git branch --show-current`), `xcode-select-install`(`xcode-select --install`). 각 program은 자기가 나열한 literal 인자만 받는다. surface 없이 sections를 가진 plugin은 section의 page에서 program을 실행하며([program 실행](https://github.com/soksak-app/core/blob/main/docs/spec/native-surfaces.ko.md#프로그램-실행)), 이는 core F1152가 제공한다.
- `exposes.commands`: `git.install`은 `xcode-select-install`을 실행한다. `git.init`은 `git-init`을 실행한 뒤 다시 확인한다. `git.check`는 다시 확인한다. 어느 것도 parameter를 받지 않는다.
- `exposes.status`: `git.state`, 마지막 확인 `{git, version, repository, branch, error}`. `git`은 `installed`, `missing`, 또는 확인 실패 뒤 null이다. `repository`는 `inside`, `outside`, 또는 null이다. `branch`는 분리된 HEAD에서 null이다. `error`는 실패한 확인의 문구다. 첫 확인이 끝나기 전 값은 null이다.
- `exposes.element`: 버튼 `git.status.install`, `git.status.init`, `git.status.check`, 각각 자기 command에 연결된다.

## 확인

Section은 보일 때와 `git.check`가 실행될 때 이 순서로 확인하고, 이어 갈 수 없는 첫 상태에서 멈춘다.

1. `git-version`. program `git`을 찾지 못한 실행이나, macOS command shim이 `xcrun: error: invalid active developer path`를 알린 실행은 `missing` 상태다. 다른 실패는 확인 실패다.
2. 프로젝트 폴더에서 `git-inside-work-tree`. 출력 `true`는 `inside`이고, `not a git repository`와 함께 끝난 exit status 128은 `outside`다. git이 자기 git directory 안에서 출력하는 `false`는 확인 실패다.
3. `inside`이면 `git-branch`가 branch를 말한다. 빈 이름은 분리된 HEAD다.

## 보기

Section은 상태마다 한 줄과 버튼을 보인다.

| 상태 | 줄 | 버튼 |
| --- | --- | --- |
| `missing` | git이 설치되어 있지 않고, 설치는 git이 든 명령줄 개발자 도구의 설치 창을 열며, 설치 뒤 다시 확인을 누른다 | 설치, 다시 확인 |
| `outside` | git version과, 프로젝트 폴더가 git 저장소가 아니며 `git init`이 저장소를 만든다는 것 | git init, 다시 확인 |
| `inside` | git version과 branch, 또는 분리된 HEAD | 다시 확인 |
| 확인 실패 | 실패 문구 | 다시 확인 |

`git init`은 버튼으로만 실행되므로 section은 프로젝트 폴더에 스스로 쓰지 않는다.

## 실패

Page는 자기 오류의 error display다. 실패한 확인이나 실패한 버튼 command는 그 문구를 section의 error 색으로 보이고, 그 순간 `runtime.error`로 기록되어 application log에 `error workbench surface <surface> git.status: <text>`를 쓴다. 문구는 program과 이유, 곧 실행의 오류나 exit status와 program의 error 출력을 말한다. 다른 형식의 응답은 규칙 문구로 거부한다.

## 범위

Section은 보일 때와 `git.check`가 실행될 때 확인한다. git 설치나 프로젝트 폴더의 변화를 section에 알리는 event가 없으므로 polling하지 않는다. git 설정은 바꾸지 않는다.
