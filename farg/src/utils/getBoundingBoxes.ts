export interface BoundingBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const getHairBB = (keypoints): BoundingBox => {
  const leftEar = keypoints.filter(({ part }) => part === "leftEar")[0]
    .position;
  const leftEye = keypoints.filter(({ part }) => part === "leftEye")[0]
    .position;
  const rightEar = keypoints.filter(({ part }) => part === "rightEar")[0]
    .position;

  const endX = leftEar.x;
  const startX = rightEar.x;
  const startY = leftEye.y - 45;
  const endY = leftEye.y - 30;

  return { startX, startY, endX, endY };
};

export const getFaceBB = (keypoints): BoundingBox => {
  const leftEar = keypoints.filter(({ part }) => part === "leftEar")[0]
    .position;
  const rightEar = keypoints.filter(({ part }) => part === "rightEar")[0]
    .position;
  const eye = keypoints.filter(({ part }) => part === "leftEye")[0].position;
  const endX = leftEar.x; // The image is mirrored so it starts from the right...
  const startY = eye.y - 30;
  const startX = rightEar.x;
  const endY = rightEar.y + 30;

  return { startX, startY, endX, endY };
};

export const getUpperBodyBB = (keypoints): BoundingBox => {
  const leftShoulder = keypoints.filter(
    ({ part }) => part === "leftShoulder"
  )[0].position;
  const rightShoulder = keypoints.filter(
    ({ part }) => part === "rightShoulder"
  )[0].position;
  const elbow = keypoints.filter(({ part }) => part === "leftElbow")[0]
    .position;

  const endX = leftShoulder.x;
  const startY = leftShoulder.y;
  const startX = rightShoulder.x;
  const endY = elbow.y;

  return { startX, startY, endX, endY };
};

export const getLowerBodyBB = (keypoints): BoundingBox => {
  const elbow = keypoints.filter(({ part }) => part === "leftElbow")[0]
    .position;
  const leftHip = keypoints.filter(({ part }) => part === "leftHip")[0]
    .position;
  const rightHip = keypoints.filter(({ part }) => part === "rightHip")[0]
    .position;

  const endX = leftHip.x;
  const startY = elbow.y;
  const startX = rightHip.x;
  const endY = rightHip.y;

  return { startX, startY, endX, endY };
};

export const getThighsBB = (keypoints): BoundingBox => {
  const leftHip = keypoints.filter(({ part }) => part === "leftHip")[0]
    .position;
  const rightKnee = keypoints.filter(({ part }) => part === "rightKnee")[0]
    .position;

  const endX = leftHip.x;
  const startY = leftHip.y;
  const startX = rightKnee.x;
  const endY = rightKnee.y;

  return { startX, startY, endX, endY };
};

export const getFeetBB = (keypoints): BoundingBox => {
  const leftAnkle = keypoints.filter(({ part }) => part === "leftAnkle")[0]
    .position;

  const endX = leftAnkle.x + 20;
  const startY = leftAnkle.y - 20;
  const startX = leftAnkle.x - 20;
  const endY = leftAnkle.y + 20;

  return { startX, startY, endX, endY };
};
