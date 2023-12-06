import { readFile, writeFile } from 'fs/promises';
// @ts-ignore-next-line
import { convertCSVToArray } from 'convert-csv-to-array';

const main = async () => {
  const file = await readFile('./遊戲王卡片系列列表.csv', 'utf8');
  console.log("🚀 ~ file: series_to_json.ts:6 ~ main ~ file:", file)
  const data = convertCSVToArray(file, {
    header: false,
  });
  console.log("🚀 ~ file: parseSeries.ts:11 ~ main ~ data:", data)


  const sData = data.reduce((pre: any, ele: any) => {
    if (!/https:\/\/www.cardrush.jp\/phone\/product/g.test(ele['第一張卡url'])) return pre;
    if (!/https:\/\/www.cardrush.jp\/phone\/product/g.test(ele['最後一張卡url'])) return pre;

    const first = ele['第一張卡url'].split('/').pop();
    const end = ele['最後一張卡url'].split('/').pop();
    return {
      ...pre,
      [ele['编码']]: {
        chTitle: ele['标题'],
        series: String(ele['编码']),
        period: ele['所属期数'],
        range: [Number(first), Number(end)],
      }
    }
  }, {})

  await writeFile('./data.ts', `export const data = ${JSON.stringify(sData, null, 2)}`);
}

main();
