// Code taken from https://jsfiddle.net/jo1u5r6p/2/
const pixelator = () => {
  console.log("Test");
  const fileInput = document.getElementById("fileinput");

  //on change file url
  fileInput.onchange = function (input) {
    input = fileInput;
    //check for valid file
    if (input.files && input.files[0]) {
      //get filereader and canvas
      var reader = new FileReader();
      var canvas = document.getElementById("originalImage");
      var outputCanvas = document.getElementById("outputImage");

      //for json ouput
      var listElement = [];

      reader.onload = function (e) {
        //load image
        document.getElementById("imageLoader").src = e.target.result;

        //prepare image
        let img1 = new Image();
        img1.onload = function () {
          //get canvas
          var ctx = canvas.getContext("2d");
          var outputCtx = outputCanvas.getContext("2d");

          //set size
          canvas.width = img1.width;
          canvas.height = img1.height;
          canvas.style.width = img1.width;
          canvas.style.height = img1.height;

          outputCanvas.width = img1.width;
          outputCanvas.height = img1.height;
          outputCanvas.style.width = img1.width;
          outputCanvas.style.height = img1.height;

          ctx.width = img1.width;
          ctx.height = img1.height;

          //draw original image
          ctx.drawImage(img1, 0, 0, img1.width, img1.height);

          //get split size
          var rows = document.getElementById("rows").value;
          var cols = document.getElementById("cols").value;

          //compute block size
          var blockWidth = Math.floor(img1.width / cols);
          var blockHeight = Math.floor(img1.height / rows);
          var numPx = blockHeight * blockWidth;

          //parse each block
          for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
              //prepare colors
              var red = 0;
              var green = 0;
              var blue = 0;

              //get image data
              let data = ctx.getImageData(
                i * blockWidth,
                j * blockHeight,
                blockWidth,
                blockHeight
              ).data;

              //compute mean color
              for (let k = 0; k < numPx; k++) {
                red += data[k * 4 + 0];
                green += data[k * 4 + 1];
                blue += data[k * 4 + 2];
              }

              red = Math.floor(red / numPx);
              green = Math.floor(green / numPx);
              blue = Math.floor(blue / numPx);

              //draw to output
              outputCtx.fillStyle =
                "rgb(" + red + "," + green + "," + blue + ")";
              outputCtx.fillRect(
                i * blockWidth,
                j * blockHeight,
                blockWidth,
                blockHeight
              );

              //prepare json
              var element = {};
              element["col"] = i;
              element["row"] = j;
              element["red"] = red;
              element["green"] = green;
              element["blue"] = blue;

              listElement.push(element);
            }
          }
          //display json
          document.getElementById("outputJson").innerHTML =
            "<pre>" + JSON.stringify(listElement) + "</pre>";
        };

        img1.src = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  };
};
