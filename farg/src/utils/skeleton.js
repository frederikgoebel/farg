import { Vector2 } from 'three';

function drawEyeLine(leftEye, rightEye, nose, ctx) {
  let le = new Vector2(leftEye.x, leftEye.y);
  let re = new Vector2(rightEye.x, rightEye.y);
  let noseV = new Vector2(nose.x, nose.y);

  let v = le.clone().sub(re);
  let norm_v = v.clone().normalize();
  let scale = v.length() / 4 * 3;

  let scaleVec = norm_v.clone().multiplyScalar(scale);
  console.log(le, re, scaleVec)
  let newLe = le.clone().add(scaleVec);
  let newRe = re.clone().add(scaleVec.negate());

  ctx.beginPath();
  ctx.moveTo(newLe.x, newLe.y);
  ctx.lineTo(newRe.x, newRe.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();



  let new_norm_v = new Vector2(norm_v.y, -norm_v.x).multiplyScalar(scale * 2)
  //new_norm_v.negate();

  let end = noseV.clone().add(new_norm_v);

  ctx.beginPath();
  ctx.moveTo(noseV.x, noseV.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();


}

export { drawEyeLine }
