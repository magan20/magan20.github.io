---
layout: post
date: 2024-04-30
title: "FSOP(File Stream Oriented Programming) 공격기법 이해 - (1) File Structure"
tags: [_IO_FILE, linux, pwnable, wargame, 공격기법, ]
categories: [Pwnable, ]
---


## 0. 개요


해당 글은 **FSOP(File-Stream Oriented Programming)**라는 기법을 이해하기 위한 기초 배경 지식을 공부하고, 실제 공격 원리를 이해하기 위해 작성되었다.


**File-Stream Oriented Programming**이라는 이름에서도 유추해 볼 수 있듯이, 해당 기법은 **File Stream**을 조작하여 실행 흐름을 변경하는 기법이다.


**File Stream**은 C언어와 컴퓨터를 구성하는 다양한 장치에서 사용되며, **FSOP**의 타겟 벡터인 만큼 그 개념을 확실히 이해하고 넘어가야 한다.


## 1. 리눅스에서 파일 입출력 동작


---


만약 C프로그램에서 read 와 write 와 같은 저수준 IO 시스템 콜을 사용한다고 하면, 커널에서는 함수 호출 시점에 파일의 내용을 직접적으로 읽어오지 않는다. 대신 커널 버퍼를 따로 지정하여, 파일의 모든 내용을 읽어 버퍼로 복사한다. 그 후, 커널 버퍼에 위치한 파일의 내용은 다시 유저가 읽고 쓸 수 있게 유저 영역 버퍼에 복사된다. 순차적인 과정은 다음과 같다.

1. read/write 함수 호출
2. kernel 버퍼를 지정한 후, 디스크에 위치한 파일의 모든 내용을 kernel 버퍼에 읽어옴
3. kernel 버퍼로 복사된 데이터는 다시 유저 영역 버퍼로 복사된다.

위 과정의 목적은 하드디스크의 IO 횟수를 줄이기 위해서이며, 적은 하드디스크 접근으로 인해 파일 작업의 성능을 향상시킬 수 있다.


![0](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/0.png)


## 2. File Stream


---


Glibc 에서도 **File Stream**을 호출할 때 위와 비슷한 메커니즘을 사용한다. 


**File Stream**은 기본 파일 디스크립터에 대한 **상위 수준 인터페이스**이다. 리눅스에서 모든 것들은 파일로 표현되므로 C를 사용하여 디스크 파일, 화면, 키보드, 포트 등을 나타낼 수 있다. 비록 파일의 형태나 기능을 다르지만 **모든 stream은 동일하며, 파일에 대한 일관된 인터페이스를 제공한다.**


**stream**은 **open** 작업을 사용하여 파일과 연결될 수 있고, **close** 작업을 사용하여 파일과의 연결을 해제할 수 있다. **write** 작업을 통해 **stream**에 작성된 내용은 일반적으로 **stream buffer**에 누적되어 디스크에 비동기적으로 작성된다. 


사용자가 **fread**나 **fwrite** 함수를 사용하여 파일에 대한 읽기, 쓰기 작업을 한다고 생각해보자. 


먼저 유저 영역에 **Stream Buffer**를 생성한다. 그 후, 위에서 설명한 시스템 콜 호출과 같이 파일의 모든 내용을 디스크에서 커널 버퍼로 옮기고, 다시 Stream Buffer로 읽어온다. 


위 과정이 끝난 후에는 사용자가 원하는 읽기, 쓰기 등의 작업을 수행할 수 있다. 


![1](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/1.png)


## 3. File Structure


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


### 3.2. _IO_FILE_plus


**_IO_FILE_plus**는 확장된 **FILE** 구조체로, **FILE** 구조체에 **virtual function table(vtable)** 포인터가 추가된 형태다.


{% raw %}
```c
**gef➤**  **ptype struct _IO_FILE_plus
type = struct _IO_FILE_plus {
    FILE file;
    const struct _IO_jump_t *vtable;
}**
```
{% endraw %}


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


## 4. stdin vs _IO_2_1_stdin_


---


### **4.1. stdin**


**stdin**은 표준입력을 의미하며, **stdin** 을 포함하여 **stdout**, **stderr** 또한 **File Stream**으로 표현이 가능하다. **stdin**은 **FILE 타입(_IO_FILE 구조체)**의  **포인터**로 선언되며, **vtable** 이 포함되지 않은 형태이다.


여기서 **stdin**이 **FILE** 타입이 아니라 **FILE *** 타입, 즉 **포인터형**이라는 것을 기억하자


