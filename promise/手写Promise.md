# 手写Promise

## 简易版本的Promise
promise有三个状态，分别是：
+ pending --> 等待中
+ resolved  --> 操作成功
+ rejected  --> 操作失败

**思路**：
1. 用常量把这三个状态保存起来，便于复用
2. 用变量`that`存储着`this`，在异步操作时，能正确获取`this`。
3. 将value和state分别初始化为`null`和`PENDING`
4. 使用`resolvedCallbacks`和`rejectedCallbacks`两个数组存储`then`中的回调，因为在执行`Promise`时，状态有可能为等待中，那就将then中的回调保存起来，待到状态发生改变时调用。
5. 在`MyPromise`函数体内添加`resolve`和`reject`函数，
6. 这两个函数都需要先判断是否在等待状态，只有在等待态，才能改变
7. 将当前状态修改为对应的状态，并将传入的值赋给`value`
8. 遍历回调数组并执行
9. 执行`Promise`中传入的`fn`，将`resolve`和`reject`作为参数传入到`fn`中，在执行此函数时，可能会出错，那就需要捕获错误并执行`reject`函数
10. 最后到`then`函数，有两个参数`onFulfilled`和`onRejected`。
11. 判断两个参数是否为函数类型，当不是函数类型时，需要创建一个函数赋给对应的参数，同时也实现透传
12. 接着就是一系列的状态判断，当不是等待态时，就去执行相对应的函数；当是等待态，就往回调函数的数组中`push`函数
```
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

function MyPromise(fn) {
  const that = this
  that.value = null
  that.state = PENDING
  that.resolvedCallbacks = []
  that.rejectedCallbacks = []

  function resolve (value) {
    if(that.state === PENDING) {
      that.state = RESOLVED
      that.value = value
      that.resolvedCallbacks.map(cb => cb(that.value))
    }
  }
  function reject (value) {
    if(that.state === PENDING) {
      that.state = REJECTED
      that.value = value
      that.rejectedCallbacks.map(cb => cb(that.value))
    }
  }
  try {
    fn(resolve, reject)
  } catch(e) {
      console.log(e)
  }
}
MyPromise.prototype.then = function (onFulfilled, onRejected) {
  const that = this
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
  onRejected = 
    typeof onRejected === 'function'
      ? onRejected
      : r => {
        throw r
      }
  if(that.state === PENDING) {
    that.resolvedCallbacks.push(onFulfilled)
    that.rejectedCallbacks.push(onRejected)
  }        
  if(that.state === RESOLVED) {
    onFulfilled(that.value)
  }
  if(that.state === REJECTED) {
    onRejected(that.value)
  }
}
```

## 符合Promise/A+ 规范的Promise
基于上面的简易版改造，
+ 首先是对`resolve`函数中传入的参数进行判断是否为`Promise`类型
+ 将`resolve`和`reject`两个函数中函数体代码用`setTimeout`包裹起来，保证函数的执行顺序

在`then`函数中，新增一个变量`promise2`，用于保存新的返回对象。（每个`then`都需返回一个新的`Promise`对象）

先改造判断等待态的，
+ 返回一个新的`Promise`对象，并在`Promise`中传入一个函数
+ 这个函数是向回调数组中`push`函数
+ 在执行函数时可能会遇到错误，就用`try...catch`包裹住
+ 规范规定，执行`onFulfilled`和`onRejected`函数时会返回一个`x`，并且执行`Promise`解决过程。这是为了不同的`Promise`都可以兼容使用。
  
再到改造判断执行态的和判断拒绝态的，
+ 和判断等待态的逻辑基本一致，不同的就是传入的函数需要异步执行
+ 执行态和拒绝态的不同之处就是`x`，一个是`onFulfilled(that.value)`，另一个是`onRejected(that.value)`

最后到了实现兼容多种`Promise`的`resolutionProcedure`函数
+ 首先是规范规定了`x`不能与`promise2`相等，原因是会发生循环引用
+ 然后判断`x`的类型
  + 如果`x`为`Promise`类型
    + `x`处于等待态，`Promise`需保持等待态直至`x`被执行或被拒绝
    + `x`处于其他状态，则用相同的值处理`Promise`
+ 规范规定，`resolve`或`reject`其中一个执行过，就忽略其他
  + 首先创建一个`called`变量来判断是否已经调用过函数
  + 然后判断`x`是否为对象或函数，若都不是，将`x`传入到`resolve`中
  + 如果`x`是对象或函数，先将`x.then`赋值给`then`，然后在去判断`then`的类型，如果不是函数类型就将`x`传入到`resolve`中
  + 如果`then`是函数类型，将`x`作为函数的作用域`this`来调用，并将`resolvePromise`和`rejectPromise`两个回调函数作为参数传递。两个回调函数都需要判断是否已经执行过函数，然后进行相应的逻辑。
  + 如果执行代码过程中出现错误，将错误传入到`reject`函数

```
const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

function MyPromise(fn) {
  const that = this;
  that.state = PENDING;
  that.value = null;
  that.resolvedCallbacks = [];
  that.rejectedCallbacks = [];

  function resolve(value) {

    if (value instanceof MyPromise) {
      return value.then(resolve, reject);
    }
    setTimeout(() => {
      if (that.state === PENDING) {
        that.state = RESOLVED;
        that.value = value;
        that.resolvedCallbacks.map(cb => cb(that.value));
      }
    }, 0);
  }
  function reject(value) {
    setTimeout(() => {
      if (that.state === PENDING) {
        that.state = REJECTED;
        that.value = value;
        that.rejectedCallbacks.map(cb => cb(that.value));
      }
    }, 0);
  }
  try {
    fn(resolve, reject);
  } catch (e) {
    console.log(e);
  }
}
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  const that = this;
  let promise2;
  onFulfilled = typeof onFulfilled === "function" ? onFulfilled : v => v;
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : r => {
          throw r;
        };
  if (that.state === PENDING) {
    return (promise2 = new MyPromise((resolve, reject) => {
      that.resolvedCallbacks.push(() => {
        try {
          const x = onFulfilled(that.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });
      that.rejectedCallbacks.push(() => {
        try {
          const x = onRejected(that.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (r) {
          reject(r);
        }
      });
    }));

  }
  if (that.state === RESOLVED) {
    retrun(
      (promise2 = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(that.value);
            resolutionProcedure(promise2, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        }, 0);
      }))
    );
  }
  if (that.state === REJECTED) {
    return (promise2 = new MyPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          const x = onRejected(that.value);
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
    }));
  }
};

function resolutionProcedure(promise2, x, resolve, reject) {
  if (promise2 === x) {
    return reject(new TypeError("Error"));
  }
  if (x instanceof MyPromise) {
    x.then(function(value) {
      resolutionProcedure(promise2, value, resolve, reject);
    }, reject);

    let called = false;
    if (x !== null && (typeof x === "object" || typeof x === "function")) {
      try {
        let then = x.then;
        if (typeof then === "functon") {
          then.call(
            x,
            y => {
              if (called) return;
              called = true;
              resolutionProcedure(promise2, y, resolve, reject);
            },
            e => {
              if (called) return;
              called = true;
              reject(e);
            }
          );
        } else {
          resolve(x);
        }
      } catch (e) {
        if (called) return;
        called = true;
        reject(e);
      }
    } else {
      resolve(x);
    }
  }
}
```