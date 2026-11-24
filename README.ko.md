# git plugin

[English](README.md)

git plugin: 사이드바 section에 git 설치 여부, 프로젝트 폴더가 git 저장소인지와 저장소의 branch를 보여 주고, 버튼으로 git 설치 창과 `git init`을 실행한다. Plugin 형식은 soksak core spec(`docs/spec/plugins.md`)이 정한다.

```sh
make install                                # clone 후 한 번: 고정된 dependency를 설치한다
make test                                   # 이 plugin의 test
make check                                  # 고정된 kit release의 document 검사와 command 이름 검사
make pack OUT=<folder>                      # plugin release
make install-hooks                          # clone 후 한 번: commit 때 commit message와 record를 검사
```

`make check`는 `package.json`이 pin한 kit의 document 검사와 command 이름 검사를 실행한다. Application은 release를 설치할 때 `plugin.json`을 검증한다.

Checklist는 [docs/features.md](docs/features.md)다.
