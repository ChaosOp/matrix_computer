class Ex_num {
    /**
     * @param {String} expr 
     */
    constructor(expr) {

        let matches = expr.match(/(-?[0-9]*[a-zA-Z](\^[0-9]+)?)|(-?[0-9]+)/g) ?? [];

        this.val = 0;
        this.sym = "";
        this.powers = {};
        console.log(matches);
        matches.forEach((e) => {

            let val = parseInt(e.match(/(\^?-?[0-9]+)/g).filter((m) => !m.match(/\^/))?.[0]) || 0;
            let sym = e.match(/(-?[a-zA-Z](\^[0-9]+)?)/g)?.[0] ?? "";
            let power = parseInt(sym.match(/-?[0-9]+/g)?.[0]) || 1;
            sym = sym.match(/(-?[a-zA-Z])/g)?.[0] ?? "";

            if (!this.powers[sym]) this.powers[sym] = 0;
            while (power--) this.powers[sym]++;

            this.sym += sym;
            this.val += val;

        });
    }
}

let color_wrap = (text, ground, r, g, b) => `\x1b[${ground};2;${r};${g};${b}m${text}\x1b[0m`;
color_wrap = (text, ground, r, g, b) => text;
let fg_wrap = (text) => color_wrap(text, 38, 246, 201, 255);
let bg_wrap_1 = (text) => color_wrap(text, 48, 111, 79, 117);
let bg_wrap_2 = (text) => color_wrap(text, 48, 101, 43, 112);
class Matrix {

    /**
     * @param {Array} value 
     */
    constructor(value) {
        this.data = value;
        this.shape = [];
        while (Array.isArray(value)) {
            this.shape.push(value.length);
            value = value[0];
        }
    }


    /**
     * @param {Boolean} output 
     * @param {Array<Matrix>} repeats
     * @param {Array<((matrix: Matrix, index: Number, ratio: Number, operate: Number )=>Boolean)>} rp_cond
     * @param {Number} use_operate (swap rows), (multi a row by C), (multi rowA by C & add to rowB)
     * @returns {Matrix}
     */
    row_echelon(output = false, repeats = [], rp_cond = [() => { }], process_pre_row = true, use_operate = 0b111) {

        let temp = deep_copy(this.data);
        if (output) new Matrix(temp).show();

        for (let row_i = 0; row_i < temp.length; row_i++) {

            let row = temp[row_i];

            let now_lead = row.findIndex((e) => e != 0);
            if (now_lead == -1) continue;

            if (use_operate & 0b010) {

                let now_ratio = 1 / (row[now_lead] ? row[now_lead] : 1);
                let temp_output = output && now_ratio != 1;
                let multi_C = (rows) => rows[row_i] = rows[row_i].map((e) => e * now_ratio);
                if (temp_output) console.log(fg_wrap(`row${row_i + 1} *= ${now_ratio}`));

                row = multi_C(temp);
                if (temp_output) new Matrix(temp).show(bg_wrap_1);

                repeats.forEach((mat, i) => {

                    if (mat.shape[0] <= row_i) return;
                    if (rp_cond[i]?.(mat, i, now_ratio, 0b010) === false) return;

                    multi_C(mat.data);
                    if (temp_output) {
                        console.log(i);
                        mat.show(bg_wrap_2);
                    }

                });
                if (temp_output) console.log();
            }


            if (!(use_operate & 0b101)) continue;

            for (let o_row_i in new Array(temp.length).fill()) {

                if (row_i == o_row_i) continue;
                if (!process_pre_row && row_i > o_row_i) continue;

                let o_row = temp[o_row_i];
                if (o_row) {

                    let o_lead = o_row.findIndex((e) => e != 0);
                    if (o_lead == -1) continue;

                    let ratio = 1;
                    let do_operate = () => { };
                    let op = 0b000;
                    let msg = `row${parseInt(o_row_i) + 1} `;

                    if ((now_lead > o_lead) && (row_i < o_row_i) && (use_operate & 0b100)) {
                        do_operate = (rows) => {
                            rows[o_row_i] = [
                                deep_copy(rows[row_i]),
                                rows[row_i] = deep_copy(rows[o_row_i])
                            ][0];
                        };
                        op = 0b100;
                        msg += `<=> row${row_i + 1}`;
                    }
                    else if ((now_lead >= o_lead) && (use_operate & 0b001)) {
                        ratio = o_row[now_lead] / (row[now_lead] ? row[now_lead] : o_row[now_lead]);
                        do_operate = (rows) => rows[o_row_i] = new Matrix(rows[o_row_i]).add(new Matrix(rows[row_i]).multi(-ratio)).data;

                        op = 0b001;
                        msg += `+= (row${row_i + 1} * ${-ratio})`;
                    }
                    else continue;

                    if (output) console.log(fg_wrap(msg));

                    do_operate(temp);
                    if (output) new Matrix(temp).show(bg_wrap_1);

                    repeats.forEach((mat, i) => {

                        if (mat.shape[0] <= row_i) return;
                        if (rp_cond[i]?.(mat, i, ratio, op) === false) return;

                        do_operate(mat.data);

                        if (output) {
                            console.log(i);
                            mat.show(bg_wrap_2);
                        }
                    });

                    if (output) console.log();

                    if (op & 0b100) {
                        row_i = -1;
                        break;
                    }

                }
            }

        }

        return new Matrix(temp);
    }


