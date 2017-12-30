// Simple case to start with. 4 sides. Tetrahedron.
let A = (120 / 360) * 2 * Math.PI;
let B = A;
let C = A;
let S = (A + B + C) / 2;

let q = (-Math.cos(S) * Math.cos(S - A)) / (Math.sin(B) * Math.sin(C));
console.log(q);
let a = 2 * Math.asin(Math.sqrt(q));
let b = a;
let c = b;
console.log(a, b, c);

function Rotate(p, angle) {
  const x = p[0];
  const y = p[1];
  const z = p[2];
  return [x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
          z];
}

const origin = [0, 0, 0];
let vertices = [];
let edges = [];

// Generate vertices and edges.
const N = 34;
vertices.push([0, 0, 1]);
vertices.push([0, 0, -1]);
const sliceAngle = 4 * Math.PI / N;
for (let i = 0; i < N / 2; ++i) {
  let spoke = [0, 1, 0];
  for (let j = 0; j < i; ++j) {
    spoke = Rotate(spoke, sliceAngle);
  }
  const nextSpoke = Rotate(spoke, sliceAngle);
  vertices.push(spoke);
  edges.push([vertices[0], spoke]);
  edges.push([vertices[1], spoke]);
  edges.push([spoke, nextSpoke]);
}

// Make an octahedron.
//vertices.push([0, 0, 1]);
//vertices.push([0, 0, -1]);
//vertices.push([0, 1, 0]);
//vertices.push([1, 0, 0]);
//vertices.push([0, -1, 0]);
//vertices.push([-1, 0, 0]);
// let edges = [
//   [vertices[0], vertices[2]],
//   [vertices[0], vertices[3]],
//   [vertices[0], vertices[4]],
//   [vertices[0], vertices[5]],
//   [vertices[1], vertices[2]],
//   [vertices[1], vertices[3]],
//   [vertices[1], vertices[4]],
//   [vertices[1], vertices[5]],
//   [vertices[2], vertices[3]],
//   [vertices[3], vertices[4]],
//   [vertices[4], vertices[5]],
//   [vertices[5], vertices[2]],
// ];

// Make tetrahedron.
//vertices.push([0, 0, 1]);
//vertices.push([Math.sin(c), 0, Math.cos(c)]);
//vertices.push([Math.sin(b) * Math.cos(A),
//                 Math.sin(b) * Math.sin(A),
//                 Math.cos(b)]);
//let edges = [
//  [vertices[0], vertices[1]],
//  [vertices[1], vertices[2]],
//  [vertices[2], vertices[0]],
//];
// Hack the 4th vertex.
//let f = [vertices[0][0] + vertices[1][0] + vertices[2][0],
//         vertices[0][1] + vertices[1][1] + vertices[2][1],
//         vertices[0][2] + vertices[1][2] + vertices[2][2]];

let globalRotationAngle = 0;

// Returns (v1 + v2).
function VectorAdd(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

// Returns (v1 - v2).
function VectorSubtract(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
}

function VectorMultiply(v, mult) {
  return [mult * v[0], mult * v[1], mult * v[2]];
}

function Distance3D(p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Returns a 3D point near "candidate" that is slightly closer to
// targetDistance away from base.
function AdjustTowardsTargetLength(base, candidate, targetDistance,
                                   learningRate) {
  const dist = Distance3D(base, candidate);
  const newDist = (1 - learningRate) * dist + learningRate * targetDistance;
  const edge = VectorSubtract(candidate, base);
  const newEdge = VectorMultiply(edge, newDist / dist);
  const newCandidate = VectorAdd(base, newEdge);
  return newCandidate;
}

function Trilaterate(p1, p2, p3, d1, d2, d3) {
  const learningRate = 0.01;
  // Start with the centroid of the 3 beacons.
  let p = VectorMultiply(VectorAdd(p1, VectorAdd(p2, p3)), 1 / 3);
  while (true) {
    let oldP = p;
    p = AdjustTowardsTargetLength(p1, p, d1, learningRate);
    p = AdjustTowardsTargetLength(p2, p, d2, learningRate);
    p = AdjustTowardsTargetLength(p3, p, d3, learningRate);
    const howFar = Distance3D(p, oldP);
    console.log("howFar:", howFar, "p:", p);
    if (howFar < 0.001) {
      break;
    }
  }
  return p;
}

//Trilaterate([0, 0, 0], [0, 0, 1], [1, 0, 0],
//            1, Math.sqrt(2), Math.sqrt(2));

// p is a 3-tuple representing a vertex.
function Project2D(p, scalingFactor, offset) {
  const cameraZ = 0.5;
  const cameraY = -3;
  const x = p[0];
  const y = p[1] - cameraY;
  const z = p[2] - cameraZ;
  return [offset + scalingFactor * x / y, offset + scalingFactor * z / y];
}

function Render(scalingFactor, offset, rotationAngle) {
  let canvas = document.getElementById("geocanvas");
  let context = canvas.getContext("2d");
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < vertices.length; ++i) {
    const v = vertices[i];
    let p1 = Project2D(Rotate(origin, rotationAngle), scalingFactor, offset);
    let p2 = Project2D(Rotate(v, rotationAngle), scalingFactor, offset);
    context.strokeStyle = "red";
    context.beginPath();
    context.moveTo(p1[0], p1[1]);
    context.lineTo(p2[0], p2[1]);
    context.stroke();
  }
  for (let i = 0; i < edges.length; ++i) {
    const v1 = edges[i][0];
    const v2 = edges[i][1];
    let p1 = Project2D(Rotate(v1, rotationAngle), scalingFactor, offset);
    let p2 = Project2D(Rotate(v2, rotationAngle), scalingFactor, offset);
    context.strokeStyle = "green";
    context.beginPath();
    context.moveTo(p1[0], p1[1]);
    context.lineTo(p2[0], p2[1]);
    context.stroke();
  }
}

function onload() {
  setInterval(function() {
    Render(400, 400, globalRotationAngle);
    globalRotationAngle += 0.001;
  }, 10);
}
