import { Vector2 } from 'three';
import SimplexNoise from 'simplex-noise'

function toPoseDict(keypoints) {
  let out = {}
  keypoints.forEach((keypoint) => {
    out[keypoint.part] = new Vector2(keypoint.position.x, keypoint.position.y)
  })
  return out
}

function debugLine(p0, p1, ctx) {
  if (!(p0 && p1))
    return
  ctx.save()
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "red";
  ctx.stroke();
  ctx.restore()
}

// scaleOutwards moves certain keypoints out of the body to describe an outer shape
function scaleOutwards(poseDict) {

  let outDict = {}
  for (const [key, value] of Object.entries(poseDict)) {
    outDict[key] = new Vector2(value.x, value.y);
  }

  if (poseDict["leftEye"] && poseDict["rightEye"]) {
    let v = poseDict["leftEye"].clone().sub(poseDict["rightEye"]);
    let norm_v = v.clone().normalize();
    let eyeDistance = v.length();
    let scaleVec = norm_v.clone().multiplyScalar(eyeDistance * 2);

    outDict["leftEye"].add(scaleVec);
    outDict["rightEye"].add(scaleVec.negate());

    if (poseDict["nose"]) {
      let new_norm_v = new Vector2(norm_v.y, -norm_v.x).multiplyScalar(eyeDistance * 6)
      outDict["nose"].add(new_norm_v);
    } else {
      let new_norm_v = new Vector2(norm_v.y, -norm_v.x).multiplyScalar(eyeDistance * 8)
      outDict["nose"] = new_norm_v;
    }
  }

  if (poseDict["leftShoulder"] && poseDict["rightShoulder"]) {
    let v = poseDict["leftShoulder"].clone().sub(poseDict["rightShoulder"]);
    let scaleVec = v.clone().multiplyScalar(0.7);
    outDict["leftShoulder"].add(scaleVec);
    outDict["rightShoulder"].add(scaleVec.negate());
  }


  if (poseDict["rightShoulder"] && poseDict["rightElbow"]) {
    let v = poseDict["rightShoulder"].clone().sub(poseDict["rightElbow"]);
    outDict["rightElbow"].add(new Vector2(v.y, -v.x).multiplyScalar(0.5));
  }

  if (poseDict["rightElbow"] && poseDict["rightWrist"]) {
    let v = poseDict["rightElbow"].clone().sub(poseDict["rightWrist"]);
    outDict["rightWrist"].add(v.multiplyScalar(0.7).negate());
  }


  if (poseDict["leftShoulder"] && poseDict["leftElbow"]) {
    let v = poseDict["leftShoulder"].clone().sub(poseDict["leftElbow"]);
    outDict["leftElbow"].add(new Vector2(v.y, -v.x).multiplyScalar(0.5).negate());
  }

  if (poseDict["leftElbow"] && poseDict["leftWrist"]) {
    let v = poseDict["leftElbow"].clone().sub(poseDict["leftWrist"]);
    outDict["leftWrist"].add(v.multiplyScalar(0.7).negate());
  }

  if (poseDict["leftElbow"] && poseDict["leftWrist"]) {
    let v = poseDict["leftElbow"].clone().sub(poseDict["leftWrist"]);
    let scaleVec = v.clone().multiplyScalar(0);
    outDict["leftWrist"].add(scaleVec);
  }

  if (poseDict["leftKnee"] && poseDict["leftAnkle"]) {
    let v = poseDict["leftKnee"].clone().sub(poseDict["leftAnkle"]);

    let scaleVec = v.clone().multiplyScalar(1.5).negate();
    outDict["leftAnkle"].add(scaleVec);
  }
  if (poseDict["rightKnee"] && poseDict["rightAnkle"]) {
    let v = poseDict["rightKnee"].clone().sub(poseDict["rightAnkle"]);

    let scaleVec = v.clone().multiplyScalar(1.5).negate();
    outDict["rightAnkle"].add(scaleVec);
  }

  return outDict

}

