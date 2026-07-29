---
title: EventLoop
icon: gears
order: 1
category:
  - JavsScript
tag:
  - JavsScript

---
## 执行机制（Event Loop）

```text
┌─────────────────────────────────────────────┐
│            JavaScript 引擎线程              │
│  ┌──────────────────────────────────────┐  │
│  │        调用栈 (Call Stack)           │  │
│  │  • 同步代码执行                      │  │
│  │  • 一个栈帧对应一个函数调用          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │         内存堆 (Memory Heap)         │  │
│  │  • 存储对象、闭包、变量              │  │
│  │  • 由垃圾回收器管理                  │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────┐
│             Web APIs / C++ APIs             │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │定时器   │ │DOM事件  │ │AJAX/Fetch    │  │
│  │setTimeout│ │click    │ │XMLHttpRequest│  │
│  └─────────┘ └─────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ 文件I/O │ │ 数据库  │ │ 网络请求     │  │
│  │ fs.read │ │ MongoDB │ │ http.request │  │
│  └─────────┘ └─────────┘ └──────────────┘  │
└─────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────┐
│           任务队列 (Task Queues)            │
│  ┌──────────────────────────────────────┐  │
│  │        宏任务队列 (Macrotask)        │  │
│  │  • setTimeout/setInterval回调        │  │
│  │  • DOM事件回调                       │  │
│  │  • I/O回调                           │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │       微任务队列 (Microtask)         │  │
│  │  • Promise.then/catch/finally        │  │
│  │  • queueMicrotask                    │  │
│  │  • MutationObserver                  │  │
│  │  • process.nextTick (Node.js)        │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │      requestAnimationFrame队列       │  │
│  │  • 与浏览器渲染周期同步              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ↑↓
┌─────────────────────────────────────────────┐
│             事件循环 (Event Loop)           │
│  • 持续检查调用栈是否为空                  │
│  • 按优先级从队列取任务到调用栈执行        │
└─────────────────────────────────────────────┘
```



### 1. 调用栈(Call Stack)

#### 1.1 栈帧结构

```javascript
function foo() {
  const a = 1;
  const b = 2;
  return bar(a + b);
}

function bar(sum) {
  console.log(sum);
  return sum * 2;
}

foo();

// 调用栈状态变化：
// 1. [empty]
// 2. [foo]           // 调用 foo()
// 3. [foo, bar]      // foo 内部调用 bar()
// 4. [foo, bar, console.log]  // bar 内部调用 console.log()
// 5. [foo, bar]      // console.log 返回
// 6. [foo]           // bar 返回
// 7. [empty]         // foo 返回
```

#### 1.2 栈溢出和尾调用优化

```javascript
// ❌ 普通递归会导致栈溢出
function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1);  // 需要保留 n 在栈中
}

// ✅ 尾递归优化（ES6严格模式）
function factorialTail(n, acc = 1) {
  if (n === 1) return acc;
  return factorialTail(n - 1, n * acc);  // 无需保留当前栈帧
}

// 现代引擎的尾调用优化：
// 1. 函数最后一步是函数调用
// 2. 调用后不需要当前栈帧的变量
// 3. 直接复用当前栈帧，避免栈增长
```

### 2.宏任务（Macrotask）vs 微任务（Microtask）

浏览器的事件循环并非只有一个队列，而是有两个：

#### 1.宏任务队列（Macrotask Queue）

- setTimeout

- setInterval

- setImmediate(Node-只在 Node.js 中存在，用于在当前事件循环结束时立即执行回调)

- I/O

  指输入/输出操作（这些操作通常是**异步非阻塞**的）如：

  - 文件读写
  - 网络请求
  - 数据库查询
  - 用户输入

- UI Rendering

  浏览器重新绘制和重新布局的过程。JavaScript 执行会阻塞渲染，因此长时间运行的脚本会影响页面响应。

  这些任务在实践中的优先级：

  ::: important

  同步代码 > process.nextTick > Promises > setImmediate > 定时器（setTimeout/setInterval） > I/O 回调 > UI渲染
  
  :::

#### 2. 微任务队列（Microtask Queue）

- Promise.then/catch/finally
- process.nextTick（Node，优先级最高）
- MutationObserver（用于**监视 DOM 树的变化**）

#### 3. 浏览器Event Loop的标准流程

1. 执行栈（Call Stack）选择最先进入的宏任务（通常是`<script>`整体代码）执行。
2. 执行过程中，遇到宏任务抛入宏任务队列，遇到微任务抛入微任务队列。
3. 关键点：当前宏任务执行完毕后，**立即清空微任务队列**（依次执行所有微任务，直到队列为空）。
4. （如果有）执行UI渲染更新。
5. 从宏任务队列中取出下一个宏任务执行。
6. 回到步骤2。

### 3. Node.js时间循环阶段 

```javascript
// Node.js libuv 事件循环的6个阶段
   ┌───────────────────────────┐
┌─>│           timers          │ 执行 setTimeout/setInterval 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ 执行延迟到下一个循环的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ 内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │ 检索新的 I/O 事件
│  │                           │ 执行 I/O 相关回调（大部分回调）
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ 执行 setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │ 执行关闭事件的回调
   └───────────────────────────┘
   
// Node.js 微任务执行时机：
// 1. 每个阶段切换时
// 2. nextTick 队列在微任务之前执行
```



### 4. 逻辑测试

::: code-tabs#shell

@tab javascript

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => {
    console.log('3');
  })
}, 0);

new Promise((resolve) => {
  console.log('4'); // Promise 构造函数是同步执行的
  resolve();
}).then(() => {
  console.log('5');
})

console.log('6');

解析：
1. 同步代码：1 -> 4 -> 6
2. 清空微任务：5
3. (渲染更新...)
4. 执行下一个宏任务(setTimeout): 2
5. setTimeout里产生了一个新的微任务，执行它：3

=> 1,4,6,5,2,3
```

:::