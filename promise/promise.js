const PENDING = "pending";
const RESOLVED = "resolved";
const REJECTED = "rejected";

function MyPromise(fn) {
  const that = this;
  that.state = PENDING;
  that.value = null;
  that.resolvedCallbacks = [];
  that.rejectedCallbacks = [];
  // 为了保证函数的执行顺序，将两个函数体使用setTimeout包裹起来
  function resolve(value) {
    // 先判断传入的值是否为	Promise类型
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
    // 返回一个新的Promise对象，并在Promise中传入了一个函数
    // 想之前一样向回调数组中push函数
    // 在执行函数的过程中，可能会出现错误，所以使用try...catch包裹
    //规范规定，执行onFulfilled或者onRejected函数时会返回一个x，并且执行Promise的解决过程，这是为了不同的Promise都能兼容使用。
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

export default MyPromise