export class PlotterEntity {
    constructor(
        public readonly id: string,
        public readonly classes: Array<string>,
        public readonly data: any,
    ) {}
}

export class PlotterConnectionEntity extends PlotterEntity {
    constructor(
        public readonly id: string,
        public readonly classes: Array<string>,
        public readonly inputGroup,
        public readonly outputGroup,
        public readonly data: any,
        public readonly adaptor = undefined,
    ) {
        super(id, classes, data)
    }
}
