import { Filter, FilterResultHandler, FilterToInstanceType } from "./TypeDefine";
export declare class Signal<T extends Filter> {
    components: T;
    initCB: FilterResultHandler<T>;
    overrideCB: FilterResultHandler<T>;
    isActiveByAll: boolean;
    constructor(signals: T, initCB: FilterResultHandler<T>, isActiveByAll?: boolean);
    initChainCB(components: FilterToInstanceType<T>, entityID?: number): void;
}
