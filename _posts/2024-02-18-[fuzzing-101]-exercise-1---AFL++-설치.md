---
layout: post
date: 2024-02-18
title: "[fuzzing 101] exercise 1 - AFL++ 설치"
tags: [Fuzzing, afl++, ]
categories: [Fuzzing, ]
---


## 개요


윈도우 AV 하네스 작성 과제를 하다가 퍼징 공부의 필요성을 느껴서 fuzzing 101을 시작했다. 


빌드 과정은 [AFL++ 공식 깃허브 사이트](https://github.com/AFLplusplus/AFLplusplus/blob/stable/docs/INSTALL.md)를 참고했다.


아래는 모든 설치 명령어를 모아 놓은 것이다. 빠른 설치를 원하는 분들은 아래 명령어만 쓱싹하면 된다.

- 의존성 설치

{% raw %}
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3-dev automake cmake git flex bison libglib2.0-dev libpixman-1-dev python3-setuptools cargo libgtk-3-dev
# try to install llvm 14 and install the distro default if that fails
sudo apt-get install -y lld-14 llvm-14 llvm-14-dev clang-14 || sudo apt-get install -y lld llvm llvm-dev clang
sudo apt-get install -y gcc-$(gcc --version|head -n1|sed 's/\..*//'|sed 's/.* //')-plugin-dev libstdc++-$(gcc --version|head -n1|sed 's/\..*//'|sed 's/.* //')-dev
sudo apt-get install -y ninja-build # for QEMU mode
```
{% endraw %}

- 소스 코드 다운

{% raw %}
```bash
cd ~
git clone https://github.com/AFLplusplus/AFLplusplus
```
{% endraw %}

- 빌드

{% raw %}
```bash
cd AFLplusplus
make distrib -j5 # 코어 5개 사용
sudo make install
```
{% endraw %}


## 환경


실습 환경은 ubuntu 20.04 물리 머신에서 진행했으며, 상세 내용은 다음과 같다.

- kernel : 5.15.0-87-generic
- OS : ubuntu 20.04.6 LTS (Focal Fossa)
- ram : 16gb
- core : 6

## 빌드


### 의존 패키지 설치


아래와 같은 의존 패키지를 설치한다. 


{% raw %}
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3-dev automake cmake git flex bison libglib2.0-dev libpixman-1-dev python3-setuptools cargo libgtk-3-dev
# try to install llvm 14 and install the distro default if that fails
sudo apt-get install -y lld-14 llvm-14 llvm-14-dev clang-14 || sudo apt-get install -y lld llvm llvm-dev clang
sudo apt-get install -y gcc-$(gcc --version|head -n1|sed 's/\..*//'|sed 's/.* //')-plugin-dev libstdc++-$(gcc --version|head -n1|sed 's/\..*//'|sed 's/.* //')-dev
sudo apt-get install -y ninja-build # for QEMU mode
```
{% endraw %}


### AFL++ 소스코드 다운로드


아래 명령어를 사용하여 소스코드를 다운로드 한다.


{% raw %}
```bash
cd ~
git clone https://github.com/AFLplusplus/AFLplusplus
```
{% endraw %}


### AFL++ 빌드


make 명령어를 사용할 때 ALF++ 빌드 옵션은 다음과 같다.


> 옵션

	- all: 주요 AFL++ 바이너리 및 llvm/gcc 계측
	- binary-only: 바이너리 전용 퍼징을 위한 모든 것: frida_mode, nyx_mode, qemu_mode, frida_mode, unicorn_mode, coresight_mode, libdislocator, libtokencap
	- source-only: • 소스 코드 퍼징을 위한 모든 것: nyx_mode, libdislocator, libtokencap
	- distrib: 모든 것(바이너리 전용 및 소스 코드 퍼징 모두에 해당)

나는 한번에 설치할 때 모두 설치하는게 편할 것 같아 `distrib` 옵션을 선택했다.


또한 `-j` 옵션을 사용하여 빌드 시 사용할 코어 수를 지정할 수 있는데, 모든 코드를 다 사용하면 쓰레싱이 발생할 수도 있기 때문에 5개만 사용했다. (실습 물리 머신 최대 코어 수 : 6)


{% raw %}
```bash
cd AFLplusplus
make distrib -j5
sudo make install
```
{% endraw %}


> `make distrib` 명령어 결과


![0](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---AFL++-설치.md/0.png)


빌드할 때 분명 한번쯤은 에러가 발생할 것이라고 생각했는데 의외로 한번에 됐다; 


뭔가 한번에 성공하니까 오히려 더 찜찜한 느낌…


## 결과


빌드가 끝나고 나면 따로 환경변수를 설정해줄 필요 없이 바로 명령어 사용이 가능하다.


![1](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---AFL++-설치.md/1.png)


깃허브 공식 문서 아래쪽을 보니까 맥북에서도 설치할 수 있는 것 같아서 다음에는 맥북에서도 한번 설치해봐야겠다. 아마 무수한 에러가 쏟아지겠지…


## 참조

- [https://github.com/AFLplusplus/AFLplusplus/blob/stable/docs/INSTALL.md](https://github.com/AFLplusplus/AFLplusplus/blob/stable/docs/INSTALL.md)
