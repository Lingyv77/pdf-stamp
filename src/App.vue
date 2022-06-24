<template>
  <div id="app">
    <div id="app">
        <keep-alive>
            <router-view/>
        </keep-alive>
        <div class="bar">
          <div v-for="(item, index) in barList" :key="index" class="bar-item" @click="$router.push({path: item.path})"> {{item.name}} </div>
        </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'App',
    data() {
      return {
        barList: [],
      }
    },
    mounted() {
      this.initalzeBarList();
    },
    methods: {    
      initalzeBarList() {
        let res = [];
        for (let item of this.$router.options.routes) {
          if (item.path) {
            res.push(item);
          }
        }
        this.barList = res;
      }
    },
  }
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
  overflow: hidden;
  position: relative;
}
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-around;
    font-size: 14px;
    color: #000000;
    position: fixed;
    text-align: center;
    right: 20px;
    top: 10px;
    font-size: 14px;
    z-index: 100;
  }
    .bar-item {
      flex: 1;
      padding: 10px 30px;
      margin: 0 10px;
      cursor: pointer;
      background-color: #e7e7e7;
      border-radius: 5px;
    }
    .bar-item:active {
      background-color: black;
      color: rgb(7, 4, 4);
    }
</style>
