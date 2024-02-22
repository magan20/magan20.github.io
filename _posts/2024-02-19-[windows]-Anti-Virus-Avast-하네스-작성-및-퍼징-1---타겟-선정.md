---
layout: post
date: 2024-02-19
title: "[windows] Anti-Virus Avast 하네스 작성 및 퍼징 1 - 타겟 선정"
tags: [windows, Anti-Virus, Fuzzing, ]
categories: [Fuzzing, ]
---


## 개요


Anti-Virus 대상 harness를 작성하고 직접 퍼징까지 해보라는 과제가 나왔고, 처음에 여러 시도를 해봤지만 결국 과제는 제출하지 못했다.. 


과제 제출기간은 끝났더라도 직접 하네스를 만들고 퍼징을 해보고 싶어서 제출기간 이후에도 계속 분석을 시도했다.


## 준비물


### 가상머신

- **host os** : windows 22H2 19045.4046
- **hypervisor** : vmware workstation 17 pro
- **guest os** : windows 22H2 19045.3930

### 타겟 프로그램

- 이름 : Avast Free Antivirus
- 버전 : 24.1.6099(빌드 24.1.8821.762)

### 사용 프로그램

- PPLKiller
- Ida Freeware 8.3
- x64dbg
- ProcessMonitor(Procmon64)
- visual studio 2019

## 환경 구성


### PPLKiller 설치


Anti-Virus는 windows 운영체제에서 다른 프로세스에 비해 특별히 보호되어야 하는 프로세스로 분류되어 PPL(Protected Processes Light) 이라는 기술이 적용되어 있다.


디버거를 관리자 권한으로 실행한다고 해도 Anti-Virus의 핵심 프로세스는 PPL로 보호되어 있기 때문에 디버거에 프로세스가 표시되지 않거나 작업이 거부되는 등의 이슈가 발생한다.


때문에 Anti-Virus 프로그램을 디버깅하고자 한다면 `PPLKiller` 와 같은 툴을 사용하여 PPL를 무력화시켜야한다.


처음에 `Mattiwatti` 깃허브 레퍼지토리에 있는 PPLKiller를 다운받아서 빌드를 시도했으나 무엇이 문제인지 계속 드라이브 로드가 되지 않았다…


