const base_del = new_node("button", { className: "delete_matrix", innerText: "delete" });



const base_title = new_node("div", { className: "line" });



const base_col = new_node("input", { className: "element", type: "text" });

const base_row = new_node("div", { className: "line" });
base_row.appendChild(base_col);

const base_content = new_node("div", { className: "content" });
base_content.appendChild(base_row);



const base_func = new_node("div", { id: "func" });



const base_output = new_node("div", { id: "output" });



const base_mat = new_node("div", { id: "matrix" });
[
    base_del,
    base_title,
    base_content,
    base_func,
    base_output
].forEach((base_type) => base_mat.appendChild(base_type));



/* 
    <div id="matrix">

        <button class="delete_matrix">delete A</button>

        <div class="line">A</div>

        <div class="content">
            <div class='line'>
                <input type='text' class="element">
            </div>
        </div>

        <div id="func"></div>

        <div id="output"></div>

    </div>
*/