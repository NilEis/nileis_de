import type { Apod } from "./nasa/apod/apod.json";

export function update(apodData: Apod[]) {
    const image = apodData[Math.floor(Math.random() * (apodData.length - 1))];
    const backgroundImage = image.hdurl !== undefined ? `url("${image.hdurl}")` : "";
    const bgDescription = document.getElementById(
      "bg-description"
    ) as HTMLDivElement;
    const titleDiv = document.getElementById("title_div") as HTMLDivElement;
    const copyRightDiv = document.getElementById(
      "copyright_div"
    ) as HTMLDivElement;
    const dateDiv = document.getElementById("date_div") as HTMLDivElement;
    const background = document.getElementById("background") as HTMLDivElement;
  
    if (image.explanation !== undefined) {
      bgDescription.innerText = `${image.explanation}`;
    }
    if (image.title !== undefined) {
      titleDiv.innerText = image.title;
      background.ariaLabel = `background image: ${image.title}`;
    }
    if (image.copyright !== undefined) {
      copyRightDiv.innerText = `Copyright: ${image.copyright}`;
      bgDescription.innerText += `${image.copyright}`;
    }
    if (image.date !== undefined) {
      dateDiv.innerText = `Date: ${image.date}`;
      bgDescription.innerText += `${image.date}`;
    }
    background.style.backgroundImage = backgroundImage;
  }