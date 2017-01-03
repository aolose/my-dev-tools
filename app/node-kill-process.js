/**
 * Kill node child processes
 *
 * http://krasimirtsonev.com/blog/article/Nodejs-managing-child-processes-starting-stopping-exec-spawn
 */

let psTree = require('ps-tree');

let killProcess = function (pid, signal, callback) {
  // console.info('KILLING %d PROCESS IF FOUND', pid);
  signal   = signal || 'SIGKILL';
  callback = callback || function () {};
  let killTree = true;
  if(killTree) {
    psTree(pid, function (err, children) {
      [pid].concat(
        children.map(function (p) {
          return p.PID;
        })
      ).forEach(function (tpid) {
        try { process.kill(tpid, signal) }
        catch (ex) {}
        finally {
          if (tpid !== pid) {
            // console.info('PROCESS %d KILLED', tpid);
          }
        }
      });
      if (!err) {
        // console.info('PROCESS %d KILLED', pid);
      }
      callback(pid);
    });
  } else {
    try { process.kill(pid, signal) }
    catch (ex) { }
    finally {
      // console.info('PROCESS %d KILLED', pid);
    }
    callback(pid);
  }
};

function killProcessById(pid, signal, callback) {
  let isWin = /^win/.test(process.platform);
  if(!isWin) {
    killProcess(pid, signal, callback);
  } else {
    let cp = require('child_process');
    cp.exec('taskkill /PID ' + pid + ' /T /F', function (error, stdout, stderr) {
    });
  }
}

module.exports = {
  killProcessById: killProcessById,
  killProcess:killProcess
};/**
 * Created by Administrator on 2016/12/27.
 */
