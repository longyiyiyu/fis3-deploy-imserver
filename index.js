var path = require('path');
var archiver = require('archiver');

var _ = fis.util;
var fs = _.fs;

var SERVERROOT = '../app';
var VIEWDIRNAME = 'views';
var DEF_CONF = {
    // 默认生成的压缩包路径
    to: '../imserverPack',

    // 打包类型
    type: 'zip',

    // 打包参数
    archiverOptions: {},

    // 生成的压缩包文件名
    file: 'pack.zip',

    // 后定义的正则优先级更高
    packPathSrc: []
};

/*
 * zip folder
 */
function zip(options) {
    var zipPath = _(options.projectPath, options.to, options.file);
    var archive = archiver(options.type, options.archiverOptions);
    var ws = fs.createWriteStream(zipPath);

    _.mkdir(path.dirname(zipPath));

    archive.pipe(ws);
    archive.bulk([{
        expand: true,
        cwd: path.dirname(zipPath),
        src: ['**', '!' + path.basename(zipPath)]
    }]);

    archive.on('error', function() {
        fis.log.error('生成zip错误，路径 --- ' + zipPath);
    });

    archive.finalize();

    if (options.zipTo) {
        ws.on('close', function() {
            var content = fs.readFileSync(zipPath);
            var distDir = _(options.projectPath, options.zipTo);
            _.mkdir(distDir);
            fs.writeFileSync(_(distDir, options.file), content, 'utf-8');
        });
    }
}

function expo(options, modified, total, next) {
    var root = fis.project.getProjectPath();

    options = _.extend({}, DEF_CONF, options);

    var projectPath = fis.project.getProjectPath();
    var to = _(projectPath, options.to);

    _.del(to); // 先把原来的文件夹删掉
    _.mkdir(to); // 再创建

    var zipPath = _(projectPath, options.to, options.file);
    var archive = archiver(options.type, options.archiverOptions);
    var ws = fs.createWriteStream(zipPath);

    archive.pipe(ws);
    archive.bulk([{
        expand: true,
        cwd: _(projectPath, options.cwd),
        src: ['**', '!' + path.basename(zipPath)].concat(options.packPathSrc)
    }]);

    archive.on('error', function() {
        fis.log.error('生成zip错误，路径 --- ' + zipPath);
    });

    archive.finalize();

    if (options.zipTo) {
        ws.on('close', function() {
            var content = fs.readFileSync(zipPath);
            var distDir = _(projectPath, options.zipTo);
            _.mkdir(distDir);
            fs.writeFileSync(_(distDir, options.file), content, 'utf-8');
        });
    }

    next();
}

module.exports = expo;
