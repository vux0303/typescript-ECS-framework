type ComponentInternal = {
    ecsActive: boolean;
    dirtyProperties: Set<string>;
}

export class Component {
    /** @internal */
    public internal: ComponentInternal = {
        ecsActive: false,
        dirtyProperties: null,
    };
    public activeOnCreation: boolean = false;
    public activeByAll: boolean = false;
}
