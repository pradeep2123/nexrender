"use strict";
const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");

const {init, render} = require("@nexrender/core");

/**
 *
 */
let mixfile = "deep_60s.mp3";
let background = "2016-aug-deep.jpg";
let datascript = "2016-aug-deep.js";
let duration = 3600; // set max duration for 1 minute (equal to audio length)

let aepxfile = "nm05ae12.aet";
let audio = "mp3";

// const aebinary = "/Applications/Adobe After Effects 2020/aerender";
const aebinary = "./project.aep"
const port = 23234;
/**
 * HTTP server
 */
let server = http.createServer((req, res) => {
  let uri = url.parse(req.url).pathname;
  let filename = path.join(process.cwd(), uri);

  fs.exists(filename, exists => {
    if (!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      return res.end();
    }

    fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        return res.end();
      }

      // send 200
      res.writeHead(200);
      res.write(file, "binary");
      return res.end();
    });
  });
});

/**
 * Renderer
 */
server.listen(port, () => {
  console.log("Started local static server at port:", port);

  // addtional info about configuring project can be found at:
  // https://github.com/Inlife/nexrender/wiki/Project-model
  let project = {
    template: {
      src: `http://localhost:${port}/assets/${aepxfile}`,
      composition: "main",
      frameStart: 0,
      frameEnd: duration,
    },
    assets: [
      // {
      //   type: "image",
      //   name: "background.jpg",
      //   layerName: "background.jpg",
      //   src: `https://picsum.photos/1280/720`,
      //   filters: [{name: "cover", params: [1280, 720]}],
      //   extension: "jpg",
      // },
      {
        type: "image",
        name: "nm.png",
        layerName: "nm.png",
        src: `http://localhost:${port}/assets/nm.png`,
      },
      {
        type: "audio",
        name: `audio.${audio}`,
        layerName: `audio.${audio}`,
        src: `http://localhost:${port}/assets/${mixfile}`,
      },
      
      {
        type: "data",
        layerName: "artist",
        property: "position",
        value: [0, duration],
        expression: `[5*time, ${duration}]`,
      },
      {
        type: "data",
        layerName: "track name",
        property: "Source Text",
        value: "lorem",
      },
    ],
    actions: {
      postrender: [
        {
          module: "@nexrender/action-encode",
          output: "output.mp4",
          preset: "mp4",
        },
        {
          module: "@nexrender/action-copy",
          input: "output.mp4",
          output: process.cwd() +"/results/output.mp4",
        },
      ],
    },
    onChange: (job, state) => console.log("testing onChange:", state),
    onRenderProgress: (job, value) =>
      console.log("testing onRenderProgress:", value),
  };

  const settings = {
    logger: console,
    workpath: process.cwd() + "/temp",
    binary: path.join(__dirname+"/aerender.exe"),
    debug: true,
    skipCleanup: false,
  };
  console.log(settings,"settings")
  // start rendering
  render(project, init(settings))
    .then((data) => {
      // success
      server.close();
      console.log("rendering finished");
      http.send({
        type:"success",
        data:data
      })
    })
    .catch(err => {
      // error
      console.error(err);
      server.close();
    });
});

