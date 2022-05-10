/**
 * @param {string} selector
 * @param {HTMLElement} ref
 * @returns {Array<HTMLElement>}
 */
window.get = (selector, ref = document) => {
    return Array.from(ref.querySelectorAll(selector)).map((e) => {
        e.get = (selector) => window.get(selector, e);
        return e;
    });
}

/**
 * @param {string} tagname
 * @param {object} properties
 * @returns {HTMLElement}
 */
function new_node(tagname, properties = {}) {
    let property_modifier = (obj, properties) => {
        for (let key of Object.keys(properties)) {
            (
                (typeof (obj[key]) === 'object') ?
                    (property_modifier(obj[key], properties[key]))
                    :
                    (obj[key] = properties[key])
            );
        }

        return obj;
    };
    return property_modifier(document.createElement(tagname), properties);
}

/**
 * @param {object} obj 
 * @param {Array<String>} keys 
 * @returns {Void} 
 */
function ls_proxy(obj, keys = []) {
    return new Proxy(obj, { get, set });

    function get(obj, p, is_proxy = true) {

        if (!p.toString()) return obj;

        let result = obj;
        for (let k of p.toString().split(',')) {
            if (k in result) result = result[k];
            else break;
        }

        try {
            result = JSON.parse(result);
        }
        catch { }

        if (!Array.isArray(result) && typeof (result) === 'object' && is_proxy) {
            result = ls_proxy(result, keys.concat(p));
        }

        return result;
    }

    function set(obj, p, val) {

        if (keys.length !== 0) {
            let original_key = keys.shift();
            let pre_obj = get(localStorage, original_key, false);
            get(pre_obj, keys, false)[p] = val;

            localStorage[original_key] = JSON.stringify(pre_obj);
        }

        obj[p] = JSON.stringify(val);
    }

}

let outputing = 0;
const _log = console.log.bind(console);
console.log = function () {

    let str_result = Object.values(arguments)
        .map((e) => {
            if (Array.isArray(e)) {
                return `[${e}]`;
            }
            else if (typeof (e) === "object") {
                let r = e;
                try {
                    r = JSON.stringify(e);
                }
                catch { }
                return r;
            }
            else {
                return e;
            }
        })
        .join();

    get("#output")[outputing].appendChild(new_node("pre", {
        innerHTML: `${str_result}` || `<br></br>`,
        style: {
            textAlignLast: "justify",
            textAlign: "justify"
        }
    }));

    _log.apply(this, arguments);
    return str_result;
};
