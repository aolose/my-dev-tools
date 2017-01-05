const gulp = require('gulp');
const sftp = require('gulp-sftp');
process.on('message', function(m) {
  gulp
    .src(m.paths,{base:m.base})
    .pipe(sftp(m.server))
    .on('end', _=>process.send('end'))
    .on('finish', _=>process.send('end'));
});
