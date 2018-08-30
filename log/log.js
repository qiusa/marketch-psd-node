/*
 * @Author: qs 
 * @Date: 2018-08-29 11:34:25 
 * @Last Modified by: qs
 * @Last Modified time: 2018-08-30 13:53:27
 */
const log4js = require("log4js");
const log4js_config = require("./log4js.json");
log4js.configure(log4js_config);

const LogFile = log4js.getLogger('log_file');

module.exports = LogFile