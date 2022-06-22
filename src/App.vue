<template>
  <div id="app" @scroll="onScroll" onbeforecopy='return false' onselect='document.selection.empty()' ondragstart='return false' onselectstart ='return false' >
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
      <input type="file" class="file" ref="fielinput" @change="uploadFile" />
      <button class="save-down" @click.stop="saveDown">下载</button>
      <div class="canvas-content" ref="canvasBox">
        <canvas ref="pdfCanvas" class="canvas-pdf"> </canvas>
      </div>
      <div class="foot-bar">
        <button @click="clickPre">上一页</button>
        <span>第{{ pageNo }} / {{ pdfPageNumber }}页</span>
        <button @click="clickNext">下一页</button>
      </div>
    </div>
  </div>
</template>

<script>
  import pdfJS from "pdfjs-dist";
  import "pdfjs-dist/build/pdf.worker.entry";

  export default {
    mounted() {
    },
    data() {
      return {
        pageNo: 0,
        pdfPageNumber: 0,
        renderingPage: false,
        pdfData: null, // PDF的base64
        scale: 1, // 缩放值
        once: false, //执行一次获取总之
        sealDomList: [], //储存印章dom
        maxseal: 3, //最大seal数量
        scrollTop: 0, //scrollTop

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
      };
    },
    methods: {
      /**
       * 展示file
       */
      uploadFile() {
        let inputDom = this.$refs.fielinput;
        let file = inputDom.files[0];
        let reader = new FileReader(); //文件读取
        reader.readAsDataURL(file); //得到读取的文件
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
        img.style.width = targetImg.offsetWidth + 'px';
        img.style.height = targetImg.offsetHeight + 'px';
        img.style.backgroundPosition = 'center';
        img.style.backgroundRepeat = 'no-repeat';
        img.style.backgroundSize = '100%'; 
        img.style.backgroundSize = '100%'; 

        _this.moveNode(img, (event.x - xDistance), (event.y - yDistance));

        //移动
        document.onmousemove = function(event) {
          _this.moveNode(img, (event.x - xDistance), (event.y - yDistance));
        }
        //放下
        document.onmouseup = function () {
          document.onmousemove = null;
          document.onmouseup = null;
          img.addEventListener( 'mousedown', _this.down, true);
          img.addEventListener( 'mouseup', _this.up, true);
          img.addEventListener( 'mouseleave', _this.up, true);
          _this.clearDOM(img, _this.$refs.canvasBox);
        }

        //插入元素
        this.$el.appendChild(img);
        _this.sealDomList.push(img); //储存seal dom
      },
      //按下
      down(e) {
        let _this = this;
        let ev = e.srcElement;
        let yDistance = (ev.offsetHeight/2);
        let xDistance = (ev.offsetWidth/2);
        ev.style.position = 'absolute';
        _this.moveNode(ev, (e.x - xDistance), (e.y - yDistance));
        ev.onmousemove = function (event) {
          _this.moveNode(ev, (event.x - xDistance), (event.y - yDistance));
        }
      },
      //放下
      up(event) {
        let target = event.srcElement;
        target.onmousemove = null;
        this.clearDOM(target, this.$refs.canvasBox);
      },
      //定位
      moveNode(event, x, y) {
        event.style.left = x + 'px';
        event.style.top = this.scrollTop+y + 'px';
      },
      //出界清除
      clearDOM(node, box) {
        //node dom
        let target = node;
        let tarTop  =  target.offsetTop;
        let tarLeft = target.offsetLeft;
        let tarBottom = target.offsetTop + target.offsetHeight;
        let tarRight= target.offsetLeft + target.offsetWidth;
        
        //box dom
        let fileDom = box;
        let top  =  fileDom.offsetTop;
        let left = fileDom.offsetLeft;
        let bottom = fileDom.offsetTop + fileDom.offsetHeight;
        let right = fileDom.offsetLeft + fileDom.offsetWidth;

        if (top > tarBottom) {
          this.removeSealChild(node);
        }else if (left > tarRight) {
          this.removeSealChild(node);
        }else if (bottom < tarTop) {
          this.removeSealChild(node);
        }else if (right < tarLeft) {
          this.removeSealChild(node);
        }

        if (this.sealDomList.length > this.maxseal) { //最seal大数量
          console.log(`超出最大数量:${this.maxseal}`); 
          this.removeSealChild(node);
        }
      },
      //移除元素
      removeSealChild(node) {
        this.$el.removeChild(node);
        this.sealDomList.splice(node.tabIndex, 1);
        for (let i = 0; i < this.sealDomList.length; i++) {
          this.sealDomList[i].tabIndex = i;
        }
      },

      /**
       * canvas下载
       */
      saveDown() {
        if (!this.pageNo) {
          return console.log('请选择文件');
        }else if (!this.sealDomList.length) {
          return console.log('请给文件盖章');
        }else{
          this.drawImage(this.sealDomList);
        }
      },
      //绘制图片
      drawImage(imageList) {
        let canvas = this.$refs.pdfCanvas;
        let canvasBox = this.$refs.canvasBox;
        let _this = this;
        function func(ctx) {
          let ratioX = canvas.width / canvasBox.offsetWidth;
          let ratioY = canvas.height / canvasBox.offsetHeight; 
          let count = 0; //当前进度
          let totalCount = imageList.length; //总进度

          for (let image of imageList) {
            let imgLeft = image.offsetLeft;
            let imgTop = image.offsetTop;
            let canLeft = canvasBox.offsetLeft;
            let canTop = canvasBox.offsetTop;
            let x = (imgLeft - canLeft) * ratioX;
            let y = (imgTop - canTop) * ratioY;
            
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
        note.download = 'FILE_SEAL'; // 设置下载的文件名，默认是'下载'
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
      }
    },
  };
</script>

<style>
* {
  padding: 0;
  margin: 0;
  user-select:none;
}
#app {
  width: 100vw;
  height: 100vh;
  background-color: white;
  overflow-x: hidden;
  /* overflow-y: scroll; */
  position: relative;
  display: flex;
}

.content-box {
  text-align: center;
}
.file {
  padding: 10px;
}
.canvas-content {
  width: 500px;
  height: 700px;
  border: 3px double black;
}
.canvas-pdf {
  width: 100%;
  height: 100%;
}
.foot-bar {
  position: relative;
  padding: 10px;
}

  .seal-list {
    height: 400px;
    text-align: center;
    border: 2px solid;
    background-color: #e7e7e7;
    display: flex;
    flex-direction: column;
    margin-right: 100px;
  }
    .title {
      font-size: 20px;
      border-bottom: 1px solid #b8b8b8;
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
          .img-content {
            height: 100px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
            .img-name {
              color: #cc0000;
              border: 1px solid;
              font-weight: 600;
              background-color: #fffdf9;
              border-radius: 10px;
            }
            .img-content .img {
              width: 100px;
            }
            .save-down {
              width: 100px;
              height: 30px;
              text-align: center;
            }
            button {
              margin: 0 20px;
            }
</style>
