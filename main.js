window.ls = ls_proxy(localStorage);

init();

function init() {

    get_mat().forEach((parent) => {

        init_modify_matrix_btn(parent);
        init_func_list(parent);
        load_matrix(parent.name);

        parent.inited = true;
    });
}

function init_modify_matrix_btn(parent) {

    if (parent.inited) return;

    let add_btn = get("#add_matrix")[0];
    if (!add_btn.add_inited) {
        get("#add_matrix")[0].addEventListener("click", () => {
            let new_mat = base_mat.cloneNode(true);
            new_mat.name = get_mat().length;
            new_mat.children[1].innerText = to_alpha_name(new_mat.name);

            get("body")[0].insertBefore(new_mat, get("#add_matrix")[0]);

            init();
        });
        add_btn.add_inited = true;
    }


    get(".delete_matrix").forEach((btn, i) => {

        btn.innerText = `delete ${to_alpha_name(i)}`;

        let n_btn = btn.cloneNode(true);

        btn.replaceWith(n_btn);

        n_btn.addEventListener("click", (e) => {

            let i = e.target.parentNode.name;

            // console.log(e.target, i, get_mat()[i]);
            get_mat()[i].remove();

            init();
        });

    });

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
            id: line_type,
            value: Array.isArray(ls[`shape${parent.name}`]) ? ls[`shape${parent.name}`][i] : 2
        });
        btn_input.addEventListener("change", (e) => {
            modify_matrix(parent, e, i);
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
                btn_input.value = parseInt(ls[`shape${parent.name}`][i] || btn_input.value) + (mod_i ? -1 : 1);
                btn_input.dispatchEvent(new Event("change"));
                save_shape(parent.name, btn_input.value, i);
            });

            btn_line.appendChild(btn_moder);
        });

        parent.get("#func")[0].appendChild(btn_line);
    });

}

function init_func_list(parent) {

    if (parent.inited) return;

    let func_list = [
        "row_echelon",
        "T",
        "dot",
        "add",
        "get_PLU",
        "inverse",
        "elementary_products",
        "get_val"
    ];

    let need_choose_matrix = [
        "dot",
        "add"
    ];

    let det_func = [
        "get_val"
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
    cbbox.addEventListener("change", (e) => {

        get("#func")[parent.name].get("#func_selected_ex")[0]?.parentNode.remove();

        let op_btn = get("#operate")[parent.name];
        op_btn.disabled = true;
        op_btn.use_det = false;
        op_btn.use_matrix = false;

        let now_opt = e.target.selectedOptions[0].innerText;

        if (need_choose_matrix.includes(now_opt)) {
            op_btn.use_matrix = -1;

            let cbbox_ex_line = new_node("div", {
                className: "line",
                style: {
                    marginRight: "66px"
                }
            });

            let cbbox_ex_title = new_node("div", {
                className: "title",
                innerText: `Wat to use:`
            });

            let cbbox_ex_opt = new_node("select", {
                className: "content",
                id: "func_selected_ex",
                options: get_mat().map((n) => new_node("option", { innerText: to_alpha_name(n.name) }))
            });
            cbbox_ex_opt.addEventListener("change", () => {
                op_btn.use_matrix = cbbox_ex_opt.selectedOptions[0]?.innerText.charCodeAt() - 65;
                op_btn.disabled = op_btn.use_matrix == -1;
            });

            [
                cbbox_ex_title,
                cbbox_ex_opt
            ].forEach((node) => cbbox_ex_line.appendChild(node));

            get("#func")[parent.name].appendChild(cbbox_ex_line);
            cbbox_ex_opt.dispatchEvent(new Event("change"));
        }
        else if (det_func.includes(now_opt)) {
            op_btn.use_det = true;
            op_btn.disabled = false;
        }
        else {
            op_btn.disabled = false;
        }


    });

    let cbbox_btn_equal = new_node("button", {
        id: `operate`,
        innerText: "＝",
        className: "content"
    });
    cbbox_btn_equal.addEventListener("click", (e) => {
        let opt = cbbox.selectedOptions[0].innerText;
        let cls = e.target.use_det ? Detemerinant : Matrix;
        let param = e.target.use_matrix != undefined ? [new cls(ls[`matrix${e.target.use_matrix}`]), e.target.use_det] : [true];


        [new cls(ls[`matrix${parent.name}`])[opt](...param)]
            .flat(Infinity)
            .forEach((m) => {
                outputing = parent.name;
                m.show ? m.show() : console.log(m);
            });
    });

    let cbbox_btn_clear = new_node("button", {
        id: `clear`,
        innerText: "C",
        className: "content"
    });
    cbbox_btn_clear.addEventListener("click", () => {
        get("#output")[parent.name].replaceWith(get("#output")[parent.name].cloneNode());
    });

    [
        cbbox_title,
        cbbox,
        cbbox_btn_equal,
        cbbox_btn_clear
    ].forEach((node) => cbbox_line.appendChild(node));

    parent.get("#func")[0].appendChild(cbbox_line);
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
 * @param {Number} index
 * @param {String} selector 
 */
function get_input_val(index = 0, selector) {
    return parseInt(get(selector)[index].value || ls[`shape${index}`][({ row: 0, col: 1 }[selector.slice(1)])]);
}



/**
 * @param {Event} event
 * @param {Number} axis 
 * @param {Boolean} auto_save
 */
function modify_matrix(mat, event, axis, auto_save = true) {

    let count = Math.max(event.target.value, 1);
    event.target.value = count;

    dimension_recursive(mat.content, (r, r_i) => {

        Array.from(r).slice(count).forEach((e) => e.remove());

        new Array(count - r.length).fill()
            .forEach((e, i) => {

                let new_line = (r[0] || [base_row, base_col][axis]).cloneNode(true);
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
            ...[`row`, `col`].map((e) => get_input_val(mat.name, `#${e}`))
        );
    }
}

function get_mat() {
    return get("#matrix").map((parent, i) => {
        parent.content = parent.get(".content")[0].children;
        parent.name = i;
        return parent;
    });
}


/**
 * @param {Number} name
 * @param {Number} row 
 * @param {Number} col 
 */
function save_matrix(name, row, col) {

    let new_mat = Matrix.zero(row, col).data;

    loop_in_matrix(name, (e, r_i, c_i) => {
        //console.log(row, col, r_i[0], c_i, new_mat[r_i[0]], new_mat[r_i[0]][c_i], new_mat);
        new_mat[r_i[0]][c_i] = parseInt(e.value);
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

    new Array(2).fill().forEach((e, i) => modify_matrix(get_mat()[name], {
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

    dimension_recursive(get_mat()[name].content, (r, r_i) => {
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
    e.addEventListener("change", (e) => save_element(name, e));
}

/**
 * @param {Number} name 
 * @param {Event} event
 */
function save_element(name, event) {
    let e = event.target;
    let mat = ls[`matrix${name}`];
    mat[e.parentNode.pos][e.pos] = parseInt(e.value);
    ls[`matrix${name}`] = mat;
}

/**
 * @param {Number} name 
 * @param {Number} value
 * @param {Number} i
 */
function save_shape(name, value, i) {
    let temp = ls[`shape${name}`];
    temp[i] = parseInt(value);
    ls[`shape${name}`] = temp;
}

/**
 * @param {Number} n 
 * @returns 
 */
function to_alpha_name(n) {
    return String.fromCharCode(parseInt(n) + 65);
}