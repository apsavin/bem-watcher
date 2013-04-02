var fs = require('fs'),
    PATH = require('path'),
    http = require('http'),
    _ = require('underscore'),
    borschik = require('borschik').api,
    URL = require('url'),
    directories = [],
    root = '',
    urlObject = {
        protocol: 'http',
        hostname: 'localhost'
    };

function getBemServerUrl (path, bundle) {
    var concreteUrlObject = _.clone(urlObject),
        ext = PATH.extname(path);
    if (ext) {
        concreteUrlObject.pathname = buildFileName(bundle, ext, ext === '.html' ? '' : '_');
    } else {
        concreteUrlObject.pathname = bundle;
    }
    return URL.format(concreteUrlObject);
}

function buildFileName (path, ext, prefix) {
    var name = PATH.basename(path);
    if (name.indexOf('_') === 0) {
        name = PATH.basename(PATH.join(path, '..')) + name;
    }
    return PATH.join(path, prefix + name + ext);
}

function getBorschikParams (file, bundle) {
    var suffixes = getTechSuffixes(file),
        tech;
    switch (suffixes[1]){
        case 'css':
            tech = 'css-fast';
            break;
        case 'styl':
            tech = PATH.join(root, '.bem/techs/styl+css.borschik.js');
            suffixes[0] = '.css';
            break;
        default:
            tech = suffixes[1];
    }
    return {
        tech: tech,
        input: buildFileName(bundle, suffixes[0], ''),
        output: buildFileName(bundle, suffixes[0], '_')
    }
}

function getTechSuffixes (path) {
    return path.match(/\.(.*)/) || [''];
}

exports.fileChangesCallback = function (path) {
    var suffix = getTechSuffixes(path)[0];
    //todo: implement getBorschikTechs and isBorschikTech
    switch (suffix) {
        case '.js':
        case '.css':
        case '.styl':
        case '.ie.css':
            console.log('start update ' + path);
            directories.forEach(function (bundle) {
                borschik(getBorschikParams(path, bundle));
            });
            console.log('end update ' + path);
            break;
        case '':
            break;
        default:
            processPathThrowBemServer(path, suffix);
    }
};

function processPathThrowBemServer (path, suffix) {
    suffix = suffix || getTechSuffixes(path)[0];
    //todo: implement isIgnoredTech
    switch (suffix) {
        case '.html.php':
        case '.html.bemtwig':
            break;
        case '.bemjson.js':
        case '.bemdecl.js':
        case '.deps.js':
        case '.bemhtml':
            path = '';
        default:
            directories.forEach(function (bundle) {
                http.get(getBemServerUrl(path, bundle)).on('error', function (err) {
                    console.log(err);
                });
            });
    }
}

exports.fileAddedCallback = function (path) {
    processPathThrowBemServer(path);
};

exports.fileRemovedCallback = function () {
    processPathThrowBemServer('', ' ');
};

exports.setEnv = function (opts) {
    root = opts.root;
    urlObject.port = opts.port;
    urlObject.hostname = opts.host || urlObject.hostname;
    directories = opts.directory;
};
