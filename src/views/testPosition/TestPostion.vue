<template>
  <div class="test-postion">
    <div class="box1">
      <div class="box2">
        <div class="box3">
          <div class="box4">
            <div class="box5">
              <div class="box6">
                <div class="box" ref="box"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'TestPostion',
    data() {
      return {
        
      }
    },
    methods: {
      /**
       * 查找DOM 的 style属性
       */
      getStyleVal(node, styleStr) { 
        let style;
        // let parent = node.parentNode;
        if (node === document) { //window.getComputedStyle方法 不可调用 document 我们不对他查询
          style = null;
        }else {
          style = window.getComputedStyle(node)[styleStr];
        }
        return style;
      },      
      /**
       * 去除单位得到数值
       */
      matchNum(str) {
        const regexp = /\d+(\.\d+)?/g; //匹配数字
        return Number((str+"").match(regexp)[0]) >>> 0;
      },
      /**
       * getDom 递归检测DOM 确定定位多次赋值 得到总真实offsetList 和 offsetTop
       * key: 可选 offsetList 和 offsetTop
       */
      getDom(node, key) {
        let _this = this;
        let value = 0; //储存值

        let parent = node.parentNode;
        let uncertain = ["static", "initial", "revert" , "unset" ]; //定位被确定
        function dg(node, parent) {
          if (parent === document) { //到达documen时候立即停止
            return value;
          }

          if (!~uncertain.indexOf(_this.getStyleVal(parent, "position"))) { 
            if (key === "offsetLeft") {
              value += node[key] + _this.matchNum(_this.getStyleVal(parent, "borderLeft"));
            }else if (key === "offsetTop") {
              value += node[key] + _this.matchNum(_this.getStyleVal(parent, "borderTop"));
            }
            return dg(parent, parent.parentNode); //多次上级访问找找到父节确定定位的元素 做 坐标 位置重新规划为定位后的元素 进行下次访问再取坐标
          }else {
            return dg(node, parent.parentNode); //如果没找到一直上级查找 知道抵达父级为 document查询结束
          }
        }
        return dg(node, parent);
      },
    },
    mounted() {
      let left = this.getDom(this.$refs.box, 'offsetLeft');
      console.log(left);
      let top = this.getDom(this.$refs.box, 'offsetTop');
      console.log(top);
      document.onclick = (e) => {
        console.log("坐标x: "+e.y, "坐标y: "+e.y);
      }
    }
  }
</script>

<style>
  .test-postion {
    width: 100vh;
    height: 100vh;
    background: white;
    overflow: hidden;
    padding: 200px;
  }
.box1 {
  padding: 50px;
  border: 3px solid black;
}
.box2 {
  margin: 60px;
  border: 3px solid black;
}
.box3 {
  position: relative;
  border: 3px solid black;
}
.box4 {
  padding: 70px;
  position: relative;
  border: 3px solid black;
}
.box5 {
  margin: 80px;
  position: relative;
  border: 3px solid black;
}
.box6 {
  padding: 10px;
  margin: 10px;
  border: 3px solid black;
}
.box {
  width: 100px;
  height: 100px;
  position: relative;
  margin: 12px;
  padding: 13px;
  background: burlywood;
}
</style>