    /**
     * @returns {Matrix}
     */
    T() {
        let temp = deep_copy(this.data);
        let result = new Array(temp[0].length).fill().map(() => []);

        for (let row in temp) {
            for (let col in temp[row]) {
                result[col].push(temp[row][col]);
            }
        }

        return new Matrix(result);
    }


    /**
     * @param {Matrix} matrix 
     * @returns {Matrix}
     */
    dot(matrix) {

        if (this.shape.length !== matrix.shape.length) {
            console.log("unmatched dimension.");
            return;
        }

        if (this.shape[1] !== matrix.shape[0]) {
            console.log("unmatched shape.");
            return;
        }

        let a = deep_copy(this.data);
        let b = deep_copy(matrix.data);
        let result = new Array(a.length).fill().map((e, i) => new Array(b[i].length).fill());

        for (let row in result) {
            for (let col in result[row]) {
                result[row][col] = a[row].reduce((s, e, i) => s + (e * b[i][col]), 0);
            }
        }

        return new Matrix(result);
    }


    /**
     * @param {Matrix} matrix
     * @returns {Matrix}
     */
    add(matrix) {

        if (this.shape.some((e, i) => e !== matrix.shape[i])) {
            console.log("unmatched shape.");
            return this;
        }

        return new Matrix(
            Matrix.dimension_recursive(
                this.data,
                (r, i) => r + Matrix.get_val_recursive(matrix.data, i)
            )
        );
    }

    /**
     * @param {Number} matrix
     * @returns {Matrix}
     */
    multi(val) {
        return new Matrix(
            Matrix.dimension_recursive(
                this.data,
                (r, i) => r * val
            )
        );
    }

    /**
     * @param {Boolean} output
     * @returns {Array<Matrix>}
     */
    get_PLU(output = false) {
        let P = Matrix.eye(this.shape[0]);
        let L = Matrix.eye(this.shape[0]);
        let U = this.row_echelon(output, [P, L], [(m, i, r, op) => !!(op & 0b100), () => true], false);
        return [P, P.dot(L.inverse(output)), U];
    }

    /**
     * @param {Boolean} output
     * @returns {Matrix}
     */
    inverse(output = false) {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let eye = Matrix.eye(this.shape[0]);
        this.row_echelon(output, [eye], [() => true]);

        return eye;
    }

    /**
     * @param {Boolean} output
     * @returns {Matrix}
     */
    inverse_det_adj(output = false) {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let det = new Detemerinant(this.data).get_val();
        if (output) console.log(det);

        let adj = this.adjugate(output);

        return adj.multi(1 / det);
    }

    /**
     * @param {Boolean} output
     * @returns {Matrix}
     */
    adjugate(output = false) {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let temp = deep_copy(this.data);

        Matrix.dimension_recursive(
            deep_copy(this.data),
            (r, i) => {
                let [row_i, col_i] = i;
                let algebraic_cofactor = new Detemerinant(deep_copy(this.data)).del_row(col_i).del_col(row_i);

                temp[row_i][col_i] = Math.pow(-1, row_i + col_i) * algebraic_cofactor.get_val();
                if (output) new Matrix(temp).show(bg_wrap_1);
            }
        );

        return new Matrix(temp);
    }

    /**
     * @param {Boolean} output
     * @returns {Array<Matrix>}
     */
    elementary_products(output = false) {
        if (this.shape.length != 2) {
            console.log("not a 2d matrix.");
            return this;
        }

        let eyes = [Matrix.eye(this.shape[0])];

        let index = 0;
        let conds = [(mat, i) => {

            if (index != i) return false;

            eyes.push(Matrix.eye(this.shape[0]));

            conds.push(conds[index]);
            conds[index] = () => false;

            index++;

            return true;
        }]

        this.row_echelon(output, eyes, conds);
        eyes.pop();

        return eyes.map((m) => m.inverse());
    }

    /**
     * @param {Number} index_1 
     * @param {Number} index_2 
     * @param {Number} axis
     */
    swap(index_1 = 0, index_2 = 0, axis = 0) {
        return new Matrix(
            Matrix.dimension_recursive(
                deep_copy(this.data),
                (r) => {
                    r[index_1] = [
                        deep_copy(r[index_2]),
                        r[index_2] = deep_copy(r[index_1])
                    ][0];
                    return r;
                },
                axis
            )
        );
    }

