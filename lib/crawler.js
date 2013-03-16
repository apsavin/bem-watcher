var fs = require('fs'),
    DIRSMAP = require('./dirsMap.js'),
    PATH = require('path');

function correctPath (basename) {
    return PATH.join(this.toString(), basename);
}

function concat (filesAndDirs, _filesAndDirs) {
    filesAndDirs.files = filesAndDirs.files.concat(_filesAndDirs.files);
    filesAndDirs.dirs = filesAndDirs.dirs.concat(_filesAndDirs.dirs);
    return filesAndDirs;
}

var collectFilesAndDirs = exports.collectFilesAndDirs = function (path) {
    var stat = fs.statSync(path),
        filesAndDirs = {
            files: [],
            dirs: []
        };
    if (!/\/\./.test(path)) {
        if (stat.isDirectory()) {
            filesAndDirs.dirs.push(path);
            var dirStructure = fs.readdirSync(path);
            DIRSMAP.setDirStructure(path, dirStructure);
            dirStructure
                .map(correctPath, path)
                .map(collectFilesAndDirs)
                .forEach(function (_filesAndDirs) {
                    filesAndDirs = concat(filesAndDirs, _filesAndDirs);
                });
        } else if (stat.isFile()) {
            filesAndDirs.files.push(path);
        }
    }
    return filesAndDirs;
};
