---
layout: post
date: 2024-01-25
title: "Advanced Android App Analysis - 1. 환경 세팅"
tags: [0-day, android, ]
categories: [Vulnerable Research, ]
---


# 1. 개요


---


## 1.1. 타겟 설정


안드로이드 앱 취약점 분석에 들어가기 전, 어떤 앱을 분석할지 고민을 해 보았다. 20~30 대가 많이 사용하고, 기능도 적당히 적당한(?) 앱을 고민하다가 두 종류의 앱이 추려졌다.


> **타겟 앱 목록**

1. **학습 서포트 앱**
	- 열품타, 열공시간, 올클, 마이루틴, 루티너리
2. **패션 쇼핑 앱**
	- 하이버, 무신사, 크림, 에이블리, 지그재그

> 


둘다 20~30대가 많이 사용할만한 앱이고, 결제나 인증 같은 기능도 적절히 있어서 후보군으로 생각해보았다. 두 주제 중에서 어떤 것을 타겟으로 할지는 아직 정하지 않았으며, 환경 구축 이후에 확실하게 정할 것 같다.


## 1.2. 준비물


환경 분석에 대한 내용을 정리한 포스터이다. 먼저 `모바일 취약점 분석` 키워드를 사용하여 검색해보았을 때 필요한 준비물은 아래와 같다.


> 💡 **모바일 취약점 분석 준비**  
> 1. **프록시 툴**  
>   
> 2. **안드로이드 OS**

	1. **프록시 툴**
		- Frida
		- Burp Suite
		- Fiddler
	2. **안드로이드 OS**
		- 루팅된 안드로이드 단말기
		- 안드로이드 에뮬레이터

{% raw %}
```markdown
<aside>
💡 **모바일 취약점 분석 준비**

1. **프록시 툴**
    - Frida
    - Burp Suite
    - Fiddler
    
2. **안드로이드 OS**
    - 루팅된 안드로이드 단말기
    - 안드로이드 에뮬레이터
</aside>
```
{% endraw %}


프록시 툴 중에서 실질적으로 많이 활용해본 것은 ‘Burp Suite’ 이지만, 모바일 취약점 분석에는 Frida 틀을 많이 사용하는 것 같아서 툴 사용법도 익힐 겸 **Frida 를 사용하기로 결정 했다.**


안드로이드 OS 같은 경우 안드로이드 폰이 있긴 하지만, 호환성 등의 문제가 발생할 수도 있어서(갤럭시 노트 9..) 에물레이터를 사용하기로 했다. 


하지만 안드로이드 스튜디오와 같이 용량만 많이 차지하는 육중한 툴로 내 맥북을 더럽히고 싶지 않았다. 이러한 생각으로 chatGPT에게 도움을 구했고, command line tools 을 사용한 AVD(android virtual device) 다운로드 및 에뮬레이트를 통해 분석 환경을 구축하였다.


# 2. 환경 구축


---


## 2.1. 가상 머신 설치


분석을 위한 가상 머신을 설치했다. windows 를 사용했다면 vmware 를 사용하여 ubuntu22.04 amd64 버전을 설치했겠지만, 맥북을 사용하고 있기 때문에 `Parellels` 를 사용하여 `ubuntu22.04 aarch64` 를 설치했다.


> Host


> 

	- machine : Macbook Air
	- arch : Apple m1
	- memory : 16GB
	- ssd : 1TB

### Guest

- Hypervisor : Parellels
- OS : ubuntu22.04
- arch : aarch64

## 2.2. Android SDK 설치


