import {data} from './data';
import * as iconv from 'iconv-lite';
import axios from 'axios';
import { cardHeader, seriesHeader, Constants, downloadImage, writeToCsv, rangeToList, createFolder } from './utils';
import { load } from 'cheerio';
import BPromise from 'bluebird';

const CardRushUrl = Constants.CARD_RUSH;
const Rarity = Constants.RARITY;
const RarityToIdMap = Constants.RARITY_TO_ID_MAP;

interface CSV_Raws { csv1: (string|number)[], csv2: (string|number)[] }
interface CSVs { csv1: (string|number)[][], csv2: (string|number)[][] }

async function getPropertiesFromCardRushPage (id: number) {
  const titlePattern = /(.*)【(.*)】{(.*)}《(.*)》/;

  const doRequest = async (id: number) => {
    let febms = 100;
    let queryTimes = 0;
    while (queryTimes < 1) {
      try {
        const { data } = await axios.get(`${CardRushUrl}${id}`);
        queryTimes++;
        return data;
      } catch(e) {
        console.log("🚀 ~ file: index.ts:27 ~ doRequest ~ [Request Failed]: id=", id, " retry...");
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

    const [_, _jpName, plantRarity, series, _cardType] = matches;
    const imageUrl = $("a.gallery_link").attr("href");

    return { series, imageUrl, plantRarity: RarityToIdMap[Rarity[plantRarity]] ?? plantRarity };
  } catch (e) {
    console.log("🚀 ~ file:index.ts:35 ~ getPropertiesFromCardRushPage ~ e", e)
    throw e;
  }
}

async function getPropertiesFromChiaoChiaoWuPage (series: string) {
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
    console.log("🚀 ~ file: index.ts:57 ~ getPropertiesFromCardRushPage ~ e", e)
    throw e;
  }
}

async function fetchNecessaryData(id: number, { seriesIdx, series, period, chTitle } : { seriesIdx: string; series: string; period: number ; chTitle: string }): Promise<CSV_Raws> {
  // RC04-JP000, imageUrl, 白鑽
  const { series: seriesNo, imageUrl, plantRarity } = await getPropertiesFromCardRushPage(id);

  if (!seriesNo) return { csv1: [], csv2: [] };

  // 卡片名稱, 卡片密碼
  const { chName, uid } = await getPropertiesFromChiaoChiaoWuPage(seriesNo);

  const pathName = `./${seriesIdx}/${seriesNo}_${plantRarity}.jpg`;

  if (imageUrl) await downloadImage(imageUrl, pathName);

  return {
    csv1: [seriesIdx, 1, period, '', chTitle, series, seriesIdx, ''],
    csv2: ['', seriesIdx, plantRarity, chName, seriesNo, uid, pathName]
  }
}

async function main() {

  await Promise.all(Object.entries(data).map(async ([key, { series, period, range, chTitle }]) => {

    const serieslist = rangeToList(range[0], range[1]);

    // create folder to store images and csv
    await createFolder(key);

    const csvlist = await Promise.all(serieslist.map(id =>
      fetchNecessaryData(
        id,
        { seriesIdx: key, series, period, chTitle }
      )
    ));

    console.log("🚀 ~ file: index.ts:114 ~ Download images finished, starting to create CSV.")

    const { csv1, csv2 } = csvlist.reduce((acc: CSVs, cur: CSV_Raws) => {
      if (!cur) return acc;
      return {
        csv1: [...acc.csv1, cur.csv1],
        csv2: [...acc.csv2, cur.csv2]
      }
    }, { csv1: [seriesHeader], csv2: [cardHeader] } as CSVs);

    writeToCsv(csv1, `./${key}/系列.csv`);
    writeToCsv(csv2, `./${key}/卡片.csv`);
  }))

  console.log("🚀 ~ file: index.ts:100 ~ main ~ Done!");
}

main();

