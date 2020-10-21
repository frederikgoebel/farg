import RgbQuant from "rgbquant";
import getProminentColor from "./colorDifference";
import {
  getHairBB,
  getFaceBB,
  getUpperBodyBB,
  getLowerBodyBB,
  getThighsBB,
  getFeetBB,
} from "./getBoundingBoxes";
const ROWS = 6;

// options with defaults (not required)
const options = {
  colors: 7, // desired palette size
  method: 2, // histogram method, 2: min-population threshold within subregions; 1: global top-population
  boxSize: [64, 64], // subregion dims (if method = 2)
  boxPxls: 2, // min-population threshold (if method = 2)
  initColors: 4096, // # of top-occurring colors  to start with (if method = 1)
  minHueCols: 256, // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
  dithKern: null, // dithering kernel name, see available kernels in docs below
  dithDelta: 0, // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
  dithSerp: false, // enable serpentine pattern dithering
  palette: [], // a predefined palette to start with in r,g,b tuple format: [[r,g,b],[r,g,b]...]
  reIndex: false, // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
  useCache: true, // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
  cacheFreq: 10, // min color occurance count needed to qualify for caching
  colorDist: "euclidean", // method used to determine color distance, can also be "manhattan"
};

// Generate palette by reading the middle column of the image
const generatePalette = (imageCanvas, pose) => {
  const { keypoints } = pose;
  const colorPalettes = [];
  const imageLoader = document.getElementById("image-loader");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const imgCtx = imageCanvas.getContext("2d");
  canvas.width = imageCanvas.width;
  canvas.height = imageCanvas.height;
  const blockSize = Math.floor(canvas.height / ROWS);
  ctx.putImageData(
    imgCtx.getImageData(0, 0, imageCanvas.width, imageCanvas.height),
    0,
    0
  );
  keypoints.forEach((keypoint) => {
    ctx.beginPath();
    ctx.ellipse(
      keypoint.position.x,
      keypoint.position.y,
      5,
      5,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  });

  // imageLoader.appendChild(canvas);
  for (let i = 0; i < ROWS; i++) {
    const canvasBlock = document.createElement("canvas");
    canvasBlock.width = blockSize;
    canvasBlock.height = blockSize;
    const ctxBlock = canvasBlock.getContext("2d");
    const imageData = ctx.getImageData(
      (canvas.width - blockSize) / 2,
      i * blockSize,
      blockSize,
      blockSize
    );
    ctxBlock.putImageData(imageData, 0, 0);
    const q = new RgbQuant(options);
    q.sample(canvasBlock);
    colorPalettes.push(q.palette());
    // imageLoader.append(canvasBlock);
  }

  return colorPalettes.map(
    (palette) =>
      `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]})`
  );
};

// Retrieve color from a specific area using BBs
const getColor = (imageCanvas, { startX, startY, endX, endY }) => {
  const imgCtx = imageCanvas.getContext("2d");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const width = Math.abs(startX - endX);
  const height = Math.abs(startY - endY);
  canvas.width = width;
  canvas.height = height;
  const imageData = imgCtx.getImageData(startX, startY, width, height);
  ctx.putImageData(imageData, 0, 0);
  const q = new RgbQuant(options);
  q.sample(canvas);
  const swatches = q.palette();
  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.border = "1px solid yellow";
  for (let i = 0; i < swatches.length; i += 4) {
    const [red, green, blue, alpha] = swatches.slice(i, i + 4);
    const colorDiv = document.createElement("div");
    colorDiv.style.width = "33px";
    colorDiv.style.height = "33px";
    colorDiv.style.background = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    div.append(colorDiv);
  }

  // const [red, green, blue, alpha] = swatches.slice(0, 4);

  const imageLoader = document.getElementById("image-loader");
  imageLoader.append(canvas);
  imageLoader.append(div);

  const [red, green, blue, alpha] = getProminentColor(swatches, canvas);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const generateSwatches = (imageCanvas, pose) => {
  const { keypoints } = pose;

  const hairBB = getHairBB(keypoints);
  const faceBB = getFaceBB(keypoints);
  const upperBodyBB = getUpperBodyBB(keypoints);
  const lowerBodyBB = getLowerBodyBB(keypoints);
  const thighsBB = getThighsBB(keypoints);
  const feetBB = getFeetBB(keypoints);

  const hairBox = getColor(imageCanvas, hairBB);
  const skinBox = getColor(imageCanvas, faceBB);
  const upperBodyBox = getColor(imageCanvas, upperBodyBB);
  const lowerBodyBox = getColor(imageCanvas, lowerBodyBB);
  const thighsBox = getColor(imageCanvas, thighsBB);
  const feetBox = getColor(imageCanvas, feetBB);

  return [hairBox, skinBox, upperBodyBox, lowerBodyBox, thighsBox, feetBox];
};

export default generatePalette;
