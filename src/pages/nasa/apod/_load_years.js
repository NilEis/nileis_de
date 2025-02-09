import * as fs from "fs";
import { exit } from "process";
const res = new Array();
for (let i = 2000; i < 2010; i++) {
  console.log(`loading year ${i}`);
  fetchAndWrite(
    `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API}&start_date=${i}-01-01&end_date=${i}-12-31`,
    `./_${i}.json`
  );
}

async function fetchAndWrite(url, file) {
  const res = await fetch(url);
  const json = await res.json();
  fs.writeFile(file, JSON.stringify(json), () => {
    console.log(`written ${file}`);
  });
}
