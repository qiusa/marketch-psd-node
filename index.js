/*
 * @Author: qs 
 * @Date: 2018-08-29 11:34:16 
 * @Last Modified by: qs
 * @Last Modified time: 2018-08-30 13:50:14
 */
const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors') // 允许跨域

const request = require('request')
const fs = require('fs-extra')

const path = require('path')
const serve = require('koa-static')

const images = require('images')
const dirname = serve(path.join(__dirname))

const log4js = require('./log/log')

const util = require('./public/utils/util')
const scheduleCronstyle = require('./model/scheduleCronstyle')

scheduleCronstyle('./psd')
app.use(async (ctx, next) => {
  await next()
  const rt = ctx.response.get('X-Response-Time')

  log4js.info(`${Date.now()} ${ctx.method} ${ctx.url} - ${rt}`)
})

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.set('X-Response-Time', `${ms}ms`)
})

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
  if (fs.existsSync(dirName) && fs.existsSync(outImg)) {
    console.log('有缓存《《《《》》》》', dirName, outImg)
    let psd = util.parsePsd(dirName)
    ctx.body = {
      code: 200,
      data: {
        tree: psd.tree,
        document: psd.document,
        preview,
        layerDir
      }
    }
  } else {
    console.log('没缓存》》》》》》', ctx.request.query.id, id, dirName)
    return new Promise((resolve, reject) => {
      let reader = request
        .get(ctx.request.query.id)
        .on('error', function (err) {
          console.log(666, err)
        })
        .pipe(fs.createWriteStream(dirName))
      //监听文件流写入完成
      reader.on('close', () => {
        let psd = util.parsePsd(dirName)
        psd.psd.image
          .saveAsPng(outImg)
          .then(function () {
            console.info('导出图片成功', outImg)
            images(outImg).save(outImg, {
              quality: 60 //保存图片到文件,图片质量为50
            })
            ctx.body = {
              code: 200,
              data: {
                tree: psd.tree,
                document: psd.document,
                preview,
                layerDir
              }
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

        // 导图层
        //exportLayer(psd, dirFolder)
      })
    })
  }
}
function exportLayer(psd, dirFolder) {
  let promises = []
  psd.descendants.forEach(function (node, index) {
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
        util.mkdirsSync(dirFolder)
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

app.listen(3000)
