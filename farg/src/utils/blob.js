
// drawPathShape does not draw anything. it just creates the pathShape
function drawPathShape(ctx, points) {
  let p0 = points[0];
  let p1 = points[0];
  let _p2 = p1;

  ctx.beginPath();
  ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);

  for (let i = 1; i < points.length; i++) {
    let p2 = points[i];
    var xc = (p1.x + p2.x) / 2;
    var yc = (p1.y + p2.y) / 2;
    ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
    p1 = p2;
  }

  var xc = (p1.x + _p2.x) / 2;
  var yc = (p1.y + _p2.y) / 2;
  ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
  ctx.quadraticCurveTo(_p2.x, _p2.y, xc, yc);
  // ctx.lineTo(_p2.x, _p2.y)
  ctx.closePath();
}


export default drawPathShape
