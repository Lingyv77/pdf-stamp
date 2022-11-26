<template>
  <div class="pdf-stamp" onbeforecopy='return false' onselect='document.selection.empty()' ondragstart='return false' onselectstart ='return false' >
    <div class="scroll-box" @scroll="onScroll">
      <div class="scroll-warp">
        <div class="seal-list">
          <div class="title"> 印章 </div>
          <div class="seal-img">
            <div class="seal-img-content">
              <div v-for="(item, index) of sealOfTheList" :key="index" class="seal-item">
                <div class="img-name"> {{ item.name }} </div>
                <div class="img-content"> 
                  <img class="img" :src="item.img"
                    @mousedown.stop="moveDown" 
                  /> 
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="content-box">
          <div class="with-file">
            <input type="file" class="file" id="file" ref="fielinput" @change="uploadFile" style="display: none;"/>
            <label class="select-file" for="file">选择文件</label> 
            <span class="file-name"> {{ fileName }} </span>
            <button class="save-down" @click.stop="saveDown">立即下载</button>
          </div>
          <div class="canvas-box-border">
            <div class="canvas-content" ref="canvasBox">
              <canvas ref="pdfCanvas" class="canvas-pdf"> </canvas>
            </div>
          </div>
          <div class="foot-bar">
            <button @click="clickPre">上一页</button>
            <span>第 {{ pageNo }} / {{ pdfPageNumber }} 页</span>
            <button @click="clickNext">下一页</button>
          </div>
        </div>        
      </div>
    </div>
  </div>
</template>

