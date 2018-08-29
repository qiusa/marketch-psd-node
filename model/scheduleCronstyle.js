/*
 * @Author: qs 
 * @Date: 2018-08-29 11:34:02 
 * @Last Modified by: qs
 * @Last Modified time: 2018-08-29 12:35:54
 */

const schedule = require('node-schedule')
const log4js = require('../log/log')
const util = require('../public/utils/util')
/**
 * 定时任务 情况目录
 * 每分钟的第30秒触发： '30 * * * * *'
 * 每小时的1分30秒触发 ：'30 1 * * * *'
 * 每天的凌晨1点1分30秒触发 ：'30 1 1 * * *'
 * 每月的1日1点1分30秒触发 ：'30 1 1 1 * *'
 * 2016年的1月1日1点1分30秒触发 ：'30 1 1 1 2016 *'
 * 每周1的1点1分30秒触发 ：'30 1 1 * * 1'
 * @param {String} path 需要清空的目录
 */
const scheduleCronstyle = (path) => {
  schedule.scheduleJob('30 1 * * * *', function () {
    //清空文件夹
    util.emptyPsdDir(path)
    console.log('scheduleCronstyle:' + new Date())
    log4js.info('scheduleCronstyle:' + new Date())
  });
}
module.exports = scheduleCronstyle