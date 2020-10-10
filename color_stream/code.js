const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

ctx.canvas.width = canvas.clientWidth;
ctx.canvas.height = canvas.clientHeight;

let swatches = [];

let swatchAmount = 6;
let size = {
  x: canvas.height / swatchAmount,
  y: canvas.height / swatchAmount,
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let offset = 0;
  for (let s = 0; s < swatches.length; s++) {
    for (let c = 0; c < swatches[s].swatches.length; c++) {
      ctx.beginPath();
      ctx.rect(swatches[s].x, size.y * c, size.x, size.y);
      ctx.fillStyle = swatches[s].swatches[c];
      ctx.fill();
    // var grd = ctx.createLinearGradient(swatches[s].x, size.y * c, swatches[s].x + size.x, size.y * c + size.y);
    // grd.addColorStop(0, swatches[s].swatches[c]);
    // grd.addColorStop(1, "rgba(0,0,0,0.5)");
    // ctx.fillStyle = grd;
    // ctx.fill();
    }
  }

  requestAnimationFrame(draw)
}

function rndColor() {
  return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
}

let i = 0;
let canAdd = true;
function addSwatch(swatch) {
  if (!canAdd)
    return;
  canAdd = false;


  let tmpSwatches = []
  for (let i = 0; i < swatchAmount; i++) {
    tmpSwatches.push(rndColor());
  }
  swatches.push({
    swatches: tmpSwatches,
    x: -size.x,
  });

  swatches.forEach(swatch => {
    gsap.to(swatch, {
      x: swatch.x + size.x,
      duration: 0.3,
      ease: "power2.out",
      onComplete: function() {
        canAdd = true;
      }
    })
  })
  i++;
}

document.body.addEventListener('click', addSwatch, true);
draw();
