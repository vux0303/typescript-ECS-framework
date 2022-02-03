import { Archetype } from "./Archetype";
import { Component } from "./Component";
import { ClassConstructor } from "./TypeDefine";

export class Sibling extends Component {
    /** @internal */
    archetype: Archetype;
    /** @internal */
    readingRowIdx: number = -1;
    get<T extends ClassConstructor>(Ctor: T): InstanceType<T> {
        // if (!this.archetype.isContainSignal(Ctor) || this.readingRowIdx < 0) {
        //     return null;
        // }
        if (!this.archetype.components.has(Ctor) || this.readingRowIdx < 0) {
            return null;
        }
        let component = this.archetype.components.get(Ctor)[this.readingRowIdx];
        //if (!component.ecsActive) {
        return component as any;
        //} else {
        //    return null;
        //}
    }
    all(): any[] {
        let comps: any[] = [];
        this.archetype.components.forEach((pool, Ctor) => {
            comps.push(pool[this.readingRowIdx]);
        })
        return comps;
    }
}