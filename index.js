var PATH = require('path'),
    DEFAULT_PORT = 8080;

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
    .val(function (r) {
        return PATH.resolve(r);
    })
    .end()
    .opt()
    .name('directory').short('d').long('dir')
    .title('directory to rebuild, all bundles and pages dirs by default')
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
        if (opts.directory) {
            opts.directory = [PATH.join(opts.directory, '..', PATH.basename(opts.directory).replace(PATH.sep, ''))];
        }
        else {
            opts.directory = [];
        }
        require('bem').api.server(opts);
        require('./lib/main').run(opts);
    })
    .run();