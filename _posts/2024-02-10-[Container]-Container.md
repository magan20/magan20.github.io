---
layout: post
date: 2024-02-10
title: "[Container] Container"
tags: [container, vm, ]
categories: [Container, ]
---


# 컨테이너


컨테이너는 애플리케이션 배포 시, 다른 컴퓨팅 환경에서도 빠르고 안정적으로 실행될 수 있도록 코드와 모든 종속성을 패키지화하는 소프트웨어 표준 단위입니다.


즉, 격리된 사용자 공간에서 애플리케이션이 실행될 수 있는 여러 리소스에 대한 OS 수준 가상화입니다.


# 컨테이너의 등장


과거에는 대부분 하나의 **서버 당 한 개의 애플리케이션이 실행**되었습니다. 애플리케이션마다 종속성이 다르고, 동일한 패키지를 사용한다고 해도 버전차이가 있을 수 있기 때문에 하나의 서버에서 여러 개의 애플리케이션을 실행하기에는 안정성 문제가 발생했습니다.  이러한 운영 방식으로 인해 **회사의 자본과 서버의 자원이 많이 낭비**됐습니다.


그 이후 가상 머신(VM, Virtual Machine)이 등장했고, 하나의 서버에 여러개의 애플리케이션을 실행시킬 수 있었습니다. 하지만 VM도 만능은 아니었습니다. 당시 발생한 VM의 문제는 다음과 같습니다.

1. 각각의 VM이 OS를 포함하고 있기 때문에, 각각의 OS를 구동하기 위한 추가적인 자원 필요
2. 각각의 VM이 OS를 포함하고 있기 때문에 OS에 대한 lisence 필요
3. 부팅 속도 문제와 다양한 플랫폼 간 이식성 문제

시간이 지난 이후 container 가 등장했습니다. container는 기존 VM과 다르게 하나의 호스트 안에서 한 개의 OS를 공유하면서 자원 낭비나 lisence 등으로 인한 추가의 cost가 사라졌습니다. 또한 VM과 다르게 부팅 속도도 빠르고 타 플랫폼간 이식성도 높아졌습니다.


![0](/assets/img/2024-02-10-[Container]-Container.md/0.png)


# 컨테이너의 특징


컨테이너의 특징은 다음과 같습니다.

- **운영체제 수준 가상화** : 컨테이너는 운영체제 수준의 가상화로, 별도의 하드웨어 에물레이션 없이 커널을 공유함으로써 컨테이너를 실행하게 됩니다.
- **빠른 속도와 효율성** : 에뮬레이션이라는 코스트가 없기 때문에 컨테이너는 VM에 비해 빠르게 실행됩니다. 프로세스 격리를 위해 약간의 오버헤드가 있지만 일반적인 프로세스를 실행하는 것과 거의 차이가 없습니다.
- **높은 이식성** : 모든 컨테이너는 호스트의 환경이 아닌 독자적인 실행 환경을 가지고 있습니다. 이 환경은 파일들로 구성되기 때문에 동일한 컨테이너 런타임을 사용할 경우 컨테이너의 실행 환경을 쉽게 공유하고 재현할 수 있습니다.
- **상태를 가지지 않음** : 컨테니어가 실행되는 환경은 독립적이기 때문에, 다른 컨테이너에게 영향을 주지 않습니다. 도커와 같이 이미지 기반으로 컨테이너를 실행하는 경우 특정 실행 환경을 쉽게 재사용할 수 있습니다.

# Reference

- [https://kubernetes.io/docs/concepts/overview/](https://kubernetes.io/docs/concepts/overview/)
- [https://www.44bits.io/ko/keyword/linux-container](https://www.44bits.io/ko/keyword/linux-container)
