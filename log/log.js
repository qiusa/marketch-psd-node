/*
 * @Author: qs 
 * @Date: 2018-08-29 11:34:25 
 * @Last Modified by: qs
 * @Last Modified time: 2018-08-29 13:55:26
 */
const log4js = require("log4js");
const log4js_config = require("./log4js.json");
log4js.configure(log4js_config);

const LogFile = log4js.getLogger('log_file');

LogFile.trace('This is a Log4js-Test');
LogFile.debug('We Write Logs with log4js');
LogFile.info('You can find logs-files in the log-dir');
LogFile.warn('log-dir is a configuration-item in the log4js.json');
LogFile.error('In This Test log-dir is : \'./logs/log_test/\'');
module.exports = LogFile