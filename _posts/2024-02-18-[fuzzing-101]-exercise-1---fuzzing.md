---
layout: post
date: 2024-02-18
title: "[fuzzing 101] exercise 1 - fuzzing"
tags: [fuzzing 101, Fuzzing, afl++, ]
categories: [Fuzzing, ]
---


## 개요


---


AFL++ 를 설치했으므로 이제 실제 퍼징을 진행해보자. 퍼징 대상은 `Xpdf PDF Viewer` 이다.


실습 내용은 [fuzzing 101 - exercise1](https://github.com/antonio-morales/Fuzzing101/tree/main/Exercise%201) 을 참고했다.


AFL++ 는 **`Coverage-guided Fuzzer`** 로 새로운 실행 경로와 잠재적인 버그를 발견하기 위해 변경된 각 입력에 대한 적용 범위 정보를 수집한다.


만약 소스 코드가 제공된다면 AFL는 컴파일 타임 계층을 사용하여 각 기본 블록(함수, 루프)의 시작 부분에 함수 호출을 삽입할 수 있다. 대상 애플리케이션에 대한 계측을 활성화 하기 위해서는 AFL 컴파일러를 사용하여 바이너리를 다시 컴파일하거나 빌드해야한다.


실습 과정은 다음과 같다.

1. Xpdf viewer 소스코드 다운로드
2. afl 컴파일러를 사용하여 Xpdf 빌드
3. 퍼징

## 환경

- kernel : linux 5.15.0-87-generic
- os : ubuntu 20.04.6 LTS (Focal Fossa)
- ram : 16gb
- core : 6

## 실습


---


### Xpdf viewer 소스코드 다운


먼저 실습을 위한 디렉터리를 생성한다.


필자 같은 경우에는 `fuzzing 101` 에 나와있는 모든 예제들을 하나씩 실습해 볼 예정이기 때문에 `~/fuzzing101/ex1` 디렉터리를 생성하고 하위 `pdf` 디렉터리에 소스코드를 다운로드했다.

- 디렉터리 생성

{% raw %}
```bash
cd ~
mkdir -p fuzzing101/ex1/pdf
cd fuzzing101/ex1/pdf
```
{% endraw %}

- 소스코드 다운로드

{% raw %}
```bash
wget https://dl.xpdfreader.com/old/xpdf-3.02.tar.gz
tar -xvzf xpdf-3.02.tar.gz
```
{% endraw %}


fuzzing101 공식 문서에서는 xpdf 를 직접 빌드하고 테스트까지 진행하지만, 어차피 이따가 AFL++ 컴파일러를 사용하여 다시 빌드할 예정이기 때문에 따로 빌드 및 테스트는 진행하지 않았다.


### Xpdf 빌드


대상 애플리케이션 소스코드를 다운로드 한 후에는 AFL++ 컴파일러를 사용하여 빌드할 수 있다. AFL++ 컴파일러는 AFL++ 빌드 시 자동으로 설치되며, 만약 AFL++ 가 설치되어 있지 않았다면 [여기](https://magan20.github.io/posts/fuzzing-101-exercise-1-AFL++-%EC%84%A4%EC%B9%98/)에서 빌드하는 방법을 확인할 수 있다.


소스코드를 빌드하기 앞서 `LLVM` 에 대한 환경변수를 설정하고, `CC` , `CXX` 를 AFL++ 에 맞게 수정해주어야 한다.


자신의 서버에 설치되어 있는 llvm 버전은 아래 명령어를 통해 확인할 수 있다.


{% raw %}
```bash
ls /usr/bin/llvm-config*
/usr/bin/llvm-config  /usr/bin/llvm-config-10
```
{% endraw %}


`CC` 와 `CXX` 는 `afl-clang-fast` 와 `afl-clang-fast++` 로 설정하면 된다.


llvm 버전을 확인한 후에는 AFL++ 컴파일러를 사용하여 Xpdf 를 빌드할 수 있다.


빌드 시 `-j` 옵션을 통해 빌드 시 사용할 코어 수를 지정할 수 있다. 나는 5개로 설정했다. (실습 서버 코어 수 : 6)


{% raw %}
```bash
cd ~/fuzzing101/ex1/xpdf-3.02
export LLVM_CONFIG="llvm-config-10"
CC=$HOME/AFLplusplus/afl-clang-fast CXX=$HOME/AFLplusplus/afl-clang-fast++ ./configure --prefix="$HOME/fuzzing101/ex1/pdf/install/"
make -j5
make install
```
{% endraw %}


## 퍼징


Xpdf 를 빌드했으므로 이제 입력값으로 넣어줄 샘플 pdf 파일이 필요하다.


다음 명령어를 사용하여 샘플 pdf 파일을 다운받자


{% raw %}
```bash
mkdir ~/fuzzing101/ex1/pdf/sample
cd ~/fuzzing101/ex1/pdf/sample
wget https://github.com/mozilla/pdf.js-sample-files/raw/master/helloworld.pdf
wget http://www.africau.edu/images/default/sample.pdf
wget https://www.melbpc.org.au/wp-content/uploads/2017/10/small-example-pdf-file.pdf
```
{% endraw %}


이제 퍼징을 위한 모든 준비가 끝났다.


다음 명령어를 사용하여 Xpdf 에 대한 퍼징을 수행할 수 있다.


{% raw %}
```bash
afl-fuzz -i $HOME/fuzzing101/ex1/pdf/sample/ -o $HOME/fuzzing101/ex1/pdf/out/ -s 123 -- $HOME/fuzzing101/ex1/pdf/install/bin/pdftotext @@ $HOME/fuzzing101/ex1/pdf/output
```
{% endraw %}


각 인자에 대한 설명은 다음과 같다.

- -i : 타겟 바이너리에 들어가는 샘플 파일들이 들어있는 디렉터리
- -o : AFL++가 변형된 파일을 저장할 디렉터리
- -s : 사용할 정적 무작위 시드
- @@ : AFL이 각 입력 파일 이름으로 대체할 자리 표시자 대상의 명령줄

퍼징 시 실제로 바이너리를 실행하는 명령줄은 다음과 같다.


{% raw %}
```bash
$HOME/fuzzing101/ex1/pdf/install/bin/pdftotext <입력 파일> $HOME/fuzzing101/ex1/pdf/output
```
{% endraw %}


### 트러블 슈팅


명령어를 입력하자마자 에러가 발생했다.


에러 내용은 다음과 같다.


![0](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/0.png)


![1](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/1.png)


![2](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/2.png)


![3](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/3.png)


![4](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/4.png)


![5](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/5.png)


![6](/assets/img/2024-02-18-[fuzzing-101]-exercise-1---fuzzing.md/6.png)


## 참고

- [https://github.com/antonio-morales/Fuzzing101/tree/main/Exercise 1](https://github.com/antonio-morales/Fuzzing101/tree/main/Exercise%201)
- [https://magan20.github.io/posts/fuzzing-101-exercise-1-AFL++-설치/](https://magan20.github.io/posts/fuzzing-101-exercise-1-AFL++-%EC%84%A4%EC%B9%98/)
