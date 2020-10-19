import { Vector2 } from 'three';
import { Blob } from './blob'

function drawEyeLine(leftEye, rightEye, nose, ctx) {
  let le = new Vector2(leftEye.x, leftEye.y);
  let re = new Vector2(rightEye.x, rightEye.y);
  let noseV = new Vector2(nose.x, nose.y);

  let v = le.clone().sub(re);
  let norm_v = v.clone().normalize();
  let scale = v.length();

  let scaleVec = norm_v.clone().multiplyScalar(scale);
  let newLe = le.clone().add(scaleVec);
  let newRe = re.clone().add(scaleVec.negate());

  ctx.beginPath();
  ctx.moveTo(newLe.x, newLe.y);
  ctx.lineTo(newRe.x, newRe.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();




  let new_norm_v = new Vector2(norm_v.y, -norm_v.x).multiplyScalar(scale * 3)
  //new_norm_v.negate();

  let end = noseV.clone().add(new_norm_v);

  ctx.beginPath();
  ctx.moveTo(noseV.x, noseV.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();


  return [newRe, noseV, newLe, end]

}

function pointsOnCircle(n, center, radius) {
  let out = [];
  let thetaFrag = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    out.push({
      x: center.x + radius * Math.cos(thetaFrag * i),
      y: center.y + radius * Math.sin(thetaFrag * i)
    });
  }
  return out;
}



class Shapeshifter {
  constructor(position) {
    this.speed = 0.1
    this.damp = 0.8
    this.blob = new Blob(pointsOnCircle(4, position, 40));
    this.originalPoints = pointsOnCircle(4, position, 40);
    this.blob.points.forEach((point) => {
      point.v = new Vector2(0, 0);
    })
  }
  tick(leftEye, rightEye, nose, ctx) {



    if (leftEye && rightEye && nose) {
      let newPoints = drawEyeLine(leftEye, rightEye, nose, ctx)
      if (newPoints.length != this.blob.points.length)
        console.log("Length of points not equal", newPoints.length, this.blob.points.length)

      for (let i = 0; i < newPoints.length; i++) {
        let newPoint = new Vector2(this.blob.points[i].x, this.blob.points[i].y)
        newPoints[i].sub(newPoint)
        //newPoints[i].normalize()
        this.blob.points[i].v.add(newPoints[i].multiplyScalar(this.speed))

      }
    } else {
      for (let i = 0; i < this.originalPoints.length; i++) {
        let newPoint = new Vector2(this.blob.points[i].x, this.blob.points[i].y)
        let oPoint = new Vector2(this.originalPoints[i].x, this.originalPoints[i].y)
        oPoint.sub(newPoint)
        // oPoint.normalize()
        this.blob.points[i].v.add(oPoint.multiplyScalar(this.speed))
      }
    }

    this.blob.points.forEach((point) => {
      point.x += point.v.x
      point.y += point.v.y

      point.v.multiplyScalar(this.damp)
    })


    this.blob.render(ctx, "red", {
      x: 0,
      y: 0
    }, "lighter")
    this.blob.render(ctx, "blue", {
      x: 5,
      y: 0
    }, "lighter")
    this.blob.render(ctx, "green", {
      x: 0,
      y: 5
    }, "lighter")
    this.blob.render(ctx, "cyan", {
      x: 2,
      y: 5
    }, "lighter")

  }
}

export { drawEyeLine, Shapeshifter }
