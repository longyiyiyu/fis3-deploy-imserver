var path = require('path');
var dtpl = require('d-tpl');
var archiver = require('archiver');

var _ = fis.util;
var fs = _.fs;

var SERVERROOT = '../app';
var VIEWDIRNAME = 'views';
var DEF_CONF = {
    // 默认生成的压缩包路径
    to: '../imserverPack',

    // 生成的压缩包文件名
    file: 'imserver.zip',

    // 后定义的正则优先级更高
    packPathSrc: []
};

/*
 * zip folder
 */
function zip(options) {
    var zipPath = _(options.projectPath, options.to, options.file);
    var archive = archiver('zip');
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
            var content = fs.readFileSync(zipPath),
                offline = _(options.projectPath, options.zipTo);
            _.mkdir(offline);
            fs.writeFileSync(_(offline, options.file), content, 'utf-8');
        });
    }
}

function expo(options, modified, total, next) {
    var htmlFileIds = [];
    var pageList = options.pageList;
    var root = fis.project.getProjectPath();
    var serverRoot = _(root, options.serverRoot || SERVERROOT);
    var viewRoot = _(serverRoot, VIEWDIRNAME);
    var match;

    if (!pageList || !pageList.length) {
        next();
        return;
    }

    for (var i = 0, l = pageList.length; i < l; ++i) {
        htmlFileIds.push(pageList[i] + '.html');
    }

    modified.forEach(function(file) {
        if (~htmlFileIds.indexOf(file.id)) {

            var pageName = file.id.replace(/\.html$/, '');

            /* 处理 html 文件 */
            // 创建目录
            _.mkdir(_(viewRoot, pageName));

            // copy 源文件
            _.copy(_(root, '../dist', file.id), _(viewRoot, pageName, file.id));

            // 编译源文件
            var src = file.getContent();
            var tplFun = dtpl.compile({
                raw: src,
                onBeginCompile: function($dom, $, vm) {
                    $dom.find('html').attr('alpaca', 1);
                }
            });
            _.write(_(viewRoot, pageName, pageName + '.tpl.js'), tplFun.funSerializationStr);
            /* 处理 html 文件 */
        }
    });

    /* imserver pack */
    options = _.extend({}, DEF_CONF, options);

    var projectPath = fis.project.getProjectPath();
    var to = _(projectPath, options.to);
    var packFileList = [];

    options.projectPath = projectPath;

    _.del(to); // 先把原来的文件夹删掉

    options.packPathSrc.forEach(function(p) {
        var srcPath = _(projectPath, p);
        var name = path.basename(srcPath);
        _.exists(srcPath) && _.copy(srcPath, to + '/' + name);
    });

    zip(options);
    /* imserver pack */

    next();
}

module.exports = expo;