`android sdk` 검색을 통해 Android 공식 다운로드 페이지에 들어가면 몇가지 다운로드 링크들이 있다. 먼저 어떤 도구를 받아야될지 알아보기 위해 [`SDK 도구`](https://developer.android.com/tools?hl=ko) 페이지에 들어가보았다.


해당 페이지에는 다음과 같은 도구들이 있었다.


> **SDK 도구 종류**

- **Android SDK 명령줄 도구**
	- [`apkanalyzer`](https://developer.android.com/studio/command-line/apkanalyzer?hl=ko) : 빌드 프로세스가 완료된 후 APK의 구성에 관한 유용한 정보를 제공합니다.
	- [`avdmanager`](https://developer.android.com/studio/command-line/avdmanager?hl=ko) : 명령줄에서 Android Virtual Device(AVD)를 만들고 관리할 수 있습니다.
	- [`lint`](https://developer.android.com/studio/write/lint?hl=ko#commandline) : 코드를 스캔하여 코드의 구조적 품질 문제를 식별하고 수정할 수 있도록 지원합니다.
	- [`retrace`](https://developer.android.com/studio/command-line/retrace?hl=ko) : R8로 컴파일된 애플리케이션의 경우 `retrace`는 원래 소스 코드에 다시 매핑되는 난독화된 스택 트레이스를 디코딩합니다.
	- [`sdkmanager`](https://developer.android.com/studio/command-line/sdkmanager?hl=ko) : Android SDK용 패키지를 보고 설치하고 업데이트하고 제거할 수 있습니다.
- **Android SDK 빌드 도구**
	- [`AAPT2`](https://developer.android.com/studio/command-line/aapt2?hl=ko) : Android 리소스를 Android 플랫폼에 최적화된 바이너리 형식으로 파싱하고 색인을 생성하며 컴파일한 후 컴파일된 리소스를 단일 출력으로 패키징합니다.
	- [`apksigner`](https://developer.android.com/studio/command-line/apksigner?hl=ko) : APK에 서명하고 APK 서명이 지정된 APK가 지원하는 모든 플랫폼 버전에서 성공적으로 인증되는지 확인합니다.
	- [`zipalign`](https://developer.android.com/studio/command-line/zipalign?hl=ko) : 압축되지 않은 모든 데이터가 파일 시작 부분을 기준으로 특정 정렬이 적용된 상태로 시작되도록 하여 APK 파일을 최적화합니다.
- **Android SDK 플랫폼 도구**
	- [`adb`](https://developer.android.com/studio/command-line/adb?hl=ko) : adb(Android 디버그 브리지)는 에뮬레이터 인스턴스 또는 Android 지원 기기의 상태를 관리할 수 있는 다목적 도구입니다. adb를 사용하여 기기에 APK를 설치할 수도 있습니다.
	- [`etc1tool`](https://developer.android.com/studio/command-line/etc1tool?hl=ko) : PNG 이미지를 ETC1 압축 표준으로 인코딩하고 압축된 ETC1 이미지를 PNG로 다시 디코딩할 수 있는 명령줄 유틸리티입니다.
	- `fastboot` : 기기를 플랫폼 및 기타 시스템 이미지로 플래시합니다. 플래시 안내는 [Nexus 및 Pixel 기기용 공장 출고 시 이미지](https://developers.google.com/android/images?hl=ko)를 참고하세요.
	- [`logcat`](https://developer.android.com/studio/command-line/logcat?hl=ko) : 앱 및 시스템 로그를 보기 위해 adb에서 호출합니다.
- **Android Emulator**
	- [`emulator`](https://developer.android.com/studio/run/emulator-commandline?hl=ko) : 실제 Android 런타임 환경에서 애플리케이션의 디버그 및 테스트에 사용할 수 있는 QEMU 기반 기기 에뮬레이션 도구입니다.
	- [`mksdcard`](https://developer.android.com/studio/command-line/mksdcard?hl=ko) : SD 카드와 같은 외부 메모리 카드의 존재를 시뮬레이션하기 위해 에뮬레이터와 함께 사용할 디스크 이미지를 만들 수 있습니다.

---


 나는 시스템 이미지 다운로드 및 AVD 생성, 에뮬레이트를 해야 되기 때문에 **`Android SDK 명령줄 도구`** 와 **`Android Emulator`** 를 다운로드 했다.


처음에 `Android Emulator` 는 어디서 다운로드 하는지 몰라서 헤맸었


# Reference


[https://developer.android.com/tools?hl=ko](https://developer.android.com/tools?hl=ko)

