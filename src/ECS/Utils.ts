/** @internal */
export class Utils {
    static isSetEqual(as: Set<any>, bs: Set<any>) {
        if (as.size !== bs.size) return false;
        for (var a of as) if (!bs.has(a)) return false;
        return true;
    }

    static isSetContain(source: Set<any>, target: Set<any>) {
        if (source.size < target.size) return false;
        for (var a of target) if (!source.has(a)) return false;
        return true;
    }
}