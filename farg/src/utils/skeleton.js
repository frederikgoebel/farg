import { Vector2 } from 'three';
import { Blob } from './blob'



function toPoseDict(keypoints) {
  let out = {}
  keypoints.forEach((keypoint) => {
    out[keypoint.part] = new Vector2(keypoint.position.x, keypoint.position.y)
  })
  return out
}


function debugLine(p0, p1) {
  ctx.save()
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();
  ctx.restore()
}

// function getLine(p0,p1){
//   let le = p0.clone();
//   let re = p1.clone();
//
//   let v = p0.clone().sub(re);
//
//   return {
//
//   }
// }

// offset some keypoints to have an outer shape of the body
function drawEyeLine(poseDict, nose, ctx) {

  let outDict = {}
  for (const [key, value] of Object.entries(poseDict)) {
    outDict[key] = new Vector2(value.x, value.y);
  }


  // TODO maybe just fill "bad" defaults in the beginning. like nose-100 bla bla

  if (poseDict["leftEye"] && poseDict["rightEye"]) {
    let v = poseDict["leftEye"].clone().sub(poseDict["rightEye"]);
    let norm_v = v.clone().normalize();
    let eyeDistance = v.length();
    let scaleVec = norm_v.clone().multiplyScalar(eyeDistance);

    outDict["leftEye"].add(scaleVec);
    outDict["rightEye"].add(scaleVec.negate());


    if (poseDict["nose"]) {
      let new_norm_v = new Vector2(norm_v.y, -norm_v.x).multiplyScalar(eyeDistance * 3)
      outDict["nose"].add(new_norm_v);
    }
  }

  if (poseDict["leftShoulder"] && poseDict["rightShoulder"]) {
    let v = poseDict["leftShoulder"].clone().sub(poseDict["rightShoulder"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(0.7);
    outDict["leftShoulder"].add(scaleVec);
    outDict["rightShoulder"].add(scaleVec.negate());
  }

  if (poseDict["leftShoulder"] && poseDict["leftElbow"]) {
    let v = poseDict["leftShoulder"].clone().sub(poseDict["leftElbow"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(0.7);
    outDict["leftElbow"].add(scaleVec);
  }

  if (poseDict["rightShoulder"] && poseDict["rightElbow"]) {
    let v = poseDict["rightShoulder"].clone().sub(poseDict["rightElbow"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(0.7);
    outDict["rightElbow"].add(scaleVec);
  }

  if (poseDict["rightElbow"] && poseDict["rightWrist"]) {
    let v = poseDict["rightElbow"].clone().sub(poseDict["rightWrist"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(0);
    outDict["rightWrist"].add(scaleVec);
  }

  if (poseDict["leftElbow"] && poseDict["leftWrist"]) {
    let v = poseDict["leftElbow"].clone().sub(poseDict["leftWrist"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(0);
    outDict["leftWrist"].add(scaleVec);
  }

  if (poseDict["leftKnee"] && poseDict["leftAnkle"]) {
    let v = poseDict["leftKnee"].clone().sub(poseDict["leftAnkle"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(1.5).negate();
    ;
    outDict["leftAnkle"].add(scaleVec);
  }
  if (poseDict["rightKnee"] && poseDict["rightAnkle"]) {
    let v = poseDict["rightKnee"].clone().sub(poseDict["rightAnkle"]);
    let norm_v = v.clone().normalize();
    let scale = v.length();

    let scaleVec = v.clone().multiplyScalar(1.5).negate();
    outDict["rightAnkle"].add(scaleVec);
  }

  return outDict

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
    this.blob = new Blob(pointsOnCircle(11, position, 40));
    this.blob.points.forEach((point) => {
      point.v = new Vector2(0, 0);
    })
  }
  tick(keypoints, ctx) {
    let poseDict = drawEyeLine(toPoseDict(keypoints), ctx)

    // TODO poseDict2points that fills missing poseDict values with approciamations
    let newPoints = [
      poseDict["rightEye"] || new Vector2(10, 10),
      poseDict["rightShoulder"] || new Vector2(10, 10),
      poseDict["rightElbow"] || new Vector2(10, 10),
      poseDict["rightWrist"] || new Vector2(10, 10),
      poseDict["rightAnkle"] || new Vector2(10, 10),
      poseDict["leftAnkle"] || new Vector2(10, 10),
      poseDict["leftWrist"] || new Vector2(10, 10),
      poseDict["leftElbow"] || new Vector2(10, 10),
      poseDict["leftShoulder"] || new Vector2(10, 10),
      poseDict["leftEye"] || new Vector2(10, 10),
      poseDict["nose"] || new Vector2(10, 10),
    ]
    console.log(poseDict)
    if (newPoints.length != this.blob.points.length)
      console.log("Length of points not equal", newPoints.length, this.blob.points.length)

    for (let i = 0; i < newPoints.length; i++) {
      let newPoint = new Vector2(this.blob.points[i].x, this.blob.points[i].y)
      newPoints[i].sub(newPoint)
      //newPoints[i].normalize()
      this.blob.points[i].v.add(newPoints[i].multiplyScalar(this.speed))

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
