# Valid Parentheses有效的括号
**题目：** 给定一个只包括`(`，`)`，`{`，`}`，`[`，`]`的字符串，判断字符串是否有效。

有效的字符串满足：
+   左括号必须用相同类型的右括号闭合。
+   左括号必须必须以正确顺序闭合。

时间复杂度为`O(n)`,使用栈的思想

**思路:**
1. 初始化stack，创建一个obj对象，
2. 将传入的字符串进行遍历，
3. 首先，若stack的length为空，将s[0]放入到stack中
4. 然后，stack不为空，进行判断，s[1]的值若等于obj[stack[0]]的值,就是匹配了，将stack的最后一个元素删掉
5. 若不相等，继续将其放进stack中，进行下一次的循环
6. 重复上述操作，直至循环结束
```
var isValid = function(s) {
    var stack = []
    var obj = {
        '(': ')',
        '{': '}',
        '[': ']'
    }
    for(let i=0; i < s.length;i++){
     
        if(!stack.length){
          stack.push(s[i])
        }else{
          if(s[i] === obj[stack[stack.length-1]]) {
            stack.pop()
          }else{
            stack.push(s[i])
          }
        }
    }
    return !stack.length
};
console.log(isValid('()'))
```