import { Component } from "./Component";
import { Itr } from "./Iterator";
import { Filter, FilterResultHandler, FilterToInstanceType } from "./TypeDefine";

export class Signal<T extends Filter> {
    components: T;
    initCB: FilterResultHandler<T>;
    overrideCB: FilterResultHandler<T>;
    isActiveByAll: boolean;
    constructor(signals: T, initCB: FilterResultHandler<T>, isActiveByAll: boolean = false) {
        if (Itr.len(signals) < 1) {
            throw new Error("[ECS] can not create a Signal without components");
        }
        this.components = signals;
        this.initCB = initCB;
        this.isActiveByAll = isActiveByAll;
    }
    initChainCB(components: FilterToInstanceType<T>, entityID?: number) {
        this.initCB(components);
        if (this.overrideCB) {
            this.overrideCB(components);
        }
    }
}