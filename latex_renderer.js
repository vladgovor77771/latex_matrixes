class LatexRenderer {
  static renderMatrixTransformations(matrix, chain, maxCountOnLine) {
    let res = "$$\n" + this.renderMatrix(matrix);
    let countOnLine = 1;
    for (let transform of chain) {
      if (countOnLine == maxCountOnLine) {
        res += "$$\n$$\n";
        countOnLine = 0;
      }
      res += this.renderTransformationArrow(transform[0]);
      res += this.renderMatrix(transform[1]);
      countOnLine++;
    }

    res += "$$";
    return res;
  }

  static renderMatrix(matrix) {
    return `\\left(
\\begin{array}{${"c".repeat(matrix.colsCount)}}
${matrix.rows.map(row => this.renderMatrixRow(row)).join("\n")}
\\end{array}
\\right)
`;
  }

  static renderMatrixRow(row) {
    let els = [];
    for (let el of row) els.push(this.renderNumber(el));
    let res = els.join(" & ") + "\\\\";
    return res;
  }

  static renderTransformationArrow(tr) {
    if (tr.type == "addRow")
      return `\\xRightarrow{A_{(${tr.whereToAdd + 1})} + (${this.renderNumber(tr.multiplier)}) \\cdot A_{(${
        tr.whatToAdd + 1
      })}}\n`;
    else if (tr.type == "swapRows") return `\\xRightarrow{A_{(${tr.first + 1})} \\Leftrightarrow A_{(${tr.second + 1})}}\n`;
    else if (tr.type == "multiplyRow")
      return `\\xRightarrow{A_{(${tr.multiplying + 1})} \\cdot (${this.renderNumber(tr.multiplier)})}\n`;
  }

  static renderNumber(el) {
    let elString = "";
    if (el.s == -1) elString += "-";
    if (el.d != 1) elString += `\\frac{${el.n}}{${el.d}}`;
    else elString += `${el.n}`;
    return elString;
  }
}

module.exports = LatexRenderer;
