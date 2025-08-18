import { ApiPath } from "../data/apipath";
import type { Apod } from "./api/v1/nasa/apod/apod";

export async function renderBackground(maxImage: number)
{
  const apodIndex = Math.floor (Math.random () * maxImage);
  const fetchedApod = await fetch (`${ApiPath}/nasa/apod/${apodIndex}`);
  const apodDataBuffer = (await fetchedApod.json ()) as number[];
  const decodedData = decodeApod (apodDataBuffer);
  const apodData = (JSON.parse (decodedData)) as Apod;
  const image = apodData;
  const bgDescription = document.getElementById ("bg-description")!;
  const titleDiv = document.getElementById ("title_div")!;
  const copyRightDiv = document.getElementById ("copyright_div")!;
  const dateDiv = document.getElementById ("date_div")!;
  const background = document.getElementById ("background")!;

  const lowQualityImage = (new Image);
  lowQualityImage.src = image.url;
  lowQualityImage.onload = () =>
  {
    updateBackgroundTexts();
    background.style.backgroundImage = `url(${image.url})`;
    if (image.url !== image.hdurl)
    {
      const highQualityImage = (new Image);
      highQualityImage.src = image.hdurl;
      highQualityImage.onload = () =>
      {
        background.style.backgroundImage = `url(${image.hdurl})`;
      };
    }
    titleDiv.onclick = () =>
    {
      const url = image.hdurl;
      const a = document.createElement ("a");
      a.href = url;
      a.download = `${image.title}.${url.split (".").pop ()!.trim ()}`;
      a.target = "_blank";
      a.click ();
    }
  };

  function updateBackgroundTexts() {
    if (image.explanation !== undefined) {
      bgDescription.innerText = `${image.explanation}`;
    }
    if (image.title !== undefined) {
      titleDiv.innerText = image.title;
      background.ariaLabel = `background image: ${image.title}`;
    }
    if (image.copyright !== undefined) {
      copyRightDiv.style.visibility = "visible";
      copyRightDiv.innerText = `Copyright: ${image.copyright}`;
      bgDescription.innerText += `${image.copyright}`;
    }

    else {
      copyRightDiv.style.visibility = "hidden";
    }
    if (image.date !== undefined) {
      dateDiv.innerText = `Date: ${image.date}`;
      bgDescription.innerText += `${image.date}`;
    }
  }
}

function decodeApod(arr: number[]): string
{
  let res = "";
  for (let i = 0; i < arr.length; i += 2)
  {
    res += String.fromCharCode (arr[i + 1]).repeat (arr[i]);
  }
  return res;
}
