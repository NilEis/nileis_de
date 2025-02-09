import type { APIRoute } from 'astro';
import year_2010 from './_2010.json';
import year_2011 from './_2011.json';
import year_2012 from './_2012.json';
import year_2013 from './_2013.json';
import year_2014 from './_2014.json';
import year_2015 from './_2015.json';
import year_2016 from './_2016.json';
import year_2017 from './_2017.json';
import year_2018 from './_2018.json';
import year_2019 from './_2019.json';
import year_2020 from './_2020.json';
import year_2021 from './_2021.json';
import year_2022 from './_2022.json';
import year_2023 from './_2023.json';
import year_2024 from './_2024.json';

type Apod = {
    copyright?: string;
    date: string;
    explanation: string;
    hdurl: string;
    media_type: string;
    service_version: string;
    title: string;
    url: string;
};

const year_2025: Apod[] = await (await fetch(`https://api.nasa.gov/planetary/apod?api_key=${import.meta.env.NASA_API}&start_date=2025-01-01`)).json();

const apodData: Apod[] = [
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
    ...(year_2025 as Apod[])
].filter((apod) => apod.media_type !== 'video');

export const GET:APIRoute = async ({}) =>{
    return new Response(
      JSON.stringify(apodData)
    );
  }