export async function renderBackground(maxImage: number)
{
  const apodIndex = Math.floor (Math.random () * maxImage);
  const fetchedApod = await fetch (`/nasa/apod/${apodIndex}`);
  const apodDataBuffer = await fetchedApod.json ();
  const decodedData = decodeApod (apodDataBuffer);
  const apodData = JSON.parse (decodedData);
  const image = apodData;
  const bgDescription = document.getElementById ("bg-description");
  const titleDiv = document.getElementById ("title_div");
  const copyRightDiv = document.getElementById ("copyright_div");
  const dateDiv = document.getElementById ("date_div");
  const background = document.getElementById ("background");

  if (image.explanation !== undefined)
  {
    bgDescription.innerText = `${image.explanation}`;
  }
  if (image.title !== undefined)
  {
    titleDiv.innerText = image.title;
    background.ariaLabel = `background image: ${image.title}`;
  }
  if (image.copyright !== undefined)
  {
    copyRightDiv.innerText = `Copyright: ${image.copyright}`;
    bgDescription.innerText += `${image.copyright}`;
  }
  if (image.date !== undefined)
  {
    dateDiv.innerText = `Date: ${image.date}`;
    bgDescription.innerText += `${image.date}`;
  }
  const lowQualityImage = (new Image);
  lowQualityImage.src = image.url;
  lowQualityImage.onload = () =>
  {
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
  };
}

function decodeApod(arr: string): string
{
  let res = "";
  for (let i = 0; i < arr.length; i += 2)
  {
    res += String.fromCharCode (arr[i + 1]).repeat (arr[i]);
  }
  return res;
}
