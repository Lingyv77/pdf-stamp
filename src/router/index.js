import Vue from 'vue'
import Router from 'vue-router'

// 解决报错
const originalPush = Router.prototype.push
const originalReplace = Router.prototype.replace
// push
Router.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch(err => err)
}
// replace
Router.prototype.replace = function push(location, onResolve, onReject) {
  if (onResolve || onReject) return originalReplace.call(this, location, onResolve, onReject)
  return originalReplace.call(this, location).catch(err => err)
}
//安装插件
Vue.use(Router);

//创建路由对象
const routes = [
  {
    path: '',
    redirect: '/pdfStamp'
  },
  {
    path: '/pdfStamp',
    name: 'PdfStamp',
    component: () => import('views/pdf-stamp/PdfStamp.vue')
  },
]

//配置路由关系
const router = new Router({
  routes,
  mode: 'history'
})

//导出router
export default router; 