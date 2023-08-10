import axios from  'axios';
import { promises } from 'fs';

export const cardHeader = [
  "ID",
  "所属系列",
  "罕贵度",
  "卡名",
  "卡號",
  "卡片密碼",
  "封面图（链接）",
];


export const seriesHeader = [
  "ID",
  "所属游戏",
  "所属期数",
  "所属版本",
  "标题",
  "别名",
  "编码",
  "封面图"
];

export async function KidNameMap () {
  const {data} = await axios.get('https://db.ygorganization.com/data/idx/card/name/ja');
  return data;
}

export interface Rarity {
  [x: string]: string;
}
export interface RarityToIdMap {
  [x: string]: number;
}

export const rangeToList = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

export const Constants = {
  CARD_RUSH: "https://www.cardrush.jp/phone/product/",
  OCG_CHIAO_CHIAO_WU: "http://220.134.173.17/gameking/card/ocg_show.asp?call_no=",
  RARITY: {
    "ノーマル": "普卡",
    "レア": "銀字",
    "スーパー": "亮面",
    "ウルトラ": "金亮",
    "コレクターズ": "雕鑽",
    "レリーフ": "浮雕",
    "シークレット": "半鑽",
    "エクストラシークレット": "斜鑽",
    "ホログラフィック": "雷射",
    "クォーターセンチュリーシークレット": "25th鑽",
  } as Rarity,
  RARITY_TO_ID_MAP: {
    "普卡": 1,
    "銀字": 2,
    "隱普": 3,
    "亮面": 4,
    "銀亮": 5,
    "金亮": 6,
    "紅亮": 7,
    "藍亮": 8,
    "普鑽": 9,
    "半鑽": 10,
    "紅字半鑽": 11,
    "藍字半鑽": 12,
    "斜鑽": 13,
    "銀鑽": 14,
    "白鑽": 15,
    "25th鑽": 16,
    "雕鑽": 17,
    "雷射": 18,
    "黃金": 19,
    "黃金半鑽": 20,
    "浮雕": 21,
    "20th鑽": 22,
    "全鑽": 23,
    "金亮KC紋": 24,
    "普卡字紋鑽": 25,
    "銀字字紋鑽": 26,
    "亮面字紋鑽": 27,
    "金亮字紋鑽": 28,
    "黃金字紋鑽": 29,
    "半鑽字紋鑽": 30,
    "普卡彩鑽": 31,
    "亮面彩鑽": 32,
    "金亮彩鑽": 33,
    "斜鑽彩鑽": 34,
    "半鑽彩鑽": 35,
    "雷射彩鑽": 36,
    "普卡點鑽": 37,
    "銀字點鑽": 38,
    "亮面點鑽": 39,
    "金亮點鑽": 40,
    "半鑽點鑽": 41,
    "隱普點鑽": 42,
    "普卡碎鑽": 43,
    "銀字碎鑽": 44,
    "亮面碎鑽": 45,
    "金亮碎鑽": 46,
    "半鑽碎鑽": 47,
    "隱普碎鑽": 48,
    "普卡方鑽": 49,
    "銀字方鑽": 50,
    "亮面方鑽": 51,
    "金亮方鑽": 52,
    "半鑽方鑽": 53,
    "其他": 99,
  } as RarityToIdMap
}

export async function createFolder(path: string) {
  try {
    await promises.access(path);
  } catch (err) {
    await promises.mkdir(path);
  }
}

export async function downloadImage(url: string, pathName: string) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  const dirPath = pathName.split('/').slice(0, -1).join('/');
  const fileName = pathName.split('/').slice(-1)[0];

  promises.writeFile(pathName, response.data);
}


export async function writeToCsv(csv: (string|number)[][], path: string) {
  const dirPath = path.split('/').slice(0, -1).join('/');
  const fileName = path.split('/').slice(-1)[0];

  const strCSV = csv.map(row => row.join(',')).join('\n');

  promises.writeFile(path, strCSV);
}
