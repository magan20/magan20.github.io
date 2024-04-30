---
layout: post
date: 2024-04-30
title: "FSOP(File Stream Oriented Programming) 공격기법 이해 - (1) File Structure"
tags: [_IO_FILE, linux, pwnable, wargame, 공격기법, ]
categories: [Pwnable, ]
---


## 00. 개요


해당 글은 **FSOP(File-Stream Oriented Programming)**라는 기법을 이해하기 위한 기초 배경 지식을 공부하고, 실제 공격 원리를 이해하기 위해 작성되었다.


**File-Stream Oriented Programming**이라는 이름에서도 유추해 볼 수 있듯이, 해당 기법은 **File Stream**을 조작하여 실행 흐름을 변경하는 기법이다.


**File Stream**은 C언어와 컴퓨터를 구성하는 다양한 장치에서 사용되며, **FSOP**의 타겟 벡터인 만큼 그 개념을 확실히 이해하고 넘어가야 한다.


## 01. 리눅스에서 파일 입출력 동작


---


만약 C프로그램에서 read 와 write 와 같은 저수준 IO 시스템 콜을 사용한다고 하면, 커널에서는 함수 호출 시점에 파일의 내용을 직접적으로 읽어오지 않는다. 대신 커널 버퍼를 따로 지정하여, 파일의 모든 내용을 읽어 버퍼로 복사한다. 그 후, 커널 버퍼에 위치한 파일의 내용은 다시 유저가 읽고 쓸 수 있게 유저 영역 버퍼에 복사된다. 순차적인 과정은 다음과 같다.

1. read/write 함수 호출
2. kernel 버퍼를 지정한 후, 디스크에 위치한 파일의 모든 내용을 kernel 버퍼에 읽어옴
3. kernel 버퍼로 복사된 데이터는 다시 유저 영역 버퍼로 복사된다.

위 과정의 목적은 하드디스크의 IO 횟수를 줄이기 위해서이며, 적은 하드디스크 접근으로 인해 파일 작업의 성능을 향상시킬 수 있다.


![0](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/0.png)


## 02. File Stream


---


Glibc 에서도 **File Stream**을 호출할 때 위와 비슷한 메커니즘을 사용한다. 


**File Stream**은 기본 파일 디스크립터에 대한 **상위 수준 인터페이스**이다. 리눅스에서 모든 것들은 파일로 표현되므로 C를 사용하여 디스크 파일, 화면, 키보드, 포트 등을 나타낼 수 있다. 비록 파일의 형태나 기능을 다르지만 **모든 stream은 동일하며, 파일에 대한 일관된 인터페이스를 제공한다.**


**stream**은 **open** 작업을 사용하여 파일과 연결될 수 있고, **close** 작업을 사용하여 파일과의 연결을 해제할 수 있다. **write** 작업을 통해 **stream**에 작성된 내용은 일반적으로 **stream buffer**에 누적되어 디스크에 비동기적으로 작성된다. 


사용자가 **fread**나 **fwrite** 함수를 사용하여 파일에 대한 읽기, 쓰기 작업을 한다고 생각해보자. 


먼저 유저 영역에 **Stream Buffer**를 생성한다. 그 후, 위에서 설명한 시스템 콜 호출과 같이 파일의 모든 내용을 디스크에서 커널 버퍼로 옮기고, 다시 Stream Buffer로 읽어온다. 


위 과정이 끝난 후에는 사용자가 원하는 읽기, 쓰기 등의 작업을 수행할 수 있다. 


![1](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/1.png)


## 03. File Structure


---


### 3.1. _IO_FILE


**_IO_FILE** 은 리눅스 시스템의 표준 라이브러리에서 **파일 스트림**을 나타내기 위한 구조체이며, **FILE** 이라는 이름으로 타입 정의가 되어 있다. 즉 **_IO_FILE == FILE** 이다.


해당 구조체의 내부는 다음과 같으며, **fopen** 함수를 사용할 때 힙 영역에 구조체의 공간이 할당된다.


