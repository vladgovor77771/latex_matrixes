const Mathjs = require("mathjs");
const _ = require("lodash");

class Matrix {
  constructor(rows) {
    if (!rows) throw new Error("Matrix not found");
    this.rows = [];
    this.rowsCount = rows.length;
    this.colsCount = rows[0].length;

    for (let row of rows) {
      let newRow = [];

      for (let el of row) {
        if (typeof el == "string") {
          let number = el.split("/");
          if (number.length == 1) newRow.push(Mathjs.fraction(+number[0], 1));
          else newRow.push(Mathjs.fraction(+number[0], +number[1]));
        } else if (typeof el == "number") newRow.push(Mathjs.fraction(el, 1));
        else newRow.push(el);
      }
      this.rows.push(newRow);
    }
  }

  getTriangle() {
    let chain = [];

    let current = this;
    let currentRow = 0;
    let currentCol = 0;

    while (!current.isLowerTriangle()) {
      chain = chain.concat(current.fixRowSequence());
      if (chain.length > 0) current = chain[chain.length - 1][1];
      if (current.isLowerTriangle()) break;
      if (current.rows[currentRow][currentCol].n == 0) {
        currentCol++;
      } else if (current.zerosUnder(currentRow, currentCol)) {
        currentRow++;
        currentCol++;
      } else {
        let someCounter = 1;
        while (currentRow + someCounter < this.rowsCount && current.rows[currentRow + someCounter][currentCol].n != 0) {
          let multiplier = Mathjs.multiply(
            Mathjs.fraction(
              current.rows[currentRow][currentCol].s * current.rows[currentRow][currentCol].d,
              current.rows[currentRow][currentCol].n
            ),
            Mathjs.fraction(
              current.rows[currentRow + someCounter][currentCol].s * current.rows[currentRow + someCounter][currentCol].n,
              current.rows[currentRow + someCounter][currentCol].d
            ),
            -1
          );

          let transformation = new MatrixTransformation("addRow", currentRow + someCounter, currentRow, multiplier);
          let newMatrix = transformation.apply(current);
          current = newMatrix;
          chain.push([transformation, newMatrix]);
          someCounter++;
        }
        currentRow++;
        currentCol++;
      }
    }

    return chain;
  }

  getCanonical() {
    let chain = this.getTriangle();

    let current = chain[chain.length - 1][1];
    let [currentRow, currentCol] = current.getLastDiagonalEl();

    while (!current.isCanonical()) {
      if (
        current.rows[currentRow][currentCol].n != 1 ||
        current.rows[currentRow][currentCol].d != 1 ||
        current.rows[currentRow][currentCol].s != 1
      ) {
        let multiplier = Mathjs.fraction(
          current.rows[currentRow][currentCol].s * current.rows[currentRow][currentCol].d,
          current.rows[currentRow][currentCol].n
        );

        let transformation = new MatrixTransformation("multiplyRow", currentRow, multiplier);
        let newMatrix = transformation.apply(current);
        current = newMatrix;
        chain.push([transformation, newMatrix]);
      } else if (!current.zerosUpper(currentRow, currentCol)) {
        for (let row = currentRow - 1; row >= 0; row--) {
          if (current.rows[row][currentCol].n == 0) continue;
          let multiplier = Mathjs.multiply(current.rows[row][currentCol], -1);

          let transformation = new MatrixTransformation("addRow", row, currentRow, multiplier);
          let newMatrix = transformation.apply(current);
          current = newMatrix;
          chain.push([transformation, newMatrix]);
        }
        currentRow--;
        currentCol--;
      }
    }

    return chain;
  }

  getLastDiagonalEl() {
    for (let i = this.rowsCount - 1; i >= 0; i--) {
      for (let j = 0; j < this.colsCount; j++) {
        if (this.rows[i][j].n != 0) return [i, j];
      }
    }
  }

