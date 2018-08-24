const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors') // 允许跨域

const request = require('request')
const fs = require('fs-extra')

const path = require('path')
const serve = require('koa-static')

var PSD = require('psd')
var PSD1 = require('psd-parser')

const images = require('images')
const dirname = serve(path.join(__dirname))

// With async/await:
async function example(dir) {
  try {
    await fs.emptyDir(dir)
    console.log(`clear ${dir}/psd success!`)
  } catch (err) {
    console.error(err)
  }
}
//清空文件夹
// example('./psd')
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
  let dirName = psdDir + id
  let outImg = psdDir + id + '.png'
  // 判断有没有指定文件夹 没有则创建一个
  if (!fs.existsSync(psdDir)) {
    fs.mkdirSync(psdDir);
  }
  if (fs.existsSync(dirName)) {
    console.log('有缓存《《《《》》》》')
    // 获取真实psd数据
    /* psd = PSD1.parse(ctx.request.query.id);
    tree = psd.getDescendants() //扁平化的图层数组
    tree_2 = psd.getTree()
    psd.saveAsPng(outImg) */

    let psd = PSD.fromFile(dirName)
    psd.parse()
    let tree = psd.tree().export()
    console.info('压缩啊', outImg)
    /* images(outImg).save(outImg, {
      quality: 200 //保存图片到文件,图片质量为50
    }) */
    if (!fs.existsSync(outImg)) {
      // todo 是否要删除psd源文件
      ctx.body = {
        code: '301',
        msg: '导出图片失败'
      }
    } else {
      ctx.body = {
        code: 200,
        tree,
        preview:
          'http://localhost:3000/' + outImg
      }
    }
    
  } else {
    console.log('没缓存》》》》》》', ctx.request.query.id, id)
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
              preview:
                'http://localhost:3000/' + outImg
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
