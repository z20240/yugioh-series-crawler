import {data} from './data';
import * as iconv from 'iconv-lite';
import axios from 'axios';
import { cardHeader, seriesHeader, Constants, downloadImage, writeToCsv, rangeToList, createFolder, isValidSeriesNumber } from './utils';
import { load } from 'cheerio';
import BPromise from 'bluebird';
// @ts-ignore-next-line
import fakeUa from 'fake-useragent';

const randomDelay = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

const CardRushUrl = Constants.CARD_RUSH;
const Rarity = Constants.RARITY;
const RarityToIdMap = Constants.RARITY_TO_ID_MAP;
const requestHeaders = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "zh-TW,zh;q=0.9",
  "Host": "https://www.cardrush.jp",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
  "Referer": "https://www.google.com/"
};

interface CSV_Raws { csv1: (string|number)[], csv2: (string|number)[] }
interface CSVs { csv1: (string|number)[][], csv2: (string|number)[][] }

async function getPropertiesFromCardRushPage (id: number, seriesIdx: string) {
  const titlePattern = /(.*)【(.*)】{(.*)}《(.*)》/;

  const doRequest = async (id: number) => {
    let febms = 100;
    let queryTimes = 0;
    while (queryTimes < 1) {
      try {
        const { data } = await axios.get(`${CardRushUrl}${id}`, {
          headers: {
            ...requestHeaders,
            "User-Agent": fakeUa(),
            "Referer": `https://www.cardrush.jp/phone/product-list/0/0/photo?keyword=${seriesIdx}&num=100&img=120&order=desc&page=1`
          }
        });
        queryTimes++;
        return data;
      } catch(e) {
        console.log("🚀 ~ file: index.ts:27 ~ doRequest ~ [Request Failed]: id=", id, "url: ", `${CardRushUrl}${id}`, " retry...");
        BPromise.delay(febms);
      }
    }
  }

  try {
    const page = await doRequest(id);

    const $ = load(page);

    const title = $('.thispage').text();
    const matches = title.match(titlePattern);

    if (!matches) return {};

    const [_, jpName, plantRarity, series, _cardType] = matches;
    const imageUrl = String($("a.gallery_link").attr("href")).trim();

    return { series: series.trim(), imageUrl: imageUrl, plantRarity: RarityToIdMap[Rarity[plantRarity]] ?? '0', jpName: jpName.trim() };
  } catch (e) {
    console.log("🚀 ~ file:index.ts:35 ~ getPropertiesFromCardRushPage ~ e", e)
    throw e;
  }
}

async function getPropertiesFromChiaoChiaoWuPage (series: string, option?: { id?: number|string; imageUrl?: string}): Promise<{ chName: string, uid: string }> {
try {
    const {data: page} = await axios.get(`${Constants.OCG_CHIAO_CHIAO_WU}${series}`, {
      responseType: 'arraybuffer',
      transformResponse: [(data) => iconv.decode(Buffer.from(data), 'big5')]
    });

    const $ = load(page);

    const tds = $('td');

    // @ts-ignore-next-line 中文卡名
    const chName: string = tds[14].children[0]!.data.trim();
    // @ts-ignore-next-line 卡片密碼
    const uid: string = tds[22].children[0]!.data.trim();
    console.log("🚀 ~ file: index.ts:53 ~ getPropertiesFromChiaoChiaoWuPage ~ chName:", chName, " uid:", uid)

    return { chName, uid };
  } catch (e) {
    console.log("🚀 ~ file: index.ts:72 ~ getPropertiesFromChiaoChiaoWuPage ~ series=", series, option?.id, option?.imageUrl)

    if (series.endsWith('A') || series.endsWith('R')) throw e;

    try {
      // retry with postfix A
      return await getPropertiesFromChiaoChiaoWuPage (`${series}A`, option);
    } catch (e) {
      try {
        // retry with postfix R
        return await getPropertiesFromChiaoChiaoWuPage (`${series}R`, option);
      } catch (e) {
        throw e;
      }
    }
  }
}

async function fetchNecessaryData(id: number, { seriesIdx } : { seriesIdx: string; series: string; period: number ; chTitle: string }): Promise<CSV_Raws> {
  // RC04-JP000, imageUrl, 白鑽
  const { series: seriesNo, imageUrl, plantRarity, jpName } = await getPropertiesFromCardRushPage(id, seriesIdx);

  if (!seriesNo && !imageUrl) return { csv1: [], csv2: [] };


  const pathName = isValidSeriesNumber(seriesNo) ? `./data/${seriesIdx}/${seriesNo}_${plantRarity}.jpg` : `./data/${seriesIdx}/${jpName}.jpg`;

  if (imageUrl) await downloadImage(imageUrl, pathName);

  if (!seriesNo || !isValidSeriesNumber(seriesNo)) return { csv1: [], csv2: [
    seriesIdx, '', jpName, '', '', pathName
  ] };

  // 只有卡片的部分爬巧巧屋 卡片名稱, 卡片密碼
  const { chName, uid } = await getPropertiesFromChiaoChiaoWuPage(seriesNo, {
    id,
    imageUrl,
  });

  return {
    csv1: [],
    csv2: ['', seriesIdx, plantRarity, chName, seriesNo, uid, pathName]
  }
}

async function main() {

  await Promise.all(Object.entries(data).map(async ([key, { series, period, range, chTitle }]) => {

    const serieslist = rangeToList(range[0], range[1]);

    await createFolder('data');

    // create folder to store images and csv
    await createFolder(`./data/${key}`);

    const csvlist = await Promise.all(serieslist.map(async id => {
      await BPromise.delay(randomDelay[~~(Math.random() * randomDelay.length)]);
      return fetchNecessaryData(
        id,
        { seriesIdx: key, series, period, chTitle }
      )
    }
    ));

    console.log("🚀 ~ file: index.ts:114 ~ Download images finished, starting to create CSV.")

    const { csv2 } = csvlist.reduce((acc: CSVs, cur: CSV_Raws) => {
      if (!cur) return acc;
      return {
        csv1: [...acc.csv1, cur.csv1],
        csv2: [...acc.csv2, cur.csv2]
      }
    }, { csv1: [seriesHeader], csv2: [cardHeader] } as CSVs);

    writeToCsv([seriesHeader, [1, period, '', chTitle, series, key, '']], `./系列.csv`, { append: true });
    writeToCsv(csv2, `./data/${key}/卡片.csv`);
  }))

  console.log("🚀 ~ file: index.ts:100 ~ main ~ Done!");
}

main();