  fixRowSequence() {
    let zerosCount = this.rows.map((r, i) => ({ value: this.getZerosCountFromRow(r), index: i }));
    let sorted = _.sortBy(zerosCount, "value");
    let chain = [];
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].index != i) {
        let transformation = new MatrixTransformation("swapRows", i, sorted[i].index);
        let newMatrix = transformation.apply(this);
        chain.push([transformation, newMatrix]);
        chain = chain.concat(newMatrix.fixRowSequence());
        break;
      }
    }
    return chain;
  }

  getZerosCountFromRow(row) {
    let res = 0;
    for (let el of row) {
      if (el.n == 0) res++;
      else if (el.n != 0) break;
    }
    return res;
  }

  zerosUnder(row, col) {
    if (row == this.rowsCount - 1) return true;
    for (let i = row + 1; i < this.rowsCount; i++) if (this.rows[i][col].n != 0) return false;
    return true;
  }

  zerosUpper(row, col) {
    if (row == 0) return true;
    for (let i = row - 1; i >= 0; i--) if (this.rows[i][col].n != 0) return false;
  }

  isCanonical() {
    if (!this.isLowerTriangle()) return false;
    let [currentRow, currentCol] = this.getLastDiagonalEl();

    while (currentRow >= 0 && currentCol >= 0) {
      if (
        this.rows[currentRow][currentCol].n != 1 ||
        this.rows[currentRow][currentCol].d != 1 ||
        this.rows[currentRow][currentCol].s != 1
      )
        return false;
      for (let i = currentRow - 1; i >= 0; i--) if (this.rows[i][currentCol].n != 0) return false;

      currentRow--;
      currentCol--;
    }

    return true;
  }

  isLowerTriangle() {
    let zerosCount = -1;
    for (let row of this.rows) {
      let curZerosCount = this.getZerosCountFromRow(row);

      if (curZerosCount <= zerosCount && curZerosCount != this.colsCount) return false;
      else zerosCount = curZerosCount;
    }

    return true;
  }

  print() {
    for (let row of this.rows) {
      console.log(row.map(el => `${el.s == -1 ? "-" : ""}${el.n}${el.d != 1 ? `/${el.d}` : ""}`).join(" "));
    }
  }
}

class MatrixTransformation {
  constructor(type, arg1, arg2, arg3) {
    if (!["multiplyRow", "multiplyCol", "addRow", "addCol", "transpose", "swapRows"].includes(type))
      throw new Error("Unknown type");
    this.type = type;
    if (this.type == "multiplyRow" || this.type == "multiplyCol") {
      this.multiplying = arg1;
      if (typeof arg2 != "object") this.multiplier = Mathjs.fraction(arg2, 1);
      else this.multiplier = arg2;
    } else if (this.type == "addRow" || this.type == "addCol") {
      this.whereToAdd = arg1;
      this.whatToAdd = arg2;
      this.multiplier = arg3 || 1;
    } else if (this.type == "swapRows") {
      this.first = arg1;
      this.second = arg2;
    }
  }

  apply(matrix) {
    if (this.type == "multiplyRow") return this.applyMultiplyRow(matrix);
    else if (this.type == "multiplyCol") return this.applyMultiplyCol(matrix);
    else if (this.type == "addRow") return this.applyAddRow(matrix);
    else if (this.type == "addCol") return this.applyAddCol(matrix);
    else if (this.type == "swapRows") return this.applySwapRows(matrix);
  }

  applyMultiplyRow(matrix) {
    if (this.multiplying >= matrix.rowsCount) throw new Error("Row not found!");

    let newMatrix = [];
    for (let i = 0; i < matrix.rowsCount; i++) {
      let newRow = [];
      for (let el of matrix.rows[i]) {
        if (i == this.multiplying) newRow.push(Mathjs.multiply(this.multiplier, el));
        else newRow.push(el);
      }

      newMatrix.push(newRow);
    }

    return new Matrix(newMatrix);
  }

  applyAddRow(matrix) {
    if (this.whereToAdd >= matrix.rowsCount || this.whatToAdd >= matrix.rowsCount) throw new Error("Row not found!");

    let newMatrix = [];
    for (let i = 0; i < matrix.rowsCount; i++) {
      let newRow = [];
      for (let j = 0; j < matrix.colsCount; j++) {
        if (i == this.whereToAdd)
          newRow.push(Mathjs.add(Mathjs.multiply(matrix.rows[this.whatToAdd][j], this.multiplier), matrix.rows[i][j]));
        else newRow.push(matrix.rows[i][j]);
      }

      newMatrix.push(newRow);
    }

    return new Matrix(newMatrix);
  }

  applySwapRows(matrix) {
    if (this.first >= matrix.rowsCount || this.second >= matrix.rowsCount) throw new Error("Row not found!");

    let newMatrix = [];
    for (let i = 0; i < matrix.rowsCount; i++) {
      let newRow = [];
      for (let j = 0; j < matrix.colsCount; j++) {
        if (i == this.first) newRow.push(matrix.rows[this.second][j]);
        else if (i == this.second) newRow.push(matrix.rows[this.first][j]);
        else newRow.push(matrix.rows[i][j]);
      }

      newMatrix.push(newRow);
    }

    return new Matrix(newMatrix);
  }

  applyMultiplyCol(matrix) {}
  applyAddCol(matrix) {}
}

module.exports = { Matrix, MatrixTransformation };
