---
title: JavaScript语言底层与V8机制
icon: gears
order: 98
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



### 1.宏任务（Macrotask）vs 微任务（Microtask）

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

- Promise.then
- process.nextTick（Node，优先级最高）
- MutationObserver（用于**监视 DOM 树的变化**）

#### 3. 浏览器Event Loop的标准流程

1. 执行栈（Call Stack）选择最先进入的宏任务（通常是`<script>`整体代码）执行。
2. 执行过程中，遇到宏任务抛入宏任务队列，遇到微任务抛入微任务队列。
3. 关键点：当前宏任务执行完毕后，**立即清空微任务队列**（依次执行所有微任务，直到队列为空）。
4. （如果有）执行UI渲染更新。
5. 从宏任务队列中取出下一个宏任务执行。
6. 回到步骤2。

### 4. Node.js时间循环阶段 

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



### 5. 逻辑测试

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

## V8内存管理与垃圾回收（GC）

V8的堆内存主要分为**新生代(New Space)**和**老生代(Old Space)**。

1. 新生代（New Space）- 存活时间短的对象

     - 场景：函数内部的临时变量，用完即弃。
     - 算法：Scavenge(清除算法)（一种“复制”算法）
     - 特点：
       - 绝大多数对象在这里诞生并很快死去
       - 回收非常频繁，速度极快
       - 空间被分为两个相等的半空间（Semi-space）：Form空间（使用中）和To空间（闲置）
     - 原理：将空间一分为二：From空间和To空间。
       1. 新对象分配在From。
       2. GC开始时，检查From里的存活对象，复制到To。
       3. 清空From。
       4. From和To角色互换。
     - 特点：牺牲空间换时间（总有一半空间闲置），但因为存活对象少，复制成本极低，速度极快，只处理存活对象，且复制过程自然完成了内存整理，没有碎片
2. 老生代（Old Space）- 常驻内存的对象

     - 场景：全局对象、闭包引用的变量、经历过多次（经历过至少一次，通常为两次）Scavenge依然存活的对象（晋升）、一些大对象可能会被直接分配到这里。
     - 算法：标记-清除（Mark-Sweep）& 标记-整理（Mark-Compact）
       1. 标记：遍历所有对象，标记活着的对象。
       2. 清除：清除没被标记的垃圾。（会产生内存碎片）
       3. 整理：(为了解决内存碎片)将活着的对象往内存一端移动，连续排列。
     - 优化：为了避免GC时全停顿（Stop-The-World），V8使用了**增量标记（Incremental Marking）**，即把标记过程拆分成小任务，穿插在JS执行间隙进行。
3. 常见的内存泄漏场景

     - 意外的全局变量：忘记写let/const
     - 被遗忘的定时器：setInterval没有clearInterval
     - 闭包：函数返回了一个内部函数，导致外部函数的变量无法被回收
     - DOM引用：JS中保留了DOM节点的引用，即使从页面移除该节点，它依然占用内存
4. 工作流程与晋升
    一个新对象 {} 的生命周期通常如下：
    1. 在新生代的From空间被分配。
    2. 当新生代需要进行GC（空间将满时）时，V8会启动一次 Minor GC（副垃圾回收），使用Scavenge算法。
    3. 如果这个对象在这次GC中存活，它会被复制到To空间。From和To空间交换。
    4. 如果这个对象在新生代中经历了几轮GC（通常是1到2次）后仍然存活，它会被认为是“老”对象，从新生代晋升到老生代。
    5. 当老生代的空间占用达到一定阈值时，V8会启动一次 Major GC（主垃圾回收），使用标记-清除/整理算法来清理整个老生代（有时也包括大对象空间、代码空间等）。这个过程也称为 Full GC，可能会引起明显的停顿。
5. 其它重要的堆空间

      - 大对象空间 (Large Object Space)：存放体积非常大的对象（例如巨大的数组或字符串）。这类对象不会在新生代中分配，而是直接在这里创建，也不会被Scavenge算法移动。由老生代的GC管理。
      - 代码空间 (Code Space)：专门存放经过即时编译（JIT）后生成的机器代码。这是可执行内存。
      - Map空间 (Map Space)：专门存放对象的隐藏类（Hidden Class 或 Map）。隐藏类是V8实现快速属性访问的关键数据结构，将它们集中存放有利于管理和回收。

## 异步编程底层

1. Promise原理
Promise本质是一个有限状态机+观察者模式。
- 三个状态：PENGDING，FULFILLED，REJECTED。状态一旦改变不可逆。
- then的链式调用：then方法必须返回一个新的Promise。如果回调函数的返回值是一个普通值，新Promise状态为fulfilled；如果是Promise，新Promise跟随该Promise的状态。
```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';  // 状态：pending/fulfilled/rejected
    this.value = undefined;   // 成功时的值
    this.reason = undefined;  // 失败时的原因
    this.onFulfilledCallbacks = [];  // 成功回调队列
    this.onRejectedCallbacks = [];   // 失败回调队列
    
    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        // 执行所有成功回调
        this.onFulfilledCallbacks.forEach(cb => cb());
      }
    };
    
    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        // 执行所有失败回调
        this.onRejectedCallbacks.forEach(cb => cb());
      }
    };
    
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
  
  then(onFulfilled, onRejected) {
    // 参数标准化处理
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e };
    
    // 返回新的 Promise 实现链式调用
    const promise2 = new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };
      
      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };
      
      if (this.state === 'fulfilled') {
        handleFulfilled();
      } else if (this.state === 'rejected') {
        handleRejected();
      } else {
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
    
    return promise2;
  }
  
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  
  finally(callback) {
    return this.then(
      value => MyPromise.resolve(callback()).then(() => value),
      reason => MyPromise.resolve(callback()).then(() => { throw reason })
    );
  }
  
  static resolve(value) {
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }
  
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
  
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          value => {
            results[index] = value;
            if (++count === promises.length) resolve(results);
          },
          reject
        );
      });
    });
  }
  
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }
  
  if (x instanceof MyPromise) {
    x.then(y => resolvePromise(promise2, y, resolve, reject), reject);
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then;
    try {
      then = x.then;
    } catch (error) {
      return reject(error);
    }
    
    if (typeof then === 'function') {
      let called = false;
      try {
        then.call(
          x,
          y => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } catch (error) {
        if (!called) reject(error);
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}
```
2. Async/Await原理
    async/await实际上是**Generator函数+自动执行器**的语法糖
    - Generator：可以暂停（yield）和恢复（next）执行的函数。
    - 自动执行器（co模块思想）:
      1. 执行Generator，得到一个Iterator
      2. 调用next()得到{ value: Promise, done: false }
      3. 等待 value 这个 Promise 完成
      4. Promise 完成后，将结果传回 Generator: iterator.next(result)
      5. 重复知道 done: true

## 元编程与原型链

1. 原型链

   ![原型链](/assets/image/yuanxinglian.webp)

2. 