{% raw %}
```c
gef➤  p stdin
$3 = (FILE *) 0x7ffff7faaaa0 <**_IO_2_1_stdin_**>
```
{% endraw %}


### **4.2 _IO_2_1_stdin_**


pwnable 문제를 풀다보면 **_IO_2_1_stdin_**이라는 변수를 본 적이 있을 것이다. 


**_IO_2_1_stdin_**은 **_IO_FILE_plus** 구조체 변수로 선언되며, gdb를 사용하여 **_IO_2_1_stdin_**의 정보를 확인하면 다음과 같다. 


**stdin**과 달리 **vtable**이 추가되어 있는 것을 확인할 수 있다.


{% raw %}
```c
gef➤  p _IO_2_1_stdin_
$4 = {
  file = {
    _flags = 0xfbad2088,
    _IO_read_ptr = 0x0,
    _IO_read_end = 0x0,
    _IO_read_base = 0x0,
    _IO_write_base = 0x0,
    _IO_write_ptr = 0x0,
    _IO_write_end = 0x0,
    _IO_buf_base = 0x0,
    _IO_buf_end = 0x0,
    _IO_save_base = 0x0,
    _IO_backup_base = 0x0,
    _IO_save_end = 0x0,
    _markers = 0x0,
    _chain = 0x0,
    _fileno = 0x0,
    _flags2 = 0x0,
    _old_offset = 0xffffffffffffffff,
    _cur_column = 0x0,
    _vtable_offset = 0x0,
    _shortbuf = "",
    _lock = 0x7ffff7faca80 <**_IO_stdfile_0_lock**>,
    _offset = 0xffffffffffffffff,
    _codecvt = 0x0,
    _wide_data = 0x7ffff7faab80 <**_IO_wide_data_0**>,
    _freeres_list = 0x0,
    _freeres_buf = 0x0,
    __pad5 = 0x0,
    _mode = 0x0,
    _unused2 = '\000' <repeats 19 times>
  },
  vtable = 0x7ffff7fa7600 <**_IO_file_jumps**>
}
```
{% endraw %}


실제 Glibc에서는 매크로를 사용하여 **_IO_2_1_stdin_**, **_IO_2_1_stdout_**, **_IO_2_1_stderr_** 를 선언하고 있으며, 매크로를 풀이한 실제 동작은 다음과 같다.


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


**_IO_2_1_stdin_**, **_IO_2_1_stdout_**, **_IO_2_1_stderr_**  를 차례로 선언하면서, 자신의 멤버 변수인 **_chain**의 값을 이전에 선언된 구조체 변수의 주소로 설정한다.


그리고, 3개의 구조체 변수가 다 선언된 후에는 **_IO_FILE_plus** 포인터 변수인 **_IO_list_all** 변수를 선언하여


**_IO_2_1_stderr_** 의 주소를 넘겨준다.


즉, 다음과 같이 연결리스트 형식으로 관리되며, **_IO_list_all** 포인터 변수를 사용하여 모든 변수에 접근할 수 있다.


{% raw %}
```c
_IO_2_1_stdin_._chain = 0;
_IO_2_1_stdout_._chain = &_IO_2_1_stdin_;
_IO_2_1_stderr_._chain = &_IO_2_1_stdout_;
_IO_list_all = &_IO_2_1_stderr;
```
{% endraw %}


### 4.3. stdin vs _IO_2_1_stdin_


**stdin**과 **_IO_2_1_stdin_**은 비슷하면서도 다른점이 있다.


먼저 앞서 말했듯이 **stdin**은 **FILE** 타입에 대한 **포인터형 변수**이고, 이에 반해  **_IO_2_1_stdin_**은 **_IO_FILE_plus** 에 대한 **구조체 변수**이다.


즉 **stdin은** 포인터형 변수이기 때문에 gdb에 `p stdin` 명령어를 입력했을 때 주소가 출력되고, **_IO_2_1_stdin_**는 구조체 변수이기 때문에 `p _IO_2_1_stdin_` 을 입력했을 때 구조체의 내용이 출력된다.


![2](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/2.png)


![3](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/3.png)


**stdin**은 **_IO_2_1_stdin_**의 주소를 가지고 있으며, 실제 Glibc에서 stdin과 **_IO_2_1_stdin_** 의 관계는 다음과 같다.


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