<script>
  import pdfJS from "pdfjs-dist";
  import "pdfjs-dist/build/pdf.worker.entry";

  export default {
    name: 'PdfStamp',
    data() {
      return {
        pageNo: 0,
        pdfPageNumber: 0,
        renderingPage: false,
        pdfData: null, // PDF的base64
        sealDomList: [], //储存印章dom
        scrollTop: 0, //scrollTop
        once: false, //执行一次获取总之

        /**
         * option 设置项
         */
        downFileText: "pdf_down_file", //下载文件名
        fileStamp: true, //是否需要给文件盖章 才可下载
        zIndex: 100, //给一个z-index 防止被其他元素遮盖导致立马触发mousedown 或者 mouseleave 删除元素
        sealOfTheList: [
         { name: "携程旅行", img: "https://webresource.c-ctrip.com/ares2/nfes/pc-home/1.0.65/default/image/logo.png" },
         { name: "虎牙直播", img: "https://a.msstatic.com/huya/main3/static/img/logo.png" },
         { name: "厦门VG", img: "https://livewebbs2.msstatic.com/avatar_1_d52819f40bc198fbd1098b30dc1edacf.png" },
         { name: "画压印", img: "http://shopxmhs.oss-cn-beijing.aliyuncs.com/3e6ae202206221409453342.png" },
         { name: "招聘", img: "http://shopxmhs.oss-cn-beijing.aliyuncs.com/1daa8202206221409468728.png" },
         { name: "诚邀", img: "http://shopxmhs.oss-cn-beijing.aliyuncs.com/2c0ba202206221409472433.png" },
         { name: "广州TTG", img: "https://livewebbs2.msstatic.com/avatar_1_bf8ba03e1f78144d84f3538672ca282b.png" },
         { name: "成都AG超玩会", img: "https://esports-cdn.namitiyu.com/kog/team/FpDfD5z0hFN3N2gMpQHWx38qwmeF" },
        ],
        scale: 3, // 缩放值
        maxseal: 3, //最大seal数量
        fileName: "尚未选择文件", //初始文件名

      };
    },
    methods: {
    /**
     * 环境函数回调*******
     */
      /**
       * outMax() 
       * max: 设置的最大值 newVale 触发执行的值(max+1)  
       * 对应maxseal配置项
       */
      outMax(max, /*newVal*/) {
          console.log(`超出最大数量:${max}`); 
      },
      /**
       * notSelectFile 尚未选择文件回调 
       * 无参数
       */
      notSelectFile() {
        console.log('请选择文件');
      },
      /**
       * notStamp 尚未选择文件回调 
       * 无参数
       * 对应fileStamp配置项
       */
      notStamp() {
        console.log('请给文件盖章');
      },

      /**
       * 展示file
       */
      uploadFile() {
        this.once = false;
        let fileInput = this.$refs.fielinput;
        let fileData = fileInput.files[0];

        this.fileName = fileData.name;
        let reader = new FileReader(); //文件读取
        reader.readAsDataURL(fileData); //得到读取的文件
        reader.onload = () => { //文件加载
          let data = atob(
          reader.result.substring(reader.result.indexOf(",") + 1) //取找到 ',' 符号后一个索引开始的所有数据 就是文件base64数据 
          /** reader = data:application/pdf;base64,(JVBERi0xLj... = data) data文件base64数据
              atob() 函数源码: 
              globalScope.atob = function (input) { 
                return Buffer.from(input, 'base64').toString('binary'); 'binary' 转换'utf8'编码格式: 返回字符串
              }
          */
          );
          this.loadPdfData(data);
        };
      },
      loadPdfData(data) {
        // 引入pdf.js的字体
        let CMAP_URL = "https://unpkg.com/pdfjs-dist@2.0.943/cmaps/";
        //读取base64的pdf流文件 返回pdf实例对象
        this.pdfData = pdfJS.getDocument({
          data: data, // PDF base64编码
          cMapUrl: CMAP_URL,
          cMapPacked: true,
        });
        this.renderPage(1);
      },  
      // 根据页码渲染相应的PDF
      renderPage(num, callback) { //num传入页 返回对应页的pdf数据
        this.renderingPage = true;
        this.pdfData.promise.then((pdf) => {

          if (!this.once) {
            this.once = true;
            this.pdfPageNumber = pdf.numPages;  //pdf.numPages 文件总页数
          }

          pdf.getPage(num).then((page) => {
            // 获取DOM中为预览PDF准备好的canvasDOM对象 绘制内容
            let canvas = this.$refs.pdfCanvas;
            let viewport = page.getViewport(this.scale); //获取窗口属性
            canvas.height = viewport.height;
            canvas.width = viewport.width;  

            let ctx = canvas.getContext("2d");
            let renderContext = {
              canvasContext: ctx, //将对应ctx赋给renderContext.canvasContext 调用page.render(renderContext) 后内部 对应ctx.fillText() 绘制内容
              viewport: viewport,
            };
            page.render(renderContext).then(() => { //渲染当前页内容
              if (typeof(callback) === 'function') {
                callback(ctx);
              }
              this.renderingPage = false;
              this.pageNo = num; //获取当页内容
            });
          });
        });
      },
      //上一页
      clickPre() {
        if (this.pdfPageNumber - 1 >= 1) {
          this.renderPage(this.pageNo - 1);
        }
      },
      //下一页
      clickNext() {
        if (this.pageNo + 1 <= this.pdfPageNumber) {
          this.renderPage(this.pageNo + 1);
        }
      },

      /**
       * 创建seal dom
       */
      //按下
      moveDown(event) {
        let _this = this;
        let targetImg = event.srcElement; //触发的img
        let yDistance = (targetImg.offsetHeight/2);
        let xDistance = (targetImg.offsetWidth/2);

        let sealDomList = this.sealDomList;
        let addIndex = sealDomList.length;

        //创建img
        let img =  targetImg.cloneNode(true);
        img.tabIndex = addIndex;
        img.style.position = 'absolute';
        img.style.zIndex = this.zIndex;
        img.style.width = targetImg.offsetWidth + 'px';
        img.style.height = targetImg.offsetHeight + 'px';
        img.style.backgroundPosition = 'center';
        img.style.backgroundRepeat = 'no-repeat';
        img.style.backgroundSize = '100%'; 
        img.style.backgroundSize = '100%'; 

        let xy = this.getCanvasBoxXY();
        let canLeft = xy[0];
        let canTop = xy[1];
        _this.moveNode(img, (event.x - xDistance - canLeft), (event.y - yDistance - canTop + _this.scrollTop));

        //移动
        document.onmousemove = function(event) {
          _this.moveNode(img, (event.x - xDistance - canLeft), (event.y - yDistance - canTop + _this.scrollTop));
        }
        //放下)
        document.onmouseup = function () {
          document.onmousemove = null;
          document.onmouseup = null;
          Promise.resolve(
            _this.clearDOM(img, _this.$refs.canvasBox)
          ).then(res => {
            if(!res) {
              img.addEventListener( 'mousedown', _this.down, true);
              img.addEventListener( 'mouseup', _this.up, true);
              img.addEventListener( 'mouseleave', _this.leave, true);
            }
          })
        }

        //插入元素
        this.$refs.canvasBox.appendChild(img);
        _this.sealDomList.push(img); //储存seal dom
      },
      /*
        canvasBox面向内部成员 view 定位 x, y
        返回: 数组[x, y]
      */
      getCanvasBoxXY() {
        let canvasBox = this.$refs.canvasBox; //iamge放置定位盒子
        let xy = this.getDomLeft(canvasBox);
        let canLeft = xy[0];
        let canTop = xy[1];
        return [canLeft, canTop];
      },
      //按下
      down(e) { //拖拽 和 是否创建印章
        let _this = this;
        let ev = e.srcElement;
        ev.style.zIndex = this.zIndex + 1; //我们希望拖拽印章的时候, 不会因为其他成员遮盖影响
        let yDistance = (ev.offsetHeight/2);
        let xDistance = (ev.offsetWidth/2);

        let xy = this.getCanvasBoxXY();
        let canLeft = xy[0];
        let canTop = xy[1];
        _this.moveNode(ev, (e.x - xDistance - canLeft), (e.y - yDistance - canTop + _this.scrollTop));

        ev.onmousemove = function (event) {
          _this.moveNode(ev, (event.x - xDistance - canLeft), (event.y - yDistance - canTop + _this.scrollTop));
        }
      },
      //放下
      up(event) { //停止拖拽且是否删除印章
        let target = event.srcElement;
        target.style.zIndex = this.zIndex; //我们希望结束拖拽操作后 印章的时候回到初始层级;
        target.onmousemove = null;
        this.clearDOM(target, this.$refs.canvasBox);
      },
      //离开
      leave(event) { //停止拖拽
        event.srcElement.onmousemove = null;
      },
      //定位
      moveNode(event, x, y) {
        event.style.left = x + 'px';
        event.style.top = y + 'px';
      },
      /**
       * 是否出界需清除
       * 返回: 布尔值 是否被删除
       */
      clearDOM(node, box) {
        //node dom
        let target = node;
        let tarTop  =  target.offsetTop;
        let tarLeft = target.offsetLeft;
        let tarBottom = tarTop + target.offsetHeight;
        let tarRight= tarLeft + target.offsetWidth;
        
        //box dom
        let fileDom = box;
        let height = fileDom.offsetHeight;
        let width = fileDom.offsetWidth;

        if (tarBottom <  0 || tarTop > height) {
          this.removeSealChild(target);
          return true;
        }else if (tarRight < 0 || tarLeft > width) {
          this.removeSealChild(target);
          return true;
        }

        if (this.sealDomList.length > this.maxseal) { //最seal大数量
          this.outMax(this.maxseal, this.sealDomList.length );
          this.removeSealChild(node);
          return true;
        }

        return false;
      },
      //移除元素
      removeSealChild(node) {
        this.$refs.canvasBox.removeChild(node);
        this.sealDomList.splice(node.tabIndex, 1); 
        for (let i = 0; i < this.sealDomList.length; i++) { //重新排序tabIndex标识
          this.sealDomList[i].tabIndex = i;
        }
      },

      /**
       * canvas下载
       */
      saveDown() {
        if (!this.pageNo) {
          return this.notSelectFile();
        }else if (!this.sealDomList.length && this.fileStamp) {
          return this.notStamp();
        }else{
          this.drawImage(this.sealDomList);
        }
      },
      //绘制图片
      drawImage(imageList) {
        let canvas = this.$refs.pdfCanvas;
        let canvasBox = this.$refs.canvasBox;
        let _this = this;

        if (!this.fileStamp && !this.sealDomList.length) { //跳过印章绘制
          _this.canvasFile();
          return _this.backInitialState(_this.sealDomList);
        }
        
        function func(ctx) {
          let ratioX = canvas.width / canvasBox.offsetWidth;
          let ratioY = canvas.height / canvasBox.offsetHeight; 
          let count = 0; //当前进度
          let totalCount = imageList.length; //总进度

          for (let image of imageList) {
            let imgLeft = image.offsetLeft;
            let imgTop = image.offsetTop;
            let x = imgLeft * ratioX;
            let y = imgTop * ratioY;
            
            let img = new Image(20, 10);
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              count++;
              ctx.drawImage(img, x, y, image.offsetWidth*ratioX, image.offsetHeight*ratioY);
              if (count === totalCount) {
                _this.canvasFile();
                _this.backInitialState(_this.sealDomList);
              }
            };
            img.src = image.src;
          }
        }
        this.renderPage(this.pageNo, func);
      },
      //canvas 文件数据 下载
      canvasFile() {
        let canvas = this.$refs.pdfCanvas;
        let dataURL = canvas.toDataURL('image/png'); //canva文件数据
        this.downLoad(dataURL);
      },
      //下载文件
      downLoad(url) {
        let note = document.createElement('a');
        note.download = this.downFileText; // 设置下载的文件名，默认是'下载'
        note.href = url;
        document.body.appendChild(note);
        note.click();
        note.remove();
      },
      //下载成功 清空印章
      backInitialState(domList) {
        this.renderPage(this.pageNo);
        let len = domList.length;
        for (let i = 0; i < len; i++) {
          this.removeSealChild(domList[0]);
        }
      },

      /**
       * scrollTop
       */
      onScroll(event) {
        let target = event.srcElement;
        this.scrollTop = target.scrollTop;
      },
      
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
       * getDom 递归检测DOM 确定定位多次赋值 得到总真实offsetLeft 和 offsetTop
       * key: 可选 offsetLeft 和 offsetTop
       */
      getDomLeft(node) {
        let _this = this;
        let valueXY = [0, 0]; //储存值
 
        let parent = node.parentNode;
        let uncertain = ["static", "initial", "revert" , "unset" ]; //定位被确定
        function dg(node, parent) {
          /**
           * //是否需要scrollXY (注销注释将不调用this.onScroll)
           * valueXY[0] -= parent.scrollLeft; //scrollLeft
           * valueXY[1] -= parent.scrollTop;  //scrollTop
           */
          if (!~uncertain.indexOf(_this.getStyleVal(parent, "position"))) { 
            valueXY[0] += node.offsetLeft + _this.matchNum(_this.getStyleVal(parent, "borderLeft"));
            valueXY[1] += node.offsetTop + _this.matchNum(_this.getStyleVal(parent, "borderTop"));
            return dg(parent, parent.parentNode); //多次上级访问找找到父节确定定位的元素 做 坐标 位置重新规划为定位后的元素 进行下次访问再取坐标
          }else {
            let grandParentNode = parent.parentNode
            if (grandParentNode !== document) {
              return dg(node, parent.parentNode); //如果没找到一直上级查找 知道抵达父级为 document查询结束
            }else { //到达documen时候立即停止
              valueXY[0] += node.offsetLeft;
              valueXY[1] += node.offsetTop;
              return valueXY;
            }
          }
        }
        return dg(node, parent);
      }
    }
  }
