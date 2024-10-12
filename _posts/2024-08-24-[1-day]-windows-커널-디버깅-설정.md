---
layout: post
date: 2024-08-24
title: "[1-day] windows 커널 디버깅 설정"
tags: [windows, ]
categories: [Vulnerable Research, ]
---


윈도우 1-day 분석을 하기에 앞서 windows 커널 디버깅 설정을 해보자.


## 1. 환경 설정


### 1.1. 게스트


vmware workstation 17 을 사용했으며, 게스트 환경은 다음과 같다.

- OS : windows 10 1909 (build 18363.592)
- RAM : 16GB
- Core : 4 core

### 1.2. windbg 설치


먼저 윈도우 구조 분석을 위해 필요한 도구인 windbg 를 설치해야된다. windbg 는 아래 링크에서 다운받으면 된다.


[bookmark](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/?redirectedfrom=MSDN)


실제 디버깅은 게스트가 아니라 호스트에서 진행하기 때문에, 호스트에 설치하면 된다.


## 2. 심볼


windbg 를 설치한 후에는 심볼 설정을 해주어야 한다. 심볼이 무엇이냐…


심볼은 변수, 함수, 클래스 등 프로그램 실행 파일이나 라이브러리 내에서 사용되는 다양한 식별자들에 대한 정보를 포함한 메타데이터이며 윈도우에서는 `.pdb` 확장자로 표시된다.


심볼에 포함되는 정보는 다음과 같다.

- 변수의 이름과 주소 및 데이터 타입
- 각 엔트리 포인트의 함수의 이름과 주소
- 매개변수 정보
- 클래스 및 구조체 정보
- 소스 파일의 경로와 줄 번호

디버깅 시, 심볼을 통해 코드의 특정 부분이 실제로 어떤 기능을 수행하는지 알 수 있기 때문에 프로그램 디버깅 및 분석 과정에서 중요한 역할을 한다.


마이크로소프트는 외부에 심볼 서버를 공개하여 윈도우 디버깅 시에 내부 정보를 확인할 수 있도록 해준다. 대부분의 정보는 공개되지만, 사실상 우리가 분석하는 시스템 프로세스들은 대부분이 비공개 심볼이다.


공개 심볼서버 구성에 대한 정보는 아래에서 확인 가능하다.


[bookmark](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/?redirectedfrom=MSDN)


### 2.1. 심볼 설정

- 호스트에서 설정

이제 심볼을 설정하는 방법에 대해 알아보자.


1-day 분석 시, 원격 커널 디버깅을 수행해야되기 때문에 단순히 호스트의 windbg에 경로 설정을 해주는 것 만으로 심볼 설정을 완료할 수 있다.


windbg 에서 setting → debugging settings → Default symbol path 에 다음 정보를 입력하면 된다.


{% raw %}
```bash
srv*c:\symbols*http://msdl.microsoft.com/download/symbols
```
{% endraw %}


![0](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/0.png)


## 3. 커널 디버깅 설정


이제 커널 디버깅을 할 차례이다. 하지만 본격적으로 커널 디버깅을 하기 전에 몇가지 설정을 더 해주어야 한다.


### 3.1. 디버깅 모드 설정

- 게스트에서 설정

커널은 보호되어있기 때문에 일반 유저들은 마음대로 들여다 볼 수 없다. 즉 타겟 PC에서 커널 디버깅을 허용해주도록 설정을 변경해주어야 한다.


게스트에서 cmd를 **관리자 권한 실행**한 후, 아래 명령어를 입력함으로써 디버깅 모드를 실행할 수 있다.


{% raw %}
```bash
bcdedit /debug on
```
{% endraw %}


![1](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/1.png)


### 3.2. 파이프 설정


이제 디버깅을 위한 조건은 다 갖추었기 때문에 호스트에서 실행되는 debugger과 게스트의 커널(debuggee)를 연결하는 작업을 해야된다.


호스트와 게스트 간 시리얼통신을 통해 원격 디버깅을 진행해야되기 때문에 vmware 설정에서 시리얼 포트를 설정해주어야 한다.


~~사실 네트워크를 통해 연결하는게 더 빠르고 안정성도 높다고 하는데 귀찮아서 더 익숙한 시리얼 통신을 사용…~~


시리얼 포트를 추가하기 위해 먼저 게스트의 전원을 끈 상태에서 진행한다.


게스트의 전원을 take off 한 후, settings → add 에 들어가서 serial port 를 추가해준다.


![2](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/2.png)


serial port가 추가됐으면 use named pipe 를 선택한 후 `₩₩.₩pipe₩[원하는 이름]` 형식으로 파이프 경로를 설정해준다.


![3](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/3.png)


이후 호스트의 windbg에서 다음과 같이 baud rate와 위에서 설정했던 파이프 이름을 설정하고 ok를 누르면 아래와 같이 게스트에 연결된 모습을 볼 수 있다.


![4](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/4.png)


![5](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/5.png)


이후 Go 를 눌러서 게스트가 대기 상태가 되면 `shutdown -r -t 0` 으로 재부팅해준다.


디버거가 붙은 상태에서 부팅되면 우측 하단에 테스트모드와 빌드 버전 정보가 표시되는 것을 확인할 수 있다.


![6](/assets/img/2024-08-24-[1-day]-windows-커널-디버깅-설정.md/6.png)


## Reference

- [https://hackyboiz.github.io/2021/05/30/l0ch/windows-driver/](https://hackyboiz.github.io/2021/05/30/l0ch/windows-driver/)
- [https://plummmm.tistory.com/131](https://plummmm.tistory.com/131)
- [https://velog.io/@woounnan/WINDOWS-윈도우-디버깅-설정](https://velog.io/@woounnan/WINDOWS-윈도우-디버깅-설정)