{% raw %}
```c

// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/bits/types/FILE.h#L7
typedef struct _IO_FILE FILE;

// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/bits/types/struct_FILE.h#L49
struct _IO_FILE
{
  int _flags;		/* 파일에 대한 읽기, 쓰기, 추가 권한을 의미 */
  char *_IO_read_ptr;	/* 파일 읽기 버퍼에 대한 포인터 */
  char *_IO_read_end;	/* 파일 읽기 버퍼 주소의 끝을 가리키는 포인터 */
  char *_IO_read_base;	/* 파일 읽기 버퍼 주소의 시작을 가리키는 포인터 */
  char *_IO_write_base;	/* 파일 쓰기 버퍼 주소의 시작을 가리키는 포인터 */
  char *_IO_write_ptr;	/* 쓰기 버퍼에 대한 포인터 */
  char *_IO_write_end;	/* 파일 쓰기 버퍼 주소의 끝을 가리키는 포인터 */
  char *_IO_buf_base;	/* Start of reserve area. */
  char *_IO_buf_end;	/* End of reserve area. */
  /* The following fields are used to support backing up and undo. */
  char *_IO_save_base; /* Pointer to start of non-current get area. */
  char *_IO_backup_base;  /* Pointer to first valid character of backup area */
  char *_IO_save_end; /* Pointer to end of non-current get area. */
  struct _IO_marker *_markers;
  struct _IO_FILE *_chain; 
  /* 
  프로세스에서 _IO_FILE 구조체가 생성되면 _chain 필드를 통해 링크드 리스트를 생성
  링크드 리스트의 헤더는 라이브러리의 전역 변수인 _IO_list_all 에 저장
   */
  int _fileno; /* 파일 디스크립터의 값 */
  int _flags2;
  __off_t _old_offset; /* This used to be _offset but it's too small.  */
  /* 1+column number of pbase(); 0 is unknown. */
  unsigned short _cur_column;
  signed char _vtable_offset;
  char _shortbuf[1];
  _IO_lock_t *_lock;
#ifdef _IO_USE_OLD_IO_FILE
};
```
{% endraw %}


**_flag**

- 파일 스트림에서 `read only` 나 `append` 와 같은 속성들을 기록하는 멤버 변수
- 파일 버퍼링의 상태를 보여준다.

{% raw %}
```c

// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/libio.h#L67
#define _IO_MAGIC         0xFBAD0000 /* Magic number */
#define _IO_MAGIC_MASK    0xFFFF0000
#define _IO_USER_BUF          0x0001 /* Don't deallocate buffer on close. */
#define _IO_UNBUFFERED        0x0002
#define _IO_NO_READS          0x0004 /* Reading not allowed.  */
#define _IO_NO_WRITES         0x0008 /* Writing not allowed.  */
#define _IO_EOF_SEEN          0x0010
#define _IO_ERR_SEEN          0x0020
#define _IO_DELETE_DONT_CLOSE 0x0040 /* Don't call close(_fileno) on close.  */
#define _IO_LINKED            0x0080 /* In the list of all open files.  */
#define _IO_IN_BACKUP         0x0100
#define _IO_LINE_BUF          0x0200
#define _IO_TIED_PUT_GET      0x0400 /* Put and get pointer move in unison.  */
#define _IO_CURRENTLY_PUTTING 0x0800
#define _IO_IS_APPENDING      0x1000
#define _IO_IS_FILEBUF        0x2000
                           /* 0x4000  No longer used, reserved for compat.  */
#define _IO_USER_LOCK         0x8000
```
{% endraw %}


**Read Buffer**

- _IO_read_ptr
	- 현재 read 버퍼의 위치를 나타냄
- _IO_read_end
	- 사용중인 read 버퍼의 끝 주소를 나타냄
- _IO_read_base
	- 사용중인 read 버퍼의 시작 주소를 나타냄

**Write Buffer**

- IO_write_ptr
	- write 버퍼의 현재 주소를 나타냄
- IO_write_end
	- 사용중인 write 버퍼의 끝 주소를 나타냄
- IO_write_base
	- 사용중인 write 버퍼의 시작 주소를 나타냄

**Reserve Buffer**

- IO_buf_base
- IO_buf_end

**_fileno**

- 파일 구조체에 연결된 파일의 파일 디스크립터 번호
- stdin(0), stdout(1), stderr(2) 등이 있다.

### 3.2. _IO_FILE_plus


**_IO_FILE_plus**는 확장된 **FILE** 구조체로, **FILE** 구조체에 **virtual function table(vtable)** 포인터가 추가된 형태다.


![2](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/2.png)


모든 파일의 작업은 FILE 구조체의 vtable을 통해 이루어지며, 파일에 대한 입출력이 발생했을 때 함수를 직접 호출하는 것이 아닌 가상 함수를 호출하게 된다.


이렇게 가상 함수를 사용하는 이유는 **와이드 문자(wchar - 2바이트로 표현되는 문자**)와 같이 특수한 경우에 대한 작업을 재정의하기 위해서이다.


### 3.3. 정리

