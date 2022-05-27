from youwol.environment.forward_declaration import YouwolEnvironment
from youwol.environment.models import IPipelineFactory
from youwol.environment.models_project import BrowserApp, Execution, BrowserAppGraphics, OpenWith
from youwol.pipelines.pipeline_typescript_weback_npm import pipeline, PipelineConfig
from youwol_utils.context import Context


class PipelineFactory(IPipelineFactory):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def get(self, _env: YouwolEnvironment, context: Context):
        config = PipelineConfig(
            with_tags=["flux"],
            target=BrowserApp(
                displayName="Flux builder",
                execution=Execution(
                    standalone=False,
                    parametrized=[
                        OpenWith(
                            match={"kind": "flux-project"},
                            parameters={"id": 'rawId'}
                        )
                    ]
                ),
                graphics=BrowserAppGraphics(
                    appIcon={'class': 'fas fa-tools fa-2x'},
                    fileIcon={'class': 'fas fa-tools'},
                    background={
                        "style": {
                            "width": '100%',
                            "height": '100%',
                            "opacity": 0.3,
                            "z-index": -1,
                        }
                    }
                ),
            )
        )
        return await pipeline(config, context)
