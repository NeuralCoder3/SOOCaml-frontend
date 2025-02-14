import ppm from 'ppm';
import React, { useEffect } from 'react';
// @ts-ignore
import { Readable } from 'readable-stream';
// import { Stream } from 'stream';
// import Streamify from 'streamify-string';
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;

const ppm_to_URI = new Map<string, string>();

export function PPMImage(props: { ppm_text: string }) {

  const [source, setSource] = React.useState<string>("https://i.imgur.com/epMSRQH.png");
  useEffect(() => {
    if (ppm_to_URI.has(props.ppm_text)) {
      setSource(ppm_to_URI.get(props.ppm_text) as string);
    } else {
      let s = new Readable();
      s.push(props.ppm_text);
      s.push(null);

      // create string stream withour stream
      
      // const s = new ReadableStream(props.ppm_text);
      // @ts-ignore
      // const s = Streamify(props.ppm_text);
      ppm.parse(s, (err: any, data: any) => {
        if (err) {
          console.log("error", err);
          return;
        }
        // console.log("data", data);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
          console.log("error", "no context");
          return;
        }
        let image_data = data as [[number, number, number]];
        const data_width = image_data[0].length;
        const data_height = image_data.length;
        let zoom = Math.max(1, Math.round(300 / Math.max(data_width, data_height)));
        canvas.height = data_height * zoom;
        canvas.width = data_width * zoom;
        let imgData = ctx.createImageData(canvas.width, canvas.height);
        for (let i = 0; i < image_data.length; i++) {
          for (let j = 0; j < image_data[i].length; j++) {
            for (let k = 0; k < zoom; k++) {
              for (let l = 0; l < zoom; l++) {
                const r = image_data[i][j][0];
                const g = image_data[i][j][1];
                const b = image_data[i][j][2];
                let a;
                // transparentize magenta
                if (r === 255 && g === 0 && b === 255) {
                  a = 0;
                } else {
                  a = 255;
                }
                imgData.data[((i * zoom + k) * canvas.width + j * zoom + l) * 4 + 0] = r;
                imgData.data[((i * zoom + k) * canvas.width + j * zoom + l) * 4 + 1] = g;
                imgData.data[((i * zoom + k) * canvas.width + j * zoom + l) * 4 + 2] = b;
                imgData.data[((i * zoom + k) * canvas.width + j * zoom + l) * 4 + 3] = a;
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
        ppm_to_URI.set(props.ppm_text, canvas.toDataURL());
        setSource(canvas.toDataURL());
      });
    }
  }, [props.ppm_text]);

  return (<img
    src={source}
    alt="Generated PPM"
    style={{ maxWidth: '100%', maxHeight: '100%' }}
  />);
}
