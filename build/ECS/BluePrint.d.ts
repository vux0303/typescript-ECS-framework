import { CreateOptions } from "./Admin";
import { Signal } from "./Signal";
import { Filter, FilterResultHandler, FilterToInstanceType } from "./TypeDefine";
export declare class Blueprint<T extends Filter, CreateOpt extends CreateOptions> {
    filter: T;
    initCB: FilterResultHandler<T>;
    overrideCB: FilterResultHandler<T>;
    signals: Signal<any>;
    pool: number;
    constructor(components: T, initCB: FilterResultHandler<T>, opts?: CreateOpt);
    initChainCB(components: FilterToInstanceType<T>, entityID?: number): void;
}
