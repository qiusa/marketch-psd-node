const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors') // 允许跨域

const request = require('request')
const fs = require('fs-extra')

const path = require('path')
const serve = require('koa-static')

let PSD = require('psd')
let PSD1 = require('psd-parser')

const images = require('images')
const dirname = serve(path.join(__dirname))

const schedule = require('node-schedule')
const log4js = require('./log/log')
// 定时任务 清除缓存
/* 每分钟的第30秒触发： '30 * * * * *'
  每小时的1分30秒触发 ：'30 1 * * * *'
  每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
  每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
  2016年的1月1日1点1分30秒触发 ：'30 1 1 1 2016 *'
  每周1的1点1分30秒触发 ：'30 1 1 * * 1' */
function scheduleCronstyle(){
  schedule.scheduleJob('30 1 1 1 * *', function(){
    //清空文件夹
    emptyPsdDir('./psd')
    console.log('scheduleCronstyle:' + new Date());
  }); 
}

scheduleCronstyle();

/**
 * 同步创建多级目录
 * @param {String} dirname 需要创建的目录 './a/b/c'
 */
function mkdirsSync (dirname) {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}
/**
 * 将 RGBA 转换成颜色表达式
 *
 * @param {Array[4]} value rgba 值
 * @return {string} 返回颜色表达式
 */
function rgba2color(value) {
  if (value[3] === 255) {
    return (
      '#' +
      value
        .slice(0, -1)
        .map(function(value) {
          return (0x100 + parseInt(value)).toString(16).slice(1)
        })
        .join('')
        .replace(/(.)\1(.)\2(.)\3/, '$1$2$3')
    )
  } else {
    return 'rgba(' + value.join() + ')'
  }
}

// With async/await:
async function emptyPsdDir(dir) {
  try {
    await fs.emptyDir(dir)
    console.log(`clear ${dir}/psd success!`)
  } catch (err) {
    console.error(err)
  }
}
//清空文件夹
// emptyPsdDir('./psd')
// logger

app.use(async (ctx, next) => {
  await next()
  const rt = ctx.response.get('X-Response-Time')
  console.log(`${Date.now()} ${ctx.method} ${ctx.url} - ${rt}`)
})

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.set('X-Response-Time', `${ms}ms`)
})
// demos/06.js
const route = require('koa-route')

const getPsdJson = ctx => {
  // http://yxupdate.nosdn.127.net/aeeab6a91be6452a8c7dd70e4e5b023b
  let id = ctx.request.query.id.split('/').pop()
  let psdDir = './psd/' // 指定存放psd文件的目录
  let dirName = psdDir + id.replace(/\./g, '') // 指定psd文件路径
  let dirFolder = dirName + 'image/' // 指定存放切片文件夹
  let outImg = psdDir + id.replace(/\./g, '') + '.png' // 输出预览图路径
  let preview = 'http://127.0.0.1:3000/' + outImg.replace(/\.\//, '') // 预览图路径
  let layerDir = 'http://127.0.0.1:3000/' + dirFolder.replace(/\.\//, '') // 切图路径
  // 判断有没有指定文件夹 没有则创建一个
  if (!fs.existsSync(psdDir)) {
    fs.mkdirSync(psdDir)
  }
  if (fs.existsSync(dirName) && fs.existsSync(outImg) && false) {
    console.log('有缓存《《《《》》》》')
    // 获取真实psd数据
    /* psd = PSD1.parse(ctx.request.query.id);
    tree = psd.getDescendants() //扁平化的图层数组
    tree_2 = psd.getTree()
    psd.saveAsPng(outImg) */

    let psd = PSD.fromFile(dirName)
    psd.parse()
    let tree = psd.tree().export()

    ctx.body = {
      code: 200,
      tree,
      preview,
      layerDir
    }
  } else {
    console.log('没缓存》》》》》》', ctx.request.query.id, id, dirName)
    return new Promise((resolve, reject) => {
      let reader = request
        .get(ctx.request.query.id)
        .on('error', function(err) {
          console.log(666, err)
        })
        .pipe(fs.createWriteStream(dirName))
      //监听文件流写入完成
      reader.on('close', () => {
        let psd = PSD.fromFile(dirName)
        psd.parse()
        let tree = psd.tree().export()
        let promises = []
        //debugger
        let descendants = psd.tree().descendants()
        descendants.forEach(function(node, index) {
          if (node.isGroup() || node.hidden()) {
            return true
          }
          let nodeInfo = node.export()
          if (nodeInfo.width <= 0 || nodeInfo.height <= 0) {
            // 无效数据
            return
          }
          if (!nodeInfo.text) {
            // 非文本节点
            let imageOutput = path.join(dirFolder, node.get('name')) + '.png'
            if (!fs.existsSync(dirFolder)) {
              mkdirsSync(dirFolder)
            }
            // 导出图片
            promises.push(
              node
                .saveAsPng(imageOutput)
                .then(() => {
                  //console.info('导出切片图片成功》》》', imageOutput)
                })
                .catch(err => {
                  console.error('obje2222ct', err)
                })
            )
          }
        })

        psd.image
          .saveAsPng(outImg)
          .then(function() {
            console.info('导出图片成功', outImg)
            images(outImg).save(outImg, {
              quality: 60 //保存图片到文件,图片质量为50
            })
            ctx.body = {
              code: 200,
              tree,
              preview,
              layerDir
            }
            resolve()
          })
          .catch(() => {
            console.error('导出图片失败')
            ctx.body = {
              code: '301',
              msg: '导出图片失败'
            }
            resolve()
          })
      })
    })
  }
}

const main = ctx => {
  ctx.throw(500)
  //ctx.response.body = fs.readFile('./psd.js', 'utf8')
  //ctx.response.body = 'Hello World2'
}

const handler = async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.response.status = err.statusCode || err.status || 500
    ctx.response.body = {
      message: err.message
    }
  }
}
app.use(cors())
app.use(handler)
app.use(dirname)
app.use(route.get('/', main))
app.use(route.get('/getPsdJson', getPsdJson))
// response

app.listen(3000)
