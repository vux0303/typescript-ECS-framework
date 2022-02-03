"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
/** @internal */
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.isSetEqual = function (as, bs) {
        var e_1, _a;
        if (as.size !== bs.size)
            return false;
        try {
            for (var as_1 = __values(as), as_1_1 = as_1.next(); !as_1_1.done; as_1_1 = as_1.next()) {
                var a = as_1_1.value;
                if (!bs.has(a))
                    return false;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (as_1_1 && !as_1_1.done && (_a = as_1.return)) _a.call(as_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    };
    Utils.isSetContain = function (source, target) {
        var e_2, _a;
        if (source.size < target.size)
            return false;
        try {
            for (var target_1 = __values(target), target_1_1 = target_1.next(); !target_1_1.done; target_1_1 = target_1.next()) {
                var a = target_1_1.value;
                if (!source.has(a))
                    return false;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (target_1_1 && !target_1_1.done && (_a = target_1.return)) _a.call(target_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return true;
    };
    return Utils;
}());
exports.Utils = Utils;
