window.ls = ls_proxy(localStorage);

const mat = get("#matrix");
mat.forEach((e, i) => e.name = i);

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

    get("#output")[0].appendChild(new_node("pre", {
        innerHTML: `${str_result}` || `<br></br>`,
        style: {
            textAlignLast: "justify",
            textAlign: "justify"
        }
    }));

    _log.apply(this, arguments);
    return str_result;
};



init();

function init() {
    get("#func").forEach((parent, i) => {
        parent.name = i;

        init_modify_matrix_btn(parent);
        init_func_list(parent);
        load_matrix(parent.name);

    });
}

function init_modify_matrix_btn(parent) {


    let desc = ["Row", "Column"];
    ["row", "col"].forEach((line_type, i) => {

        let btn_line = new_node("div", {
            className: "line"
        });

        let btn_title = new_node("div", {
            className: "title",
            innerText: `${desc[i]} count:`
        });

        let btn_input = new_node("input", {
            className: "content",
            type: "number",
            id: line_type
        });
        btn_input.addEventListener("change", (e) => {
            modify_matrix(mat[parent.name], e, i);
        });

        [
            btn_title,
            btn_input
        ].forEach((e) => btn_line.appendChild(e));



        let mod_desc = ["+", "-"];
        ["add", "sub"].forEach((mod_type, mod_i) => {
            let btn_moder = new_node("button", {
                id: `${mod_type}_${line_type}`,
                innerText: mod_desc[mod_i],
                className: "content"
            });

            btn_moder.addEventListener("click", () => {
                btn_input.value = parseInt(btn_input.value) + (mod_i ? -1 : 1);
                btn_input.dispatchEvent(new Event("change"));
            });

            btn_line.appendChild(btn_moder);
        });

        parent.appendChild(btn_line);
    });

}

function init_func_list(parent) {

    let func_list = [
        "row_echelon",
        "T",
        "dot",
        "get_PLU",
        "inverse",
        "elementary_products"
    ];

    let cbbox_line = new_node("div", {
        className: "line"
    });

    let cbbox_title = new_node("div", {
        className: "title",
        innerText: `Wat to do:`
    });

    let cbbox = new_node("select", {
        className: "content",
        id: "func_selected",
        options: func_list.map((val) => new_node("option", { innerText: val }))
    });

    let cbbox_btn_equal = new_node("button", {
        id: `operate`,
        innerText: "＝",
        className: "content"
    });
    cbbox_btn_equal.addEventListener("click", () => {
        let opt = cbbox.selectedOptions[0].innerText;
        [new Matrix(ls[`matrix${parent.name}`])[opt](true)]
            .flat(Infinity)
            .forEach((m) => m.show());
    });

    let cbbox_btn_clear = new_node("button", {
        id: `operate`,
        innerText: "C",
        className: "content"
    });
    cbbox_btn_clear.addEventListener("click", () => {
        get("#output")[0].replaceWith(get("#output")[0].cloneNode());
    });

    [
        cbbox_title,
        cbbox,
        cbbox_btn_equal,
        cbbox_btn_clear
    ].forEach((node) => cbbox_line.appendChild(node));

    parent.appendChild(cbbox_line);
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
 * @param {Number} index
 * @param {String} selector 
 */
function get_input_val(index = 0, selector) {
    return parseInt(get(selector)[index].value);
}



/**
 * @param {Event} event
 * @param {Number} axis 
 * @param {Boolean} auto_save
 */
function modify_matrix(mat, event, axis, auto_save = true) {

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

    loop_in_matrix(mat.name, (e, r_i, c_i, arr) => {
        e.style.width = `${Math.max(Math.min(500 / arr.length, 100), 3)}px`;
        e.value = ls[`matrix${mat.name}`]?.[r_i]?.[c_i] || 0;
        e.parentNode.pos = r_i;
        e.pos = c_i;
        add_e_event(mat.name, e);
    });

    if (auto_save) {
        save_matrix(
            mat.name,
            get_input_val(mat.name, `#row`),
            get_input_val(mat.name, `#col`)
        );
    }
}


/**
 * @param {Number} name
 * @param {Number} row 
 * @param {Number} col 
 */
function save_matrix(name, row, col) {

    let new_mat = Matrix.zero(row, col).data;
    loop_in_matrix(name, (e, r_i, c_i) => {
        new_mat[r_i][c_i] = parseInt(e.value);
    });

    ls[`matrix${name}`] = new_mat;
    ls[`shape${name}`] = new Matrix(new_mat).shape;
}

/**
 * @param {Number} name 
 */
function load_matrix(name) {
    if (!Array.isArray(ls[`matrix${name}`]) || !Array.isArray(ls[`shape${name}`])) save_matrix(name, 2, 2);

    ["row", "col"].forEach((type, i) => get(`#${type}`)[0].value = ls[`shape${name}`][i]);

    new Array(2).fill().forEach((e, i) => modify_matrix(mat[name], {
        target: {
            value: new Matrix(ls[`matrix${name}`]).shape[i]
        }
    }, i, false));

    save_matrix(name, ...ls[`shape${name}`]);

}

/**
 * @param {Number} name 
 * @param {Function} operate 
 */
function loop_in_matrix(name, operate) {

    dimension_recursive(mat[name].children, (r, r_i) => {
        Array.from(r).forEach((e, c_i, arr) => {
            operate(e, r_i, c_i, arr);
        });
    }, 1);
}

/**
 * @param {Number} name 
 * @param {HTMLElement} e 
 */
function add_e_event(name, e) {
    e.addEventListener("change", (e) => modify_element(name, e));
}

/**
 * @param {Number} name 
 * @param {Event} event
 */
function modify_element(name, event) {
    let e = event.target;
    let mat = ls[`matrix${name}`];
    mat[e.parentNode.pos][e.pos] = parseInt(e.value);
    ls[`matrix${name}`] = mat;
}