    /**
     * @param {(string : String)=>String} style
     */
    show(style = (str) => str) {

        let result = this.data.map((row) => row.map((e) => float_to_fraction(e)));
        let max_len = Math.max(...result.flat(Infinity).map((e) => e.length));

        result.forEach((row, i) => {
            let wrap = "││";
            if (i == 0) wrap = "┌┐";
            else if (i == this.data.length - 1) wrap = "└┘";

            console.log(style(`${wrap[0]} ${row.map((e) => `${" ".repeat(Math.floor((max_len - e.length)))}${e}`).join(" ")} ${wrap[1]}`));
        });
        console.log();
    }


    /**
     * @param {Number} n 
     * @returns {Matrix}
     */
    static eye(n) {
        return new Matrix(new Array(n).fill()
            .map((e, row_i) => new Array(n).fill()
                .map((e, col_i) => +(row_i == col_i))));
    }

    /**
     * @param {Number} row
     * @param {Number} col
     * @returns {Matrix}
     */
    static zero(row, col) {
        return new Matrix(new Array(row).fill()
            .map((e, row_i) => new Array(col).fill(0)));
    }

    /**
     * @param {Any} ref 
     * @param {(ref, indexes)=>ref} operate 
     * @param {Number} depth
     * @param {Array<Number>} indexes 
     * @param {Array<Array>} arrays 
     * @returns {Any}
     */
    static dimension_recursive(ref, operate = (ref, indexes) => ref, depth = Infinity, indexes = [], arrays = []) {
        return (
            (Array.isArray(ref) && depth--) ?
                ref.map((r, i) => this.dimension_recursive(r, operate, depth, indexes.concat(i), arrays.concat(ref)))
                :
                operate(ref, indexes, arrays)
        );
    }

    /**
     * @param {Any} ref 
     * @param {Array<Number>} indexes 
     * @returns 
     */
    static get_val_recursive(ref, indexes = []) {
        return (
            (Array.isArray(ref) && indexes.length) ?
                this.get_val_recursive(ref[indexes.shift()], indexes)
                :
                ref
        );
    }

    /**
     * @param {Array<Matrix>} arr 
     * @returns 
     */
    static get_dots(arr) {
        arr = deep_copy(arr);
        let result = arr.shift();
        arr.forEach((m) => result = result.dot(m));
        return result;
    }

}

class Detemerinant extends Matrix {

    /**
     * @param {array} value 
     */
    constructor(value) {
        super(value);
    }


    /**
     * @param {Number} index 
     * @returns {Detemerinant}
     */
    del_row(index) {
        return this.del_line(index, 0);
    }

    /**
     * @param {Number} index 
     * @returns {Detemerinant}
     */
    del_col(index) {
        return this.del_line(index, 1);
    }

    del_line(index, axis = 0) {
        return new Detemerinant(
            Matrix.dimension_recursive(
                deep_copy(this.data),
                (r) => {
                    r.splice(index, 1);
                    return r;
                },
                axis
            )
        );
    }

    /**
     * @returns {Number}
     */
    get_val() {
        let temp = this.row_echelon(false, [], [], true, 0b101).data;
        return temp.reduce((s, e, i) => s * e[i], 1);
    }

}

/**
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
let gcd = (a, b) => b ? gcd(b, a % b) : a;

/**
 * @param {number} num 
 * @returns {string}
 */
function float_to_fraction(num) {

    const threshold = Math.pow(10, -6);

    let negative = +(num > 0) * 2 - 1;
    num = Math.abs(num);

    let deno = 1;
    let nume = deno * num;
    while ((nume % 1) > threshold && (1 - (nume % 1)) > threshold) {
        nume = (++deno) * num;
    }

    nume = Math.round(deno * num);
    if (deno == 1) return (nume * negative).toString();

    let gcd_n = gcd(nume, deno);
    return [nume * negative, deno].map((e) => Math.round(e / gcd_n)).join("/");
}

/**
 * @param {object} obj 
 * @returns {object | Any}
 */
function deep_copy(obj) {

    if (typeof (obj) !== 'object') return obj;

    let result = {};

    for (let key of Object.keys(obj)) {
        if (typeof (obj[key]) === 'object' && obj[key] != null) {
            result[key] = Object.assign(new obj[key].__proto__.constructor(), deep_copy(obj[key]));
        }
        else {
            result[key] = obj[key];
        }
    }

    return Object.assign(new obj.__proto__.constructor(), result);
}

// console.log(new Ex_num("2x^3y^87"));


// let A = new Matrix([
//     [2, 2, -2, 4, 2],
//     [1, -1, 0, 2, 1],
//     [3, 1, -2, 6, 3],
//     [1, 3, -2, 2, 1]
// ]);


// let [P, L, U] = A.get_PLU(true);

// P.show();
// L.show();
// U.show();

// L.dot(U).show();