// fillApproximations tries to fill all skeleton points with sensible defaults based on some valid values
function fillApproximations(poseDict) {
  let outDict = {}
  for (const [key, value] of Object.entries(poseDict)) {
    outDict[key] = new Vector2(value.x, value.y);
  }

  if (!(poseDict["leftEye"] && poseDict["rightEye"]))
    return outDict

  let eyeDistance = poseDict["leftEye"].clone().sub(poseDict["rightEye"]).length();

  outDict["rightShoulder"] = poseDict["rightShoulder"] || new Vector2(2 * eyeDistance, 2 * eyeDistance).add(outDict["leftEye"])
  outDict["leftShoulder"] = poseDict["leftShoulder"] || new Vector2(-2 * eyeDistance, 2 * eyeDistance).add(outDict["rightEye"])

  outDict["rightElbow"] = poseDict["rightElbow"] || new Vector2(eyeDistance, 5 * eyeDistance).add(outDict["rightShoulder"])
  outDict["leftElbow"] = poseDict["leftElbow"] || new Vector2(-eyeDistance, 5 * eyeDistance).add(outDict["leftShoulder"])

  outDict["rightWrist"] = poseDict["rightWrist"] || new Vector2(eyeDistance, 5 * eyeDistance).add(outDict["rightElbow"])
  outDict["leftWrist"] = poseDict["leftWrist"] || new Vector2(-eyeDistance, 5 * eyeDistance).add(outDict["leftElbow"])

  outDict["rightAnkle"] = poseDict["rightAnkle"] || new Vector2(eyeDistance * 2, 22 * eyeDistance).add(outDict["rightEye"])
  outDict["leftAnkle"] = poseDict["leftAnkle"] || new Vector2(-eyeDistance * 2, 22 * eyeDistance).add(outDict["leftEye"])

  return outDict
}

// pointsOnCircle distributes n points around the center with radius distance
function pointsOnCircle(n, center, radius) {
  let out = [];
  let thetaFrag = (2 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    out.push(new Vector2(
      center.x + radius * Math.cos(thetaFrag * i),
      center.y + radius * Math.sin(thetaFrag * i)
    ));
  }
  return out;
}



class Shapeshifter {
  constructor(position) {
    this.speed = 0.1
    this.damp = 0.2
    this.simplex = new SimplexNoise()
    this.time = 0

    this.defaultPoints = pointsOnCircle(9, position, 100)
    this.shape = pointsOnCircle(9, position, 100);
    this.shape.forEach((point) => {
      point.v = new Vector2(0, 0);
    })
  }
  tick(poseDict, dt) {

    let newPoints = [];
    if (poseDict && poseDict["leftEye"] && poseDict["rightEye"]) {

      poseDict = fillApproximations(poseDict)
      poseDict = scaleOutwards(poseDict)

      newPoints = [
        poseDict["leftWrist"],
        poseDict["leftAnkle"],
        poseDict["rightAnkle"],
        poseDict["rightWrist"],
        poseDict["rightElbow"],
        poseDict["rightShoulder"],
        poseDict["nose"],
        poseDict["leftShoulder"],
        poseDict["leftElbow"],
      ]
    } else {
      this.defaultPoints.forEach((p) => {
        newPoints.push(new Vector2(p.x + this.simplex.noise2D(p.x, this.time) * 40 - 20, p.y + this.simplex.noise2D(p.y, this.time) * 40 - 20))
      })
    }

    for (let i = 0; i < newPoints.length; i++) {
      let newPoint = new Vector2(this.shape[i].x, this.shape[i].y)
      newPoints[i].sub(newPoint)
      this.shape[i].v.add(newPoints[i].multiplyScalar(this.speed))
    }

    this.shape.forEach((point) => {
      point.x += point.v.x
      point.y += point.v.y
      point.v.multiplyScalar(this.damp)
    })
    this.time += dt / 6000;

  }
}

export { Shapeshifter, toPoseDict }