</script>

<style scoped>
.pdf-stamp {
  width: 100vw;
  height: 100vh;
  background-color: white;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
  .scroll-box {
    width: 100vw;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
    position: relative;
  }
  .scroll-box::-webkit-scrollbar {
    display: none;
  }
    .scroll-warp {
      display: flex;
      position: relative;
    }
      .seal-list {
        height: 400px;
        text-align: center;
        border: 2px solid #d3cece;
        background-color: #e7e7e7;
        display: flex;
        flex-direction: column;
        margin: 50px 100px;
        border-radius: 5px;
      }
        .title {
          font-size: 20px;
          margin: 0 10px;
          font-weight: 600;
          padding: 5px;
          color: #7a7a7a;
          border-bottom: 1px solid #d6d6d6;
        }
        .seal-img {
          flex: 1;
          overflow-x: hidden;
          overflow-y: scroll;
        }
        .seal-img::-webkit-scrollbar {
          display: none;
        }
          .seal-img-content {
            padding: 0 10px;
          }
            .seal-item {
              margin: 10px 0;
            }
              .img-name {
                color: #b6b6b6;
                font-weight: 600;
                padding: 10px;
                background-color: #fffdf9;
                border-radius: 5px;
              }
              .img-content {
                height: 100px;
                display: flex;
                justify-content: center;
                align-items: center;
              }
                .img-content .img {
                  width: 100px;
                }
      .content-box {
        text-align: center;
        position: relative;
        margin: 50px;
        background-color: #f3efe6;
        padding: 10px 25px;
        border-radius: 5px;
      }
        .with-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
        }
          .select-file {
            display: block;
            padding: 10px 50px;
            background-color: #e9d2ff;
            color: #000;
            border-radius: 5px;
          }
          .save-down {
            padding: 10px 50px;
            border-style: none;
            display: block;
            background-color: #e9d2ff;
            border-radius: 5px;
          }
          .file-name {
            color: #919191;
            font-size: 18px;
            font-weight: 600;
          }
        .canvas-box-border {
          border: 4px double black;
        }
          .canvas-content {
            width: 500px;
            height: 700px;
            position: relative; 
          }
          .canvas-pdf {
            width: 100%;
            height: 100%;
          }
        .foot-bar {
          position: relative;
          padding: 10px;
          display: flex;
          justify-content: space-around;
          align-items: center;
        }
          .foot-bar button {
            border-style: none;
            background-color: #efc9aa;
            display: block;
            padding: 10px 50px;
            border-radius: 5px;
          }
            .foot-bar span {
              color: #186666;
            }
</style>
