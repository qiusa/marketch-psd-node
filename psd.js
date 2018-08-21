var PSD = require('psd-parser');
var psd = PSD.parse('./test.psd');
console.log(psd)
psd.getDescendants() //扁平化的图层数组
psd.getTree() //树型结构的图层数组，与psd中结构相符
console.log(psd._psd_) //解析psd后的原始对象
  
//psd缩略图的输出,只支持png输出
psd.saveAsPng('test.png') //目前要注意目录是否存在
//某个图层的png输出
psd.getDescendants()[0].saveAsPng('layer.png')