# git plugin

[한국어](README.ko.md)

git plugin: shows in a sidebar section whether git is installed and whether the project folder is a git repository, and the branch of the repository, and runs the git install dialog and `git init` from its buttons. The plugin format is defined in the soksak core specification (`docs/spec/plugins.md`).

```sh
make install                                # once after cloning: install the locked dependencies
make test                                   # tests of this plugin
make check                                  # document checks and command name checks of the pinned kit release
make pack OUT=<folder>                      # the plugin release
make install-hooks                          # once after cloning: check commit messages and records at commit time
```

`make check` runs the document check and the command name check of the kit that `package.json` pins. The application validates `plugin.json` when it installs the release.

The checklist is [docs/features.md](docs/features.md).
