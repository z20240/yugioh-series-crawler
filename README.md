# 遊戲王卡片爬蟲

這個專案主要專注在爬取日本 [Card Rush](https://www.cardrush.jp) 中遊戲王的卡片信息 & 卡片圖

其中之後利用台灣 [巧巧屋](http://www.ocg.idv.tw/) 的中文資料庫完善整理卡片列表的資訊。

This project mainly focuses on crawling card information & card pictures of Yu-Gi-Oh in Japan [Card Rush](https://www.cardrush.jp)

Among them, the Chinese database of Taiwan [QiaoQiaoWu](http://www.ocg.idv.tw/) was used to improve the information of the card list.

## 安裝 Install

```bash
$ npm install
```

或 or

```bash
$ yarn install
```

## 使用方法 Usage

1. 請找到 `data.ts` 檔案，並且依照 data 格式撰寫爬取所需的信息。

Please find the `data.ts` file, and write the information required for crawling according to the data format.

Example.
```javascript
{
  "系列編號|series_no": {
    "chTitle": "本系列的中文名稱|chinese_name_in_each_series",
    "series": "本系列的簡寫|series_prefix_characters",
    "period": "期數|which series",
    // 想爬取的卡片區間 (對應 card rush 網站的卡片 Url 編號)
    // The range of cards to be crawled (corresponding to the Url number of the card on the Card Rush website)
    // Example:
    // start: https://www.cardrush.jp/phone/product/68398
    // end: https://www.cardrush.jp/phone/product/68529
    // 系統便會自動爬取這個區間的卡片信息，並且產生對應的 excel, 與圖檔
    // The system will automatically crawl the card information in this range, and generate the corresponding excel, and image file.
    "range": [68398, 68529],
  }
}

```

2. 執行使用以下指令 execute the command by below

```bash
$ npm run start
```

or

```bash
$ yarn start
```

3. Result 結果
你可以在專案目錄中看到產生對應的目錄
其中會有 `卡片.csv`, `系列.csv` 以及對應的卡片圖檔

You can see the corresponding directory in the project directory
There will be `card.csv`, `series.csv` and corresponding card image files

<img width="1032" alt="image" src="https://github.com/z20240/yugioh-series-crawler/assets/11765954/cb78b106-a12d-44c7-813b-5cad41c3a8fe">


