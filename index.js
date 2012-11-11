var PATH = require('path'),
    DEFAULT_PORT = 8080,
    DEFAULT_PATH = 'pages';

require('coa').Cmd()
    .name(PATH.basename(process.argv[1]))
    .title(['File changes watcher for use with bem server.', '' +
    'See https://github.com/apsavin/bem-watcher/ for more info.'].join('\n'))
    .helpful()
    .opt()
    .name('version').title('Show version')
    .short('v').long('version')
    .flag()
    .only()
    .act(function () {
        return require('./package.json').version;
    })
    .end()
    .opt()
    .name('root').short('r').long('root')
    .title('project root (cwd by default)')
    .def(process.cwd())
    .val(function (d) {
        return PATH.resolve(d);
    })
    .end()
    .opt()
    .name('directory').short('d').long('dir')
    .title('directory to rebuild, default: ' + DEFAULT_PATH)
    .def(DEFAULT_PATH)
    .end()
    .opt()
    .name('port').short('p').long('port')
    .title('tcp port of bem server, default: ' + DEFAULT_PORT)
    .def(DEFAULT_PORT)
    .end()
    .opt()
    .name('host').long('host')
    .title('hostname of bem server, default: any')
    .end()
    .act(function (opts) {
        require('bem').api.server(opts);
        require('./watcher').watch(opts);
    })
    .run();