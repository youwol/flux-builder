export enum LogLevel {
    Debug,
    Info,
    Error,
}
export class LogEntry {
    date: Date
    hours = 0
    minutes = 0
    seconds = 0
    miniseconds = 0

    constructor(
        public readonly topic: string,
        public readonly message: string,
        public readonly object: Object,
        public level: LogLevel,
    ) {
        this.date = new Date()
    }
}

export class LogerConsole {
    log(e: LogEntry) {
        if (e.level == LogLevel.Info || e.level == LogLevel.Debug) {
            console.log('#' + e.topic, {
                date:
                    e.date.getHours() +
                    'h' +
                    e.date.getMinutes() +
                    'mn' +
                    e.date.getSeconds() +
                    's' +
                    e.date.getMilliseconds(),
                level: e.level,
                message: e.message,
                object: e.object,
            })
        }
        if (e.level == LogLevel.Error) {
            console.error('#' + e.topic, {
                date:
                    e.date.getHours() +
                    'h' +
                    e.date.getMinutes() +
                    'mn' +
                    e.date.getSeconds() +
                    's' +
                    e.date.getMilliseconds(),
                level: e.level,
                message: e.message,
                object: e.object,
            })
        }
    }
}

export class AppDebugEnvironment {
    debugOn = true

    WorkflowBuilderEnabled = true
    WorkflowBuilderLevel: LogLevel = LogLevel.Info

    workflowViewEnabled = true
    workflowViewLevel: LogLevel = LogLevel.Info

    workflowView$Enabled = true
    workflowView$Level: LogLevel = LogLevel.Info

    observableEnabled = true
    observableLevel: LogLevel = LogLevel.Info

    renderTopicEnabled = true
    renderTopicLevel: LogLevel = LogLevel.Info

    appTopicEnabled = true
    appTopicLevel: LogLevel = LogLevel.Info

    workflowUIEnabled = true

    loger = new LogerConsole()

    constructor({
        WorkflowBuilder,
        workflowView,
        observable,
        UI,
        renderTopicLevel,
    }: {
        WorkflowBuilder: LogLevel
        workflowView: LogLevel
        UI: LogLevel
        observable: LogLevel
        renderTopicLevel: LogLevel
        appTopicLevel: LogLevel
    }) {
        this.WorkflowBuilderLevel = WorkflowBuilder
        this.observableLevel = observable
        this.renderTopicLevel = renderTopicLevel
    }

    logWorkflowBuilder({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.WorkflowBuilderEnabled &&
            level >= this.WorkflowBuilderLevel &&
            this.loger.log(
                new LogEntry('WorkflowBuilder', message, object, level),
            )
    }

    logObservable({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.observableEnabled &&
            level >= this.observableLevel &&
            this.loger.log(new LogEntry('Observables', message, object, level))
    }
    logWorkflowView({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.workflowViewEnabled &&
            level >= this.workflowViewLevel &&
            this.loger.log(new LogEntry('WorkflowView', message, object, level))
    }
    logWorkflowView$({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.workflowView$Enabled &&
            level >= this.workflowView$Level &&
            this.loger.log(
                new LogEntry(
                    'WorkflowView Observables',
                    message,
                    object,
                    level,
                ),
            )
    }
    logRenderTopic({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.renderTopicEnabled &&
            level >= this.renderTopicLevel &&
            this.loger.log(new LogEntry('Render', message, object, level))
    }
    logAppTopic({
        level,
        message,
        object,
    }: {
        level: LogLevel
        message: string
        object: Object
    }) {
        this.appTopicEnabled &&
            level >= this.appTopicLevel &&
            this.loger.log(new LogEntry('App', message, object, level))
    }

    private static instance: AppDebugEnvironment | undefined = undefined

    static getInstance() {
        if (!AppDebugEnvironment.instance) {
            AppDebugEnvironment.instance = new AppDebugEnvironment({
                WorkflowBuilder: LogLevel.Info,
                workflowView: LogLevel.Info,
                UI: LogLevel.Info,
                observable: LogLevel.Info,
                renderTopicLevel: LogLevel.Info,
                appTopicLevel: LogLevel.Info,
            })
        }
        return AppDebugEnvironment.instance
    }
}
