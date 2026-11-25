# Changelog

[English](CHANGELOG.md)

- G3: `status.html` page가 system color scheme의 palette 대신 theme token `--fg`, `--edge`, `--fail`에서 글자, 선, 오류 색을 써서, dark window의 어두운 card 위에 밝게 그려진다.
- G2: Workflow `ci.yml`과 `release.yml`이 plugin을 test, 검사, release해요. version은 0.0.1이에요.
- G1: 저장소에 git section `git.status`, git과 xcode-select의 programs, command `git.install`, `git.init`, `git.check`, status `git.state`, section의 세 버튼, `ui/git-state.js`의 상태 규칙과 `test/git-state.test.mjs`, `test/manifest-shape.test.mjs`의 test가 있다. `git init`은 버튼으로만 실행된다. Plugin은 core 0.0.53(F1152)이 필요하다.
