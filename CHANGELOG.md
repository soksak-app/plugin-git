# Changelog

[한국어](CHANGELOG.ko.md)

- G3: The page `status.html` take the text, line and error colors from the theme tokens `--fg`, `--edge` and `--fail` instead of a palette of the system color scheme, so a dark window draws them light on its dark card.
- G2: The workflows `ci.yml` and `release.yml` test, check and release the plugin; the version is 0.0.1.
- G1: The repository has the git section `git.status`, the programs of git and xcode-select, the commands `git.install`, `git.init` and `git.check`, the status `git.state`, the three buttons of the section and the state rules of `ui/git-state.js`, with tests in `test/git-state.test.mjs` and `test/manifest-shape.test.mjs`. `git init` runs only from its button. The plugin requires core 0.0.53 (F1152).
