const LatexRenderer = require("./latex_renderer");
const { Matrix } = require("./matrix");
const fs = require("fs");
const input = require("./input");

const matrix = new Matrix(input.matrix);

let res;
if (input.operation == "canonical") res = matrix.getCanonical();
else if (input.operation == "triangle") res = matrix.getTriangle();
else throw new Error("Other operations not implemented yet.");

res[res.length - 1][1].print();

fs.writeFileSync("./output/output.tex", LatexRenderer.renderMatrixTransformations(matrix, res, input.maxCountOnLine));
