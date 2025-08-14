import type { APIRoute } from "astro";
import year_1999 from "./_1999.json";
import year_2000 from "./_2000.json";
import year_2001 from "./_2001.json";
import year_2002 from "./_2002.json";
import year_2003 from "./_2003.json";
import year_2004 from "./_2004.json";
import year_2005 from "./_2005.json";
import year_2006 from "./_2006.json";
import year_2007 from "./_2007.json";
import year_2008 from "./_2008.json";
import year_2009 from "./_2009.json";
import year_2010 from "./_2010.json";
import year_2011 from "./_2011.json";
import year_2012 from "./_2012.json";
import year_2013 from "./_2013.json";
import year_2014 from "./_2014.json";
import year_2015 from "./_2015.json";
import year_2016 from "./_2016.json";
import year_2017 from "./_2017.json";
import year_2018 from "./_2018.json";
import year_2019 from "./_2019.json";
import year_2020 from "./_2020.json";
import year_2021 from "./_2021.json";
import year_2022 from "./_2022.json";
import year_2023 from "./_2023.json";
import year_2024 from "./_2024.json";

export type Apod = {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
};

export function encodeApod(arr:string): number[]
{
  let prev = arr.charCodeAt (0);
  let count = 1;
  const res:number[] = [];
  for(let i = 1; i < arr.length; i++)
  {
    if(count == 255 || arr.charCodeAt (i) != prev)
    {
      res.push (count);
      res.push (prev);
      count = 1;
      prev = arr.charCodeAt (i);
    }
    else
    {
      count++;
    }
  }
  res.push (count);
  res.push (prev);
  return res;
}

const year_2025: Apod[] = import.meta.env.NASA_API!== undefined?(await (await fetch (`https://api.nasa.gov/planetary/apod?api_key=${import.meta.env.NASA_API}&start_date=2025-01-01`)).json ()) as Apod[]:[];

export const apodData: Apod[] = shuffle([
  ...(year_1999 as Apod[]),
  ...(year_2000 as Apod[]),
  ...(year_2001 as Apod[]),
  ...(year_2002 as Apod[]),
  ...(year_2003 as Apod[]),
  ...(year_2004 as Apod[]),
  ...(year_2005 as Apod[]),
  ...(year_2006 as Apod[]),
  ...(year_2007 as Apod[]),
  ...(year_2008 as Apod[]),
  ...(year_2009 as Apod[]),
  ...(year_2010 as Apod[]),
  ...(year_2011 as Apod[]),
  ...(year_2012 as Apod[]),
  ...(year_2013 as Apod[]),
  ...(year_2014 as Apod[]),
  ...(year_2015 as Apod[]),
  ...(year_2016 as Apod[]),
  ...(year_2017 as Apod[]),
  ...(year_2018 as Apod[]),
  ...(year_2019 as Apod[]),
  ...(year_2020 as Apod[]),
  ...(year_2021 as Apod[]),
  ...(year_2022 as Apod[]),
  ...(year_2023 as Apod[]),
  ...(year_2024 as Apod[]),
  ...(year_2025)
].filter ((apod) => apod.media_type !== "video"));

const rle_encoded_as_string = JSON.stringify (encodeApod (JSON.stringify (apodData)));

export const GET:APIRoute = () =>
{
  return new Response (rle_encoded_as_string);
}

function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}