import shutil
from pathlib import Path

from youwol.pipelines.pipeline_typescript_weback_npm import Template, PackageType, Dependencies, \
    RunTimeDeps, generate_template, DevServer
from youwol_utils import parse_json

folder_path = Path(__file__).parent

pkg_json = parse_json(folder_path / 'package.json')


template = Template(
    path=folder_path,
    type=PackageType.Application,
    name=pkg_json['name'],
    version=pkg_json['version'],
    shortDescription=pkg_json['description'],
    author=pkg_json['author'],
    dependencies=Dependencies(
        runTime=RunTimeDeps(
            load={
                '@youwol/flux-svg-plots': '^0.0.1',
                'js-beautify': '^1.14.6',
                '@youwol/fv-tree': '^0.2.3',
                'grapesjs': '0.18.3',
                '@youwol/fv-group': '^0.2.1',
                '@youwol/flux-view': '^1.0.3',
                '@youwol/fv-button': '^0.1.1',
                'lodash': '^4.17.15',
                '@youwol/logging': '^0.0.2',
                '@youwol/cdn-client': '^1.0.2',
                '@youwol/os-top-banner': '^0.1.1',
                '@youwol/fv-tabs': '^0.2.1',
                '@youwol/fv-input': '^0.2.1',
                '@youwol/flux-core': '^0.2.1',
                '@youwol/fv-context-menu': '^0.1.1',
                'rxjs': '^6.5.5',
                'd3-selection': "^3.0.0",
                'd3-drag': '^3.0.0',
                # d3-scale & d3-zoom are needed (peer dependencies) by flux-svg-plots until we migrate
                # it to the up-to-date config
                'd3-scale': '^4.0.2',
                'd3-zoom': '^3.0.0'
            },
            differed={'codemirror': '^5.52.0'},
            includedInBundle=['d3-selection', 'd3-drag', "d3-scale", "d3-zoom"]
        ),
        devTime={
            'ts-mockito': '^2.6.1'
        }
    ),
    userGuide=True,
    devServer=DevServer(
        port=3005
    )
)

generate_template(template)

shutil.copyfile(
    src=folder_path / '.template' / 'src' / 'auto-generated.ts',
    dst=folder_path / 'src' / 'auto-generated.ts'
)

for file in ['README.md', '.gitignore', '.npmignore', '.prettierignore', 'LICENSE', 'package.json',
             'tsconfig.json', 'webpack.config.ts']:
    shutil.copyfile(
        src=folder_path / '.template' / file,
        dst=folder_path / file
    )


