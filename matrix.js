// class Ex_num {
//     /**
//      * @param {String} expr 
//      */
//     constructor(expr) {

//         let matches = expr.match(/(-?[0-9]*[a-zA-Z])|(-?[0-9]+)/g);

//         this.value = {};
//         matches.forEach((e) => {
//             let val = e.match(/(-?[0-9]+)/g)?.[0];
//             let sym = e.match(/(-?[a-zA-Z])/g)?.[0] || 0;
//             if (!value[sym]) value[sym] = 0;
//             value[sym] += val;
//         });
//     }
// }

let color_wrap = (text, ground, r, g, b) => `\x1b[${ground};2;${r};${g};${b}m${text}\x1b[0m`;
let fg_wrap = (text) => color_wrap(text, 38, 246, 201, 255);
let bg_wrap_1 = (text) => color_wrap(text, 48, 111, 79, 117);
let bg_wrap_2 = (text) => color_wrap(text, 48, 101, 43, 112);
class Matrix {

    /**
     * @param {array} value 
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
     * @param {boolean} output 
     * @param {array<Matrix>} repeats
     * @param {array.<((matrix: Matrix, index: number, ratio: number)=>boolean)>} rp_cond
     * @param {number} use_operate (multiple constant to line), (multiple line & add to line)
     * @returns {Matrix}
     */
    row_echelon(output = false, repeats = [], rp_cond = [], use_operate = 0b11) {

        let temp = deep_copy(this.data);
        if (output) new Matrix(temp).show();

        temp.forEach((row, row_i) => {

            let now_lead = row.findIndex((e) => e != 0);

            if (use_operate & 0b10) {
                let now_ratio = 1 / (row[now_lead] ? row[now_lead] : 1);
                if (output) console.log(fg_wrap(`row${row_i + 1} *= ${now_ratio}`));

                row = row.map((e) => e * now_ratio);
                temp[row_i] = row;
                if (output) new Matrix(temp).show(bg_wrap_1);

                repeats.forEach((mat, i) => {

                    if (mat.shape[0] <= row_i) return;
                    if (rp_cond[i]?.(mat, i, now_ratio) === false) return;

                    mat.data[row_i] = mat.data[row_i].map((e) => e * now_ratio);
                    if (output) mat.show(bg_wrap_2);

                });
                if (output) console.log();
            }


            if (!(use_operate & 0b01)) return;

            for (let o_row_i in new Array(temp.length).fill()) {
                if (o_row_i == row_i) continue;

                let o_row = temp[o_row_i];
                if (o_row) {
                    let o_lead = o_row.findIndex((e) => e != 0);
                    if (now_lead >= o_lead) {
                        let ratio = o_row[now_lead] / (row[now_lead] ? row[now_lead] : o_row[now_lead]);
                        if (output) console.log(fg_wrap(`row${parseInt(o_row_i) + 1} += (row${row_i + 1} * ${-ratio})`));

                        temp[o_row_i] = new Matrix(temp[o_row_i]).add(new Matrix(row).multi(-ratio)).data;
                        if (output) new Matrix(temp).show(bg_wrap_1);

                        repeats.forEach((mat, i) => {

                            if (mat.shape[0] <= row_i) return;
                            if (rp_cond[i]?.(mat, i, ratio) === false) return;

                            mat.data[o_row_i] = new Matrix(mat.data[o_row_i]).add(new Matrix(mat.data[row_i]).multi(-ratio)).data;
                            if (output) mat.show(bg_wrap_2);

                        });

                        if (output) console.log();

                    }

                }
            }

        });

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
     * @param {boolean} output
     * @returns {array<Matrix>}
     */
    get_R_U(output = false) {
        let eye = Matrix.eye(this.shape[0]);
        let res = this.row_echelon(output, [eye], [() => true]);
        return [res, eye];
    }

    /**
     * @param {boolean} output
     * @returns {Matrix}
     */
    inverse(output = false) {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        return this.get_R_U(output)[1];
    }

    /**
     * @param {boolean} output
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
     * @param {boolean} output
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
     * @param {boolean} output
     * @returns {array<Matrix>}
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

        return eyes;
    }

    /**
    * @param {(string)=>string} style
    */
    show(style = (str) => str) {

        let result = this.data.map((row) => row.map((e) => float_to_fraction(e)));
        let max_len = Math.max(...result.flat(Infinity).map((e) => e.length));

        result.forEach((row, i) => {
            let wrap = "││";
            if (i == 0) wrap = "┌┐";
            else if (i == this.data.length - 1) wrap = "└┘";

            console.log(style(`${wrap[0]} ${row.map((e) => `${" ".repeat(max_len - e.length)}${e}`).join(" ")} ${wrap[1]}`));
        });

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
     * 
     * @param {any} ref 
     * @param {(ref, indexes)=>ref} operate 
     * @param {array} indexes 
     * @returns 
     */
    static dimension_recursive(ref, operate = (ref, indexes) => ref, indexes = []) {
        return (
            Array.isArray(ref) ?
                ref.map((r, i) => this.dimension_recursive(r, operate, indexes.concat(i)))
                :
                operate(ref, indexes)
        );
    }

    /**
     * @param {any} ref 
     * @param {array} indexes 
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
        this.data.splice(index, 1);
        return new Detemerinant(this.data);
    }

    /**
     * @param {Number} index 
     * @returns {Detemerinant}
     */
    del_col(index) {
        return new Detemerinant(this.data.map((row) => {
            row.splice(index, 1);
            return row;
        }));
    }

    /**
     * @returns {Number}
     */
    get_val() {
        let temp = this.row_echelon(false, [], [], 0b01).data;
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

function deep_copy(obj) {
    let result = {};
    for (let key of Object.keys(obj)) {
        if (typeof (obj[key]) === 'object') {
            result[key] = Object.assign(new obj[key].__proto__.constructor(), deep_copy(obj[key]));
        }
        else {
            result[key] = obj[key];
        }
    }
    return Object.assign(new obj.__proto__.constructor(), result);
}

// let A = new Matrix([
//     [1, 2, 1],
//     [5, 12, -1]
// ]).get_R_U(true)[1];


let A = new Matrix([
    [2, 3],
    [1, 2]
]);

A.show();

let temp = A.elementary_products(true);
temp.forEach((e) => {
    //e.show(bg_wrap_1);
    e.inverse().show(bg_wrap_2);
});

let B = temp.shift().inverse();
temp.forEach((e) => { B = B.dot(e.inverse()); B.show(fg_wrap); });
B.show(fg_wrap);