[bookmark](https://github.com/Mattiwatti/PPLKiller)


여러번 삽질을 하다가 그냥 다른 PPLKiller 를 찾아보았고, `RedCursorSecurityConsulting` 깃허브 레퍼지토리에 있는 PPLKiller를 사용하여 PPL을 해제하였다.


[bookmark](https://github.com/RedCursorSecurityConsulting/PPLKiller)


[ 빌드 한거 나중에 쓸거임 ]


## 분석


### 타겟 기능 선정


다른 사람들은 대부분 스캔 기능을 타겟으로 했지만, 나는 설정 항목에서 설정 복원 기능을 타겟으로 했다.


해당 기능을 확인해보았을 때 zip 파일 형식의 avast 설정 파일을 받고있었고, 설정 복원 시 관리자 권한이 필요한 것으로 보아 나름 좋은 타겟이라고 생각했다.


![0](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/0.png)


만약 해당 기능에 대한 하네스를 만들게 된다면, 파일 경로를 인자로 받아서 설정 복원 기능을 재현하도록 구현할 수 있을 것이다.


### 핵심 프로세스 확인


avast를 실행한 이후 작업 관리자의 세부 정보를 확인해보면 아래와 같이 관련 프로세스가 실행중인 것을 확인할 수 있다.


![1](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/1.png)


`설정 복원` 기능 사용 시 관리자 권한을 필요로 하므로, 해당 기능과 관련되어 있는 프로세스는 `aswidsagent.exe`, `aswToolsSvc.exe` , `AvastSvc.exe` 중 하나라고 추측할 수 있다. 


설정 복원 기능을 분석하기에 앞서, 우리가 넣어준 파일을 실제로 열고 닫는 작업을 하는 프로세스를 확인해야 한다. 리소스 모니터나 성능 모니터 툴을 사용해서 간접적으로 자원의 사용량을 확인할 수도 있지만 필자는 `process monitor` 툴을 사용하여 실제로 프로세스가 접근하는 파일들을 확인했다.


주의해야 될 점은 다음과 같다.

1. 사용자는 UI를 통해 파일경로와 이름을 넘겨주므로, 실제로 파일명을 받는 프로세스는 UI 프로세스(AvastUI.exe)이다.
2. UI 프로세스는 파일에 대한 핸들이나 파일이름과 같은 정보들을 rpc 등을 통해 백그라운드 프로세스로 넘겨준다.
3. 백그라운드 프로세스에서 파일에 대한 임시파일을 생성한 후 작업을 수행할 수도 있으므로 실제로 접근하는 파일이 사용자가 만든 파일이 아닐 수 있다.

먼저 각 프로세스에 대한 PPL을 해제한다. PPL을 해제하지 않을 경우 디버깅이나 프로세스 모니터링이 제대로 이루어지지 않을 수 있다. 필자가 빌드한 PPLKiller같은 경우는 아래와 같이 pid를 사용하여 PPL 을 무력화시킬 수 있다.


![2](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/2.png)


설정 파일 복원 기능을 사용하기 위해서는 해당 기능에 인자로 들어갈 파일을 생성해야한다. 복원 기능에 사용되는 파일은 `설정 백업` 기능을 사용하여 생성할 수 있다.


![3](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/3.png)


### 프로세스 모니터링


Process Monitor 툴을 실행한 후 특정 프로세스를 필터링하여 실제 접근되는 파일들을 확인할 수 있다.


우리는 _**사용자가 UI 프로세스로 파일을 넘겨주는 시점부터 적용이 끝날 때까지의 과정**_에서 어떤 프로세스가 관여되는지 확인할 것이기 때문에, `AvastUI.exe` 프로세스를 포함하여 `AvastSvc.exe`, `aswToolsSvc.exe`, `aswidsagent.exe` 프로세스에 대해 모니터링을 수행할 것이다.


 `Process name` 을 각각의 프로세스로 설정하여 4개의 프로세스에 대한 필터링을 추가했다.


![4](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/4.png)


필터링 항목을 추가한 후에는 기존 로그목록을 삭제한 후, UI 프로세스에서 백업한 설정파일을 다시 복원한다.


![5](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/5.png)


그 후 `process monitor` 툴에 캡처된 목록들 중에서 `.avastconfig` 문자열을 검색해보았을 때, 아래 그림과 같이 `AvastUI.exe` 프로세스에서 실제로 필자가 넣어준 파일에 대해 `CreateFile` 작업을 하고 있는 것을 확인할 수 있다.


![6](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/6.png)


정확히 어떤 라이브러리의 어떤 함수에서 해당 파일에 접근하는지 알아보기 위해 `우측클릭 -> stack` 을 통해 함수 호출 스택을 확인해보았다.


스택을 확인해본 결과 `KERNELBASE.dll` 라이브러리의 `CreateFileW` 라는 함수에서 해당 파일을 인자로 받는 것 같았다. 


![7](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/7.png)


> 💡 CreateFileW  
> 파일 또는 I/O 디바이스를 만들거나 엽니다. 가장 일반적으로 사용되는 I/O 디바이스는 파일, 파일 스트림, 디렉터리, 물리적 디스크, 볼륨, 콘솔 버퍼, 테이프 드라이브, 통신 리소스, 메일 슬롯 및 파이프입니다. 함수는 파일 또는 디바이스 및 지정된 플래그 및 특성에 따라 다양한 형식의 I/O에 대한 파일 또는 디바이스에 액세스하는 데 사용할 수 있는 핸들을 반환합니다.


해당 `CreateFileW` 함수는 단순히 인자로 주어진 파일에 대한 핸들을 반환하는 함수로 나와있다. 


이것만으로는 무슨 작업을 했는지 모르기 때문에 프로세스 모니터 아래쪽을 좀 더 확인해보았다.


더 아래쪽 로그를 확인해본 결과 해당 파일에 대해 추가의 작업을 하고 있었고, 스택을 확인해보았을 때 `CopyFileW` 함수를 호출하는 것을 확인할 수 있었다. 


![8](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/8.png)


![9](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/9.png)


더 아래쪽 로그를 확인해보면 더 이상 `AAAAAAAA.avastconfig` 파일은 확인할 수 없었고, `AvastSvc.exe` 프로세스에서 `Temp` 디렉터리에 있는 임시 파일에 접근하는 것을 확인할 수 있었다.


![10](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/10.png)


해당 로그에 대한 스택을 확인해보았을 때 `ashServ.dll` 라이브러리의 `ServicePowerEvent` 함수에서 `CreateFileW` 함수를 호출하고 있었다.


![11](/assets/img/2024-02-19-[windows]-Anti-Virus-Avast-하네스-작성-및-퍼징-1---타겟-선정.md/11.png)


위 내용들을 확인해보았을 때 유추할 수 있는 사실은 다음과 같다. 

1. `AvastUI.exe` 프로세스에서는 원본 파일을 임시 파일로 복사한다.
2. `설정 복원` 기능을 담당하는 백그라운드 프로세스는 `AvastSvc.exe` 이며, 해당 프로세스에서는 UI 프로세스가 생성한 임시 파일을 통해 작업을 수행한다.
3. `AvastSvc.exe` 에서 `설정 복원` 기능의 핵심은 `ashServ.dll` 라이브러리에서 담당한다.

### 프로세스 디버깅


지금까지 분석한 내용을 보았을 때 **“**_**사용자가 넘겨준 파일을 임시 파일로 복사한 다음 후속 작업을 수행한다.”**_ 라는 가설이 나왔고, 실제로 해당 가설이 맞는지 확인해보기 위해 `AvastSvc.exe` 프로세스에 대해 디버깅을 시도했다.


`x64dbg` 툴을 사용하여 `AvastSvc.exe` 파일에 attach 한 후 `CopyFileW` 함수에 breakpoint를 설정할 것이다.


`CopyFilew` 함수의 프로토타입을 확인해보았을 때 `lpNewFileName` 인자가 있는 것으로 보아, 해당 함수 실행 시점을 확인해보면 새로 생성되는 파일 이름을 확인할 수 있을 것이다.


{% raw %}
```bash
BOOL CopyFileW(
  [in] LPCWSTR lpExistingFileName,
  [in] LPCWSTR lpNewFileName,
  [in] BOOL    bFailIfExists
);
```
{% endraw %}


디버깅을 수행하기 전, 혹시 모를 수고를 덜기 위해 `AvastSvc.exe` 프로세스에 대해 PPLKiller 를 다시 실행해주자.

