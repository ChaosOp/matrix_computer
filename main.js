window.ls = ls_proxy(localStorage);
const mat = get("#matrix")[0];

init();

function init() {

    ["row", "col"].forEach((line_type, i) => {

        let line = get(`#${line_type}`)[0];

        ["add", "sub"].forEach((mod_type, mod_i) => {
            get(`#${mod_type}_${line_type}`)[0].addEventListener("click", () => {
                line.value = parseInt(line.value) + (mod_i ? -1 : 1);
                line.dispatchEvent(new Event("change"));
            });
        });

        line.value = 2;
        line.addEventListener("change", (e) => {
            modify_line(e, i);

            ls.matrix = new Array(get(`#row`)[0].value).fill().map(() => new Array(get(`#col`)[0].value).fill());
            dimension_recursive(mat.children, (r, r_i) => {
                Array.from(r).forEach((e, c_i) => {
                    ls.matrix[r_i][c_i] = e.value;
                });
            }, 1);

        });

    });

    get(".element").forEach((e) => e.value = 0);

    /**
     * @param {Event} event
     * @param {Number} axis 
     */
    function modify_line(event, axis) {
        let count = Math.max(event.target.value, 1);
        event.target.value = count;

        dimension_recursive(mat.children, (r) => {

            Array.from(r).slice(count).forEach((e) => e.remove());

            new Array(count - r.length)
                .fill()
                .forEach(() => {
                    let new_line = r[0].cloneNode(true);

                    (axis ?
                        new_line.value = 0
                        :
                        Array.from(new_line.children).forEach((e) => e.value = 0)
                    );

                    r[0].parentNode.appendChild(new_line);
                });

        }, axis);
    }

    /**
     * @param {Event} event
     */
    function element_modify(event) {

    }
}

/**
 * @param {Any} ref 
 * @param {(ref, indexes)=>ref} operate 
 * @param {Number} depth
 * @param {Array<Number>} indexes 
 * @param {Array<Array>} arrays 
 * @returns {Any}
 */
function dimension_recursive(ref, operate = (ref, indexes) => ref, depth = Infinity, indexes = [], arrays = []) {

    return (
        (is_kind_arr(ref) && depth--) ?
            Array.from(ref).map((r, i) => dimension_recursive(r.children ?? [], operate, depth, indexes.concat(i), arrays.concat(ref)))
            :
            operate(ref, indexes, arrays)
    );
}

/**
 * @param {Any} ref 
 * @returns {Boolean}
 */
function is_kind_arr(ref) {
    return (Array.isArray(ref) || ref.toString().match(/Collection|List/i));
}



/**
 * @param {string} selector
 * @param {HTMLElement} ref
 * @returns {Array<HTMLElement>}
 */
function get(selector, ref = document) {
    return Array.from(ref.querySelectorAll(selector));
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