- **_IO_FILE**
	- 파일 스트림을 나타내는 **구조체**
- **FILE**
	- _IO_FILE 구조체에 대한 **타입**

	{% raw %}
```c
	typedef struct _IO_FILE FILE;
	```
{% endraw %}

- **_IO_FILE_plus**
	- _IO_FILE 구조체에 vtable에 대한 포인터 변수가 추가된 **구조체**

	{% raw %}
```c
	struct _IO_FILE_plus {
		FILE file;
		const struct _IO_jump_t *vtable;
	}
	```
{% endraw %}


## 04. stdin vs _IO_2_1_stdin_


---


### **4.1. stdin**


**stdin**은 표준입력을 의미하며, **stdin** 을 포함하여 **stdout**, **stderr** 또한 **File Stream**으로 표현이 가능하다. **stdin**은 **FILE 타입(_IO_FILE 구조체)**의  **포인터**로 선언되며, **vtable** 이 포함되지 않은 형태이다.


여기서 **stdin**이 **FILE** 타입이 아니라 **FILE *** 타입, 즉 **포인터형**이라는 것을 기억하자


![3](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/3.png)


### **4.2. _IO_2_1_stdin_**


pwnable 문제를 풀다보면 **_IO_2_1_stdin_**이라는 변수를 본 적이 있을 것이다. 


**_IO_2_1_stdin_**은 **_IO_FILE_plus** 구조체 변수로 선언되며, gdb를 사용하여 **_IO_2_1_stdin_**의 정보를 확인하면 다음과 같다. 


![4](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/4.png)


실제 Glibc에서는 매크로를 사용하여 **_IO_2_1_stdin_**, **_IO_2_1_stdout_**, **_IO_2_1_stderr_** 를 선언하고 있으며, 매크로를 풀이한 실제 동작은 다음과 같다.

<details>
  <summary>**Glibc**</summary>


{% raw %}
```c

//https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/libioP.h#L809
#  define FILEBUF_LITERAL(CHAIN, FLAGS, FD, WDP) \
       { _IO_MAGIC+_IO_LINKED+_IO_IS_FILEBUF+FLAGS, \
	 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, (FILE *) CHAIN, FD, \
	 0, _IO_pos_BAD, 0, 0, { 0 }, &_IO_stdfile_##FD##_lock, _IO_pos_BAD,\
	 NULL, WDP, 0 }


// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/stdfiles.c#L52
# define DEF_STDFILE(NAME, FD, CHAIN, FLAGS) \
  static _IO_lock_t _IO_stdfile_##FD##_lock = _IO_lock_initializer; \
  static struct _IO_wide_data _IO_wide_data_##FD \
    = { ._wide_vtable = &_IO_wfile_jumps }; \
  struct _IO_FILE_plus NAME \
    = {FILEBUF_LITERAL(CHAIN, FLAGS, FD, &_IO_wide_data_##FD), \
       &_IO_file_jumps};

DEF_STDFILE(_IO_2_1_stdin_, 0, 0, _IO_NO_WRITES);
DEF_STDFILE(_IO_2_1_stdout_, 1, &_IO_2_1_stdin_, _IO_NO_READS);
DEF_STDFILE(_IO_2_1_stderr_, 2, &_IO_2_1_stdout_, _IO_NO_READS+_IO_UNBUFFERED);

struct _IO_FILE_plus *_IO_list_all = &_IO_2_1_stderr_;
libc_hidden_data_def (_IO_list_all)
```
{% endraw %}



  </details>
{% raw %}
```c
struct _IO_FILE_plus _IO_2_1_stdin_ = {
	0xFBAD2088, // int _flags; = _IO_MAGIC + _IO_LINKED + _IO_IS_FILEBUF + _IO_NO_WRITES
	0, // char *_IO_read_ptr;
	0, // char *_IO_read_end;
	0, // char *_IO_read_base;
	0, // char *_IO_write_base;
	0, // char *_IO_write_ptr;
	0, // char *_IO_write_end;
	0, // char *_IO_buf_base;
	0, // char *_IO_buf_end;
	0, // char *_IO_save_base;
	0, // char *_IO_backup_base;
	0, // char *_IO_save_end;
	0, // struct _IO_marker *_markers;
	0, // struct _IO_FILE *_chain;
	0, // int _fileno;
	0, // int _flags2;
	0xffffffffffffffff, // __off_t _old_offset;
	0,  // unsigned short _cur_column;
	0,  // signed char _vtable_offset;
	"", // char _shortbuf[1];
	&_IO_stdfile_0_lock // _IO_lock_t *_lock;
	0xffffffffffffffff, // __off64_t _offset;
	0, // struct _IO_codecvt *_codecvt;
	&_IO_wide_data_0, // struct _IO_wide_data *_wide_data;
	0 // struct _IO_FILE *_freeres_list;
};

struct _IO_FILE_plus _IO_2_1_stdout_ = {
	...
	&_IO_2_1_stdin_, // struct _IO_FILE *_chain;
	1, // int _fileno;
	&_IO_stdfile_1_lock, // _IO_lock_t *_lock;
	&_IO_wide_data_1, // struct _IO_wide_data *_wide_data;
	...
};

struct _IO_FILE_plus _IO_2_1_stderr_ = {
	...
	&_IO_2_1_stdout_, // struct _IO_FILE *_chain;
	2, // int _fileno;
	&_IO_stdfile_2_lock, // _IO_lock_t *_lock;
	&_IO_wide_data_2, // struct _IO_wide_data *_wide_data;
	...
};

struct _IO_FILE_plus *_IO_list_all = &_IO_2_1_stderr_;

```
{% endraw %}


