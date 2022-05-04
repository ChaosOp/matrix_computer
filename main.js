window.ls = ls_proxy(localStorage);
const mat = get("#matrix")[0];

const base_element = new_node("input", {
    className: "element",
    type: "text"
});
add_e_event(base_element);

const base_row = new_node("div", {
    className: "line",
    children: [base_element.cloneNode(true)]
});



init();

function init() {

    load_matrix();

    ["row", "col"].forEach((line_type, i) => {

        let line = get(`#${line_type}`)[0];

        ["add", "sub"].forEach((mod_type, mod_i) => {
            get(`#${mod_type}_${line_type}`)[0].addEventListener("click", () => {
                line.value = parseInt(line.value) + (mod_i ? -1 : 1);
                line.dispatchEvent(new Event("change"));
            });
        });

        line.value = ls.shape[i];
        line.addEventListener("change", (e) => {
            modify_matrix(e, i);
        });

    });

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

/**
 * @param {String} selector 
 */
function get_input_val(selector) {
    return parseInt(get(selector)[0].value);
}



/**
 * @param {Event} event
 * @param {Number} axis 
 * @param {Boolean} auto_save
 */
function modify_matrix(event, axis, auto_save = true) {

    let count = Math.max(event.target.value, 1);
    event.target.value = count;

    dimension_recursive(mat.children, (r, r_i) => {

        Array.from(r).slice(count).forEach((e) => e.remove());

        new Array(count - r.length).fill()
            .forEach((e, i) => {
                let new_line = r[0].cloneNode(true);
                new_line.pos = i;
                r[0].parentNode.appendChild(new_line);
            });

    }, axis);

    loop_in_matrix((e, r_i, c_i, arr) => {
        e.style.width = `${Math.max(Math.min(1000 / arr.length, 100), 3)}px`;
        e.value = ls.matrix?.[r_i]?.[c_i] || 0;
        e.parentNode.pos = r_i;
        e.pos = c_i;
        add_e_event(e);
    });

    if (auto_save) save_matrix(get_input_val("#row"), get_input_val("#col"));
}


/**
 * @param {Number} row 
 * @param {Number} col 
 */
function save_matrix(row, col) {

    let new_mat = Matrix.zero(row, col).data;
    loop_in_matrix((e, r_i, c_i) => {
        new_mat[r_i][c_i] = e.value;
    });

    ls.matrix = new_mat;
    ls.shape = new Matrix(new_mat).shape;
}

function load_matrix() {
    if (!Array.isArray(ls.matrix)) save_matrix(2, 2);

    ["row", "col"].forEach((type, i) => get(`#${type}`)[0].value = ls.shape[i]);

    new Array(2).fill().forEach((e, i) => modify_matrix({
        target: {
            value: new Matrix(ls.matrix).shape[i]
        }
    }, i, false));

    save_matrix(...ls.shape);

}

/**
 * @param {Function} operate 
 */
function loop_in_matrix(operate) {
    dimension_recursive(mat.children, (r, r_i) => {
        Array.from(r).forEach((e, c_i, arr) => {
            operate(e, r_i, c_i, arr);
        });
    }, 1);
}

/**
 * @param {HTMLElement} e 
 */
function add_e_event(e) {
    e.addEventListener("change", modify_element);
}

/**
 * @param {Event} event
 */
function modify_element(event) {
    let e = event.target;
    let mat = ls.matrix;
    mat[e.parentNode.pos][e.pos] = e.value;
    ls.matrix = mat;
}