{% raw %}
```c
gef➤  p stdin
$6 = (FILE *) 0x7ffff7faaaa0 <**_IO_2_1_stdin_**>
gef➤  p &_IO_2_1_stdin_
$7 = (struct _IO_FILE_plus *) 0x7ffff7faaaa0 <**_IO_2_1_stdin_**>
```
{% endraw %}


### 4.4. 정리

- **stdin**
	- **FILE(=_IO_FILE)** 포인터 변수
	- **_IO_2_1_stdin_**변수의 주소를 가지고 있음
- **_IO_2_1_stdin_**
	- **_IO_FILE_plus** 구조체 변수
	- **_IO_list_all** 변수에 연결리스트로 이어져 있음

## 5. FILE stream related function


---


**File Stream** 객체를 생성한 후에는 **fopen**, **fread**, **fwrite**, **fclose**  등의 함수를 사용하여 파일 열기, 닫기 및 입출력 작업을 할 수 있다. 


파일 스트림과 관련된 함수의 실제 동작을 살펴보자. 


### 5.1. fopen


대략적인 **fopen** 함수의 동작은 다음과 같다.


![4](/assets/img/2024-04-30-FSOP(File-Stream-Oriented-Programming)-공격기법-이해---(1)-File-Structure.md/4.png)


**fopen** 함수를 호출 할 때, **FILE** 구조체에 대한 메모리 공간을 할당한 후, **_flag** 및 **vtable** 과 같은 **FILE** 구조체 멤버를 초기화 한다. 이후, **FILE** 구조체를 **FILE Stream**의 연결 리스트에 추가하고, **open** 시스템 콜을 호출하여 파일 디스크립터를 할당한다.


> **fopen**


**fopen**에 대한 첫 번째 선언은 **include/stdio.h** 에서 확인할 수 있다.


**fopen**은 매크로로 선언되어 있으며, 실제 구현은 **_IO_new_fopen** 함수에 있다.


{% raw %}
```c
// https://elixir.bootlin.com/glibc/glibc-2.34/source/include/stdio.h#L190
#   define fopen(fname, mode) _IO_new_fopen (fname, mode)
```
{% endraw %}


 


> **_IO_new_fopen**


**_IO_new_fopen**은 다시 **__fopen_internal**함수를 호출한다.


{% raw %}
```c
// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/iofopen.c#L84
FILE *_IO_new_fopen (const char *filename, const char *mode)
{
  return __fopen_internal (filename, mode, 1);
}
```
{% endraw %}


> **__fopen_internal**


**__fopen_internal** 함수에서 하는 일은 다음과 같다.


{% raw %}
```c
// https://elixir.bootlin.com/glibc/glibc-2.34/source/libio/iofopen.c#L56
FILE * __fopen_internal (const char *filename, const char *mode, int is32)
{
  struct locked_FILE
  {
    struct _IO_FILE_plus fp;
    _IO_lock_t lock;
    struct _IO_wide_data wd;
  } *new_f = (struct locked_FILE *) malloc (sizeof (struct locked_FILE));

  if (new_f == NULL)
    return NULL;
    
  new_f->fp.file._lock = &new_f->lock;

  _IO_no_init (&new_f->fp.file, 0, 0, &new_f->wd, &_IO_wfile_jumps);
  _IO_JUMPS (&new_f->fp) = &_IO_file_jumps;
  _IO_new_file_init_internal (&new_f->fp);
  if (_IO_file_fopen ((FILE *) new_f, filename, mode, is32) != NULL)
    return __fopen_maybe_mmap (&new_f->fp.file);

  _IO_un_link (&new_f->fp);
  free (new_f);
  return NULL;
}
```
{% endraw %}


**_IO_FILE_plus**, **_IO_lock_t**, **_IO_wide_data** 구조체 변수를 포함하고 있는 **locked_FILE** 구조체를 선언하고, 그에 대한 포인터 변수 **new_f**를 선언한 후, **malloc**을 사용하여 공간을 할당한다. ( **Allocate FILE Structure** )


{% raw %}
```c
  struct locked_FILE
  {
    struct _IO_FILE_plus fp;
    _IO_lock_t lock;
    struct _IO_wide_data wd;
  } *new_f = (struct locked_FILE *) malloc (sizeof (struct locked_FILE));
```
{% endraw %}


`_IO_no_init` 함수는 `new_f->fp.file` 멤버 변수와 `new_f->fp.file._wide_data` 멤버 변수의 값을 초기화한다.


