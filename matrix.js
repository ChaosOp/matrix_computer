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
     * @returns {Matrix}
     */
    row_echelon(output = false, repeats = []) {
        let temp = deep_copy(this.data);
        if (output) console.log(temp);

        temp.forEach((row, row_i) => {

            let now_lead = row.findIndex((e) => e != 0);
            let now_ratio = 1 / (row[now_lead] ? row[now_lead] : 1);

            row = row.map((e) => e * now_ratio);
            repeats.forEach((mat) => {
                if (output) console.log(mat);
                if (mat.shape.some((e, i) => e != this.shape[i])) return;
                mat.data[row_i] = mat.data[row_i].map((e) => e * now_ratio);

            });

            temp[row_i] = row;
            if (output && now_ratio != 1) console.log(temp);

            for (let o_row_i in new Array(temp.length).fill()) {
                if (o_row_i == row_i) continue;

                let o_row = temp[o_row_i];
                if (o_row) {
                    let o_lead = o_row.findIndex((e) => e != 0);
                    if (now_lead >= o_lead) {
                        let ratio = o_row[now_lead] / (row[now_lead] ? row[now_lead] : o_row[now_lead]);

                        temp[o_row_i] = new Matrix(temp[o_row_i]).add(new Matrix(row), -ratio).data;
                        repeats.forEach((mat) => {
                            if (output) console.log(mat);
                            if (mat.shape.some((e, i) => e != this.shape[i])) return;
                            mat.data[o_row_i] = new Matrix(mat.data[o_row_i]).add(new Matrix(mat.data[row_i]), -ratio).data;
                        });

                        if (output) console.log(temp);
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
    add(matrix, ratio = 1) {

        if (this.shape.some((e, i) => e !== matrix.shape[i])) {
            console.log("unmatched shape.");
            return this;
        }

        return new Matrix(
            Matrix.dimension_recursive(
                this.data,
                (r, i) => r + Matrix.get_val_recursive(matrix.data, i) * ratio
            )
        );
    }

    /**
     * @returns {Matrix}
     */
    inverse() {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let eye = Matrix.eye(this.shape[0]);
        this.row_echelon(false, [eye]);

        return eye;
    }

    /**
    * @returns {Matrix}
    */
    inverse_det_adj() {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let eye = Matrix.eye(this.shape[0]);
        this.row_echelon(false, [eye]);

        return eye;
    }

    /**
     * @returns {Matrix}
     */
    adjugate() {
        if (this.shape.length != 2 || this.shape[0] != this.shape[1]) {
            console.log("not a square matrix.");
            return this;
        }

        let temp = deep_copy(this.data);

        temp.forEach((row, row_i) => {
            row.forEach((col, col_i) => {
                let algebraic_cofactor = new Detemerinant(deep_copy(temp)).del_row(row_i).del_col(col_i);
                temp[row_i][col_i] = Math.pow(-1, row_i + col_i) * algebraic_cofactor.get_val();
            });
        });


        return new Matrix(temp);
    }

    /**
     * 
     */
    show() {

        let result = this.data.map((row) => row.map((e) => float_to_fraction(e)));
        let max_len = Math.max(...result.flat(Infinity).map((e) => e.length));

        result.forEach((row, i) => {
            let wrap = "││";
            if (i == 0) wrap = "┌┐";
            else if (i == this.data.length - 1) wrap = "└┘";

            console.log(`${wrap[0]} ${row.map((e) => `${" ".repeat(max_len - e.length)}${e}`).join(" ")} ${wrap[1]}`);
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
     * 
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
        return new Detemerinant(this.data.splice(index, 1));
    }

    /**
     * @param {Number} index 
     * @returns {Detemerinant}
     */
    del_col(index) {
        return new Detemerinant(this.data.map((row) => {
            return row.splice(index, 1);
        }));
    }

    /**
     * @returns {Number}
     */
    get_val() {
        let temp = deep_copy(this.data);
        return 87;
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
        nume = (deno++) * num;
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

let A = new Matrix([
    [2325, -1251251334, 352, -141],
    [-3, 8, 1215155, -123],
    [2131, 247, -515, 15151123],
    [5235, -355, 414, -12424155]
]);
console.log(A.inverse().data);
A.dot(A.inverse()).show();
// A.inverse().show();
A.show();