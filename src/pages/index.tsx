/**
 * 仅支持anki 导出的csv文件
 * 将会通过csv文件转为快考题导入文件
 */
import React from 'react';
import * as XLSX from 'xlsx';

async function handleFileAsync(e: React.ChangeEvent<HTMLInputElement>) {
  /* get first file */
  const file = e.target?.files?.[0];
  /* get raw data */
  if (!file) return;
  const fileName = file.name.replace(/\.csv$/, '');
  const data = await file.text();
  /* data is an ArrayBuffer */
  const wb = XLSX.read(data, {type: 'string'});
  /* do something with the workbook here */
  const excelJson = XLSX.utils.sheet_to_json<{[key in string]: string}>(wb.Sheets[wb.SheetNames[0]]);
  const firstRow = Object.keys(excelJson[0]).reduce((target, key) => {
    target[key] = key;
    return target;
  }, {} as {[key in string]: string});
  // 将每一列的第一项进行替换
  const targetJson = ([firstRow].concat(excelJson)).map(item => {
    // 处理key以及 value
    return Object.keys(item).reduce((target, key, index) => {
      // 替换所有的html标签，最终得到标签中的内容
      const str =  item[key].replace(/<\/?.+?>|\(\)/g, '').replace(/ /g, '');
      //去除str 前后的双引号
      const targetValue = str.replace(/^\"|\"$/g,'');
      // 第一条为题目
      // 第二条为答案
      // 需要生成以下顺序
      // 题目  试题分类	正确答案	难度	解析	关键词
      if (index === 0) {
        target["题目"] = targetValue;
      } else if (index === 1) {
        target["正确答案"] = targetValue;
        // 获取关键字
        const keywordStr = (item[key].match(/<b(([\s\S])*?)<\/b>/g) || []).map(item => item.replace(/<\/?.+?>|\(\)/g, '').replace(/ /g, '')).join('|');
        // 如果为非法字符，则关键字直接为空
        target["关键词"] = /,|。/g.test(keywordStr) ? '' : keywordStr;
      }
      return {
        ...target,
        "试题分类": '问答题',
        "难度": '简单',
        "解析": '',
      };
    }, {} as {[key in string]: string});
  });

  const header = ['题目',  '试题分类',	'正确答案',	'难度',	'解析',	'关键词'];
  const ws = XLSX.utils.json_to_sheet(targetJson, {header, skipHeader:true});
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, "Dates");
  /* fix headers */
  XLSX.utils.sheet_add_aoa(ws, [header], { origin: "A1" });
  XLSX.writeFile(workbook, `${fileName}.xlsx`);

}

const App: React.FC = () => {
  return (
    <input type="file" accept='.csv' onChange={handleFileAsync} />
  )
};

export default App;
