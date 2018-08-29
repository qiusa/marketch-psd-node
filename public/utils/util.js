/*
 * @Author: qs 
 * @Date: 2018-08-29 11:34:36 
 * @Last Modified by: qs
 * @Last Modified time: 2018-08-29 14:29:58
 */
const fs = require('fs-extra')
const path = require('path')

const PSD = require('psd')

const util = {
  /**
   * 同步创建多级目录
   * @param {String} dirname 需要创建的目录 './a/b/c'
   */
  mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
      return true
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname)
        return true
      }
    }
  },
  /**
   * 将 RGBA 转换成颜色表达式
   *
   * @param {Array[4]} value rgba 值
   * @return {string} 返回颜色表达式
   */
  rgba2color(value) {
    if (value[3] === 255) {
      return (
        '#' +
        value
          .slice(0, -1)
          .map(function (value) {
            return (0x100 + parseInt(value)).toString(16).slice(1)
          })
          .join('')
          .replace(/(.)\1(.)\2(.)\3/, '$1$2$3')
      )
    } else {
      return 'rgba(' + value.join() + ')'
    }
  },
  // 
  /**
   * 清空文件夹 With async/await:(不是很必要 只是想用一下)
   * @param {String} dir './psd'
   */
  async emptyPsdDir(dir) {
    try {
      await fs.emptyDir(dir)
      console.log(`clear ${dir} success!`)
    } catch (err) {
      console.error(err)
    }
  },
  /**
   *
   * 使用psdjs解析psd
   * @param {String} dirName psd路径
   * @returns
   */
  parsePsd(dirName) {
    let psd = PSD.fromFile(dirName)
    psd.parse()
    let tree = psd.tree().export()
    let descendants = psd.tree().descendants()
    this.tree = []
    this.path = ''
    this.traversalPsdTree(tree.children, 1, psd.tree())
    return {
      psd,
      tree: this.tree,
      document: tree.document,
      treeParse: this.tree,
      descendants
    }
  },
  tree: [],
  path: '',
  spaceNum: 0,
  /**
   *
   * psdTree扁平化方法
   * @param {Array} argument
   * @returns
   */
  createSpaceStr(argument) {
    let spaceStr = ''
    for (let i = 0; i < this.spaceNum; i++) {
      spaceStr += '->'
    }
    return spaceStr
  },
  /**
   * psdTree扁平化入口
   * @param {Object} tree  需要扁平化的数据
   * @param {Number} floor 序号
   * @param {Object} data  原始数据 根据图层路径用来获取混合选项
   */
  traversalPsdTree(tree, floor, data) {
    let spaceStr = this.createSpaceStr()
    for (let i = 0; i < tree.length; i++) {
      let node = tree[i]
      if (node.visible) {
        if (node.type == 'group') {
          if (this.path) {
            this.path += ('/' + node.name)
          } else {
            this.path = node.name
          }

          this.spaceNum++
          let next = floor + 1
          //console.error(node.name, 'this.path', this.path);
          this.traversalPsdTree(node.children, next, data)
        } else {
          if (this.path) {
            this.path += ('/' + node.name)
          } else {
            this.path = node.name
          }
          node.path = this.path
          if (data.childrenAtPath(node.path)[0] && data.childrenAtPath(node.path)[0].get('objectEffects') && data.childrenAtPath(node.path)[0].get('objectEffects').data) {
            let fx = data.childrenAtPath(node.path)[0].get('objectEffects').data
            // 在混合选项里里获取边框属性（注意：未满四个字符有空格补全作为key）
            if (fx.FrFX) {
              let color = this.rgba2color([fx.FrFX['Clr ']['Rd  '], fx.FrFX['Clr ']['Grn '], fx.FrFX['Clr ']['Bl  '], fx.FrFX.Opct.value / 100 * 255])
              node.border = fx.FrFX['Sz  '].value + 'px solid ' + color
            }

          }
          //console.log(spaceStr + 'floor : ' + floor + '   node  : ' + i + ' ', node)
          this.tree.push(node)
          //let index = node.path.lastIndexOf("\/") 1/2/3
          this.path = this.path.substring(0, this.path.lastIndexOf("\/"))
          console.error('path2', this.path);
        }
      }
    }
    this.spaceNum--
  }
}

module.exports = util

