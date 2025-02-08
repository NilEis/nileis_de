import * as fs from "fs";
import { exit } from "process";
exit();
const res = new Array();
for (let i = 2024; i < 2025; i++) {
  console.log(`loading year ${i}`);
  res.push(
    fetch(
`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API}&start_date=${i}-01-01&end_date=${i}-12-31`
    )
  );
}
const data = await Promise.all(res);

for (const year of data) {
  console.log(`writing year ${year.url.substring(96, 100)}`);
  const json = await year.json();
  const file = fs.createWriteStream(`./_${year.url.substring(96, 100)}.json`);
  file.write(JSON.stringify(json));
  file.close();
}
