import RgbQuant from "rgbquant";

const IMAGE_HEIGHT = 400;
const IMAGE_WIDTH = 400;
const ROWS = 5;
const COLS = 5;

function clearNode(node: any) {
  var cNode = node.cloneNode(false);
  node.parentNode.replaceChild(cNode, node);
}

function typeOf(val: any) {
  return Object.prototype.toString.call(val).slice(8, -1);
}

// options with defaults (not required)
const options: any = {
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

// Don't need to use
const generateBlocks = (image: HTMLImageElement) => {
  const blockElements = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const blockWidth = Math.floor(IMAGE_WIDTH / COLS);
  const blockHeight = Math.floor(IMAGE_HEIGHT / ROWS);

  // parse each block
  for (let i = 0; i < ROWS; i++) {
    for (let j = 0; j < COLS; j++) {
      const canvasBlock = document.createElement("canvas");
      canvasBlock.width = blockWidth;
      canvasBlock.height = blockHeight;
      const ctxBlock = canvasBlock.getContext("2d");
      const imageData = ctx.getImageData(
        j * blockWidth,
        i * blockHeight,
        blockWidth,
        blockHeight
      );
      ctxBlock.putImageData(imageData, 0, 0);
      blockElements.push(canvasBlock);
    }
  }
  return blockElements;
};

// Assume fixed height of image
const generateColumn = (image: HTMLImageElement) => {
  const colorPalettes = [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  const blockWidth = Math.floor(IMAGE_WIDTH / COLS);
  const blockHeight = Math.floor(IMAGE_HEIGHT / ROWS);

  for (let i = 0; i < ROWS; i++) {
    const canvasBlock = document.createElement("canvas");
    canvasBlock.width = blockWidth;
    canvasBlock.height = blockHeight;
    const ctxBlock = canvasBlock.getContext("2d");
    const imageData = ctx.getImageData(
      (image.width - blockWidth) / 2,
      i * blockHeight,
      blockWidth,
      blockHeight
    );
    ctxBlock.putImageData(imageData, 0, 0);
    const q = new RgbQuant(options);
    q.sample(canvasBlock);
    colorPalettes.push(q.palette());
  }
  return colorPalettes;
};

window.onload = function () {
  clearNode(document.getElementById("render-target"));
  const renderTarget = document.getElementById("render-target");
  const imageLoader = document.getElementById("image-loader");

  const imageGrid = new Image(IMAGE_WIDTH, IMAGE_HEIGHT);
  imageGrid.src = "home.jpg";

  // Just process one column of the image
  const columnPalette = generateColumn(imageGrid);
  columnPalette.forEach((palette) => {
    const block = document.createElement("div");
    block.classList.add("color-block");
    block.style.background = `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]}`;
    imageLoader.appendChild(block);
  });

  // Process the whole image
  const colorPalettes = [];
  const blockElements = generateBlocks(imageGrid);
  blockElements.forEach((element: any) => {
    const q = new RgbQuant(options);
    q.sample(element);
    const palette = q.palette();
    colorPalettes.push(palette);
  });
  colorPalettes.forEach((palette) => {
    const block = document.createElement("div");
    block.classList.add("color-block");
    block.style.background = `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, ${palette[3]}`;
    renderTarget.appendChild(block);
  });
};
