from youwol.environment.forward_declaration import YouwolEnvironment
from youwol.environment.models import IPipelineFactory
from youwol.environment.models_project import BrowserApp, Execution, FromAsset
from youwol.pipelines.pipeline_typescript_weback_npm import pipeline, PipelineConfig
from youwol_utils.context import Context


class PipelineFactory(IPipelineFactory):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    async def get(self, _env: YouwolEnvironment, context: Context):
        config = PipelineConfig(
            with_tags=["flux"],
            target=BrowserApp(
                icon={"class": "fas fa-tools"},
                displayName="Flux builder",
                execution=Execution(
                    standalone=False,
                    parametrized=[
                        FromAsset(
                            match={"kind": "flux-project"},
                            parameters={"id": 'rawId'}
                        )
                    ]
                )
            )
        )
        return await pipeline(config, context)