**_IO_2_1_stdin_**, **_IO_2_1_stdout_**, **_IO_2_1_stderr_**  를 각각 선언


### 4.3. stdin vs _IO_2_1_stdin_


**stdin**과 **_IO_2_1_stdin_** 은 비슷하면서도 다른점이 있다.


먼저 앞서 말했듯이 **stdin**은 **FILE** 타입에 대한 **포인터형 변수**이고, 이에 반해 **_IO_2_1_stdin_**은 **_IO_FILE_plus** 에 대한 **구조체 변수**이다.


즉 **stdin은** 포인터형 변수이기 때문에 gdb에 `p stdin` 명령어를 입력했을 때 주소가 출력되고, **_IO_2_1_stdin_**는 구조체 변수이기 때문에 `p _IO_2_1_stdin_` 을 입력했을 때 구조체의 내용이 출력된다.


![5](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/5.png)


![6](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/6.png)


**stdin**은 **_IO_2_1_stdin_**의 주소를 가지고 있으며, 실제 Glibc에서 stdin과 _IO_2_1_stdin_ 의 관계는 다음과 같다.


{% raw %}
```c

// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/libio.h#L149
extern struct _IO_FILE_plus _IO_2_1_stdin_;
extern struct _IO_FILE_plus _IO_2_1_stdout_;
extern struct _IO_FILE_plus _IO_2_1_stderr_;
```
{% endraw %}


{% raw %}
```c

// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/stdio.c#L33
#include "libioP.h"
#include "stdio.h"

#undef stdin
#undef stdout
#undef stderr
FILE *stdin = (FILE *) &_IO_2_1_stdin_;
FILE *stdout = (FILE *) &_IO_2_1_stdout_;
FILE *stderr = (FILE *) &_IO_2_1_stderr_;
```
{% endraw %}


**stdin** 이 **_IO_2_1_stdin_** 구조체의 주소를 가지고 있기 때문에 아래의 관계가 성립하는 것을 확인할 수 있다.

- **stdin** == **&_IO_2_1_stdin_**

![7](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/7.png)

- ***(struct _IO_FILE_plus *)stdin** == **_IO_2_1_stdin_**

## 05. FILE stream related function


---


**File Stream** 객체를 생성한 후에는 **fopen**, **fread**, **fwrite**, **fclose**  등의 함수를 사용하여 파일 열기, 닫기 및 입출력 작업을 할 수 있다. 실제로 파일 스트림과 관련된 함수의 동작을 살펴보자. 


### 5.1. fopen


대략적인 fopen 함수의 동작은 다음과 같다.


![8](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/8.png)


fopen 함수를 호출 할 때, FILE 구조체에 대한 메모리 공간을 할당한 후, _flag 및 vtable 과 같은 FILE 구조체 멤버를 초기화 한다. 이후, FILE 구조체를 FILE Stream의 연결 리스트에 추가하고, open 시스템 콜을 호출하여 파일 디스크립터를 할당한다.


 


### 5.2. fopen


## 06. 참고

- [https://paper.bobylive.com/Meeting_Papers/HITB/2018/FILE Structures - Another Binary Exploitation Technique - An-Jie Yang.pdf](https://paper.bobylive.com/Meeting_Papers/HITB/2018/FILE%20Structures%20-%20Another%20Binary%20Exploitation%20Technique%20-%20An-Jie%20Yang.pdf)