{% raw %}
```c
  _IO_no_init (&new_f->fp.file, 0, 0, &new_f->wd, &_IO_wfile_jumps);
```
{% endraw %}


이후, `new_f->fp.file->vtable` 에 `_IO_jump_t` 구조체 변수인 `_IO_file_jumps` 의 주소를 할당하고, `new_f->fp.file` 의 `_offset` , `_flags` , `_fileno` 를 초기화한다.( **Initial the FILE Structure** )


{% raw %}
```c
  _IO_JUMPS (&new_f->fp) = &_IO_file_jumps;
  // new_f->fp->vtable = (struct _IO_jump_t *)&_IO_file_jumps;
  _IO_new_file_init_internal (&new_f->fp);

```
{% endraw %}


> **_IO_file_fopen** 


해당 함수에서는 `r` , `w` , `a` 등의 `mode` 를 확인한 후, 다시 `_IO_file_open` 함수를 호출한다.


{% raw %}
```c
// https://elixir.bootlin.com/glibc/glibc-2.27/source/libio/fileops.c#L212
libc_hidden_ver (_IO_new_file_fopen, _IO_file_fopen)

_IO_FILE * _IO_new_file_fopen (_IO_FILE *fp, const char *filename, const char *mode, int is32not64)
{
  int oflags = 0, omode;
  int read_write;
  int oprot = 0666;
  int i;
  _IO_FILE *result;
  const char *cs;
  const char *last_recognized;

  if (_IO_file_is_open (fp))
    return 0;
  switch (*mode)
    {
    case 'r':
      omode = O_RDONLY;
      read_write = _IO_NO_WRITES;
      break;
    case 'w':
      omode = O_WRONLY;
      oflags = O_CREAT|O_TRUNC;
      read_write = _IO_NO_READS;
      break;
    case 'a':
      omode = O_WRONLY;
      oflags = O_CREAT|O_APPEND;
      read_write = _IO_NO_READS|_IO_IS_APPENDING;
      break;
    default:
      __set_errno (EINVAL);
      return NULL;
    }
  last_recognized = mode;
  for (i = 1; i < 7; ++i)
    {
      switch (*++mode)
	{
	case '\0':
	  break;
	case '+':
	  omode = O_RDWR;
	  read_write &= _IO_IS_APPENDING;
	  last_recognized = mode;
	  continue;
	case 'x':
	  oflags |= O_EXCL;
	  last_recognized = mode;
	  continue;
	case 'b':
	  last_recognized = mode;
	  continue;
	case 'm':
	  fp->_flags2 |= _IO_FLAGS2_MMAP;
	  continue;
	case 'c':
	  fp->_flags2 |= _IO_FLAGS2_NOTCANCEL;
	  continue;
	case 'e':
	  oflags |= O_CLOEXEC;
	  fp->_flags2 |= _IO_FLAGS2_CLOEXEC;
	  continue;
	default:
	  /* Ignore.  */
	  continue;
	}
      break;
    }

  result = _IO_file_open (fp, filename, omode|oflags, oprot, read_write,
			  is32not64);

	...
	
  return result;
}
```
{% endraw %}


> **_IO_file_open**


`_IO_file_open` 함수에서는 실제로 `open` 시스템콜을 호출하여 파일을 열고 파일 디스크립터 번호를 할당한다. ( **Open File** )


{% raw %}
```c
// https://elixir.bootlin.com/glibc/glibc-2.27/source/libio/fileops.c#L181
_IO_FILE * _IO_file_open (_IO_FILE *fp, const char *filename, int posix_mode, int prot, int read_write, int is32not64)
{
  int fdesc;
  if (__glibc_unlikely (fp->_flags2 & _IO_FLAGS2_NOTCANCEL))
    fdesc = __open_nocancel (filename,
			     posix_mode | (is32not64 ? 0 : O_LARGEFILE), prot);
  else
    fdesc = __open (filename, posix_mode | (is32not64 ? 0 : O_LARGEFILE), prot);
  if (fdesc < 0)
    return NULL;
  fp->_fileno = fdesc;
	
	...
  
  return fp;
}
```
{% endraw %}


### 5.2. fopen


## 6. 참고

- [https://paper.bobylive.com/Meeting_Papers/HITB/2018/FILE Structures - Another Binary Exploitation Technique - An-Jie Yang.pdf](https://paper.bobylive.com/Meeting_Papers/HITB/2018/FILE%20Structures%20-%20Another%20Binary%20Exploitation%20Technique%20-%20An-Jie%20Yang.pdf)
