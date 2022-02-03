import { CreateOptions } from "./Admin";
import { Itr } from "./Iterator";
import { Signal } from "./Signal";
import { Filter, FilterResultHandler, FilterToInstanceType } from "./TypeDefine";

export class Blueprint<T extends Filter, CreateOpt extends CreateOptions> {
    filter: T;
    initCB: FilterResultHandler<T>;
    overrideCB: FilterResultHandler<T>;
    signals: Signal<any>;
    pool: number = 0;
    constructor(components: T, initCB: FilterResultHandler<T>, opts?: CreateOpt) {
        if (Itr.len(components) < 1) {
            throw new Error("[ECS] can not create a Blueprint without components");
        }
        this.filter = components;
        this.initCB = initCB;
        this.signals = opts.signals;
        this.pool = opts.pool;
    }
    initChainCB(components: FilterToInstanceType<T>, entityID?: number) {
        this.initCB(components);
        if (this.overrideCB) {
            this.overrideCB(components);
        }
    }
}