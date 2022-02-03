import { ClassConstructor, ConstructorArray, Filter, FilterToInstanceType } from "./TypeDefine";
/** @internal */
export class Itr {
    static every<T extends Filter>(target: T, callBack: (value: ClassConstructor<any>) => boolean): boolean {
        if (Array.isArray(target)) {
            return target.every(callBack);
        } else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).every((key) => { return callBack(target[key]) });
        }
    }

    static forEach<T extends Filter>(target: T, callBack: (value: ClassConstructor, setTo: (value: any) => void) => void): void {
        if (Array.isArray(target)) {
            return target.forEach((Ctor, idx) => { callBack(Ctor, (value) => { target[idx] = value }) });
        } else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).forEach((key) => { callBack(target[key], (value) => { target[key] = value }) });
        }
    }

    static map<T extends Filter>(target: T, callBack: (value: ClassConstructor<any>) => any): FilterToInstanceType<T> {
        let returnObj: any;
        if (Array.isArray(target)) {
            returnObj = target.map(callBack);
            return returnObj;
        } else if (typeof target === 'object' && target !== null) {
            returnObj = {};
            Object.keys(target).forEach((key) => { returnObj[key] = callBack(target[key]) });
            return returnObj;
        }
    }

    static some<T extends Filter>(target: T, callBack: (value: ClassConstructor<any>) => boolean): boolean {
        if (Array.isArray(target)) {
            return target.some(callBack);
        } else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).some((key) => { callBack(target[key]) });
        }
    }

    static len<T extends Filter>(target: T): number {
        if (Array.isArray(target)) {
            return target.length;
        } else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).length;
        }
    }

    static filterToArray<T extends Filter>(target: T): ConstructorArray {
        let narrowedComponents: ConstructorArray;
        if (typeof target === 'object' && target !== null) {
            narrowedComponents = Object.keys(target).map((key) => {
                return target[key];
            })
        } else if (Array.isArray(target)) {
            narrowedComponents = target;
        }
        return narrowedComponents;
    }
}