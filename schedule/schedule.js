/* =====================================================================
 * 日历卡片脚本（AnZhiYu 主题适配版 - 单卡片垂直布局）
 * 依赖：chinese-lunar.js（公历转农历，通过 CDN 引入）
 * ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeCard();
});
document.addEventListener("pjax:complete", () => {
  initializeCard();
});
document.addEventListener("pjax:success", () => {
  setTimeout(initializeCard, 100);
});

function initializeCard() {
  cardTimes();
  cardRefreshTimes();
}

let year, month, week, date, dates, weekStr, monthStr,
    asideTime, asideDay, asideDayNum,
    animalYear, ganzhiYear, lunarMon, lunarDay;
let now = new Date();

function cardTimes() {
  now = new Date(); // 每次计算都用当前时间，避免页面长期停留 / pjax 后数据过期
  year = now.getFullYear();
  month = now.getMonth();
  week = now.getDay();
  date = now.getDate();

  const e = document.getElementById("card-widget-calendar");
  if (!e) return;

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  weekStr = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][week];
  const monthData = [
    { month: "1月", days: 31 },
    { month: "2月", days: isLeapYear ? 29 : 28 },
    { month: "3月", days: 31 },
    { month: "4月", days: 30 },
    { month: "5月", days: 31 },
    { month: "6月", days: 30 },
    { month: "7月", days: 31 },
    { month: "8月", days: 31 },
    { month: "9月", days: 30 },
    { month: "10月", days: 31 },
    { month: "11月", days: 30 },
    { month: "12月", days: 31 },
  ];
  monthStr = monthData[month].month;
  dates = monthData[month].days;

  // 计算月历网格
  const t = (week + 8 - (date % 7)) % 7; // 当月1号是星期几（0=周日）
  let n = "", d = false, s = 7 - t;
  const o = (dates - s) % 7 === 0
    ? Math.floor((dates - s) / 7) + 1
    : Math.floor((dates - s) / 7) + 2;

  const c = e.querySelector("#calendar-main");
  if (!c) return;

  // 星期表头
  let html = '<div class="calendar-weekdays">';
  ["日", "一", "二", "三", "四", "五", "六"].forEach(d => {
    html += `<div class="calendar-weekday">${d}</div>`;
  });
  html += '</div>';

  // 日期格子
  for (let i = 0; i < o; i++) {
    let rowHtml = `<div class='calendar-r${i}'>`;
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j === t) {
        n = 1;
        d = true;
      }
      const r = n === date ? " class='now'" : "";
      rowHtml += `<div class='calendar-d${j}'><a${r}>${n}</a></div>`;
      if (n >= dates) {
        n = "";
        d = false;
      }
      if (d) {
        n += 1;
      }
    }
    rowHtml += `</div>`;
    html += rowHtml;
  }
  c.innerHTML = html;

  // 农历计算
  let lunarText = "";
  try {
    const lunarDate = chineseLunar.solarToLunar(new Date(year, month, date));
    animalYear = chineseLunar.format(lunarDate, "A");
    ganzhiYear = chineseLunar.format(lunarDate, "T").slice(0, -1);
    lunarMon = chineseLunar.format(lunarDate, "M");
    lunarDay = chineseLunar.format(lunarDate, "d");
    lunarText = `${ganzhiYear}${animalYear}年 ${lunarMon}${lunarDay}`;
  } catch (err) {
    lunarText = "农历加载失败";
  }

  // 距离除夕（农历库不可用时显示 —，而不是误导性的 0 天）
  let daysUntilNewYear;
  try {
    const nextSpring = chineseLunar.lunarToSolar(year + 1, 1, 1, false);
    const springDate = new Date(
      nextSpring.getFullYear(),
      nextSpring.getMonth(),
      nextSpring.getDate()
    );
    const newYearDate = new Date(springDate);
    newYearDate.setDate(newYearDate.getDate() - 1);
    daysUntilNewYear = Math.floor((newYearDate - now) / 1e3 / 60 / 60 / 24);
    if (daysUntilNewYear < 0) daysUntilNewYear = "—"; // 目标日期异常，显示未知
  } catch (e) {
    daysUntilNewYear = "—"; // chinese-lunar 未加载/出错时显示未知，避免误报"距离 0 天"
  }

  asideTime = new Date(`${year}/01/01 00:00:00`);
  asideDay = (now - asideTime) / 1e3 / 60 / 60 / 24;
  asideDayNum = Math.floor(asideDay);
  const weekNum = week - (asideDayNum % 7) >= 0
    ? Math.ceil(asideDayNum / 7)
    : Math.ceil(asideDayNum / 7) + 1;

  // 填充顶部日期区
  e.querySelector("#calendar-date").innerHTML = date.toString().padStart(2, "0");
  e.querySelector("#calendar-week").innerHTML = `第${weekNum}周 ${weekStr}`;
  e.querySelector("#calendar-solar").innerHTML = `${year}年${monthStr}`;
  e.querySelector("#calendar-lunar").innerHTML = lunarText;
  e.querySelector("#calendar-year-day").innerHTML = `今年第 ${asideDay.toFixed(0)} 天`;
  e.querySelector("#schedule-days").innerHTML = daysUntilNewYear;
}

function cardRefreshTimes() {
  const e = document.getElementById("card-widget-calendar");
  if (!e) return;

  // 年进度
  asideTime = new Date(`${year}/01/01 00:00:00`);
  asideDay = (now - asideTime) / 1e3 / 60 / 60 / 24;
  const yearPercent = ((asideDay / 365) * 100).toFixed(1);
  const yearRemain = (365 - asideDay).toFixed(0);
  e.querySelector("#pBar_year").value = asideDay;
  e.querySelector("#p_span_year").innerHTML = yearPercent + "%";
  e.querySelector("#remain_year").innerHTML = `剩${yearRemain}天`;

  // 月进度
  const monthPercent = ((date / dates) * 100).toFixed(1);
  const monthRemain = dates - date;
  e.querySelector("#pBar_month").value = date;
  e.querySelector("#pBar_month").max = dates;
  e.querySelector("#p_span_month").innerHTML = monthPercent + "%";
  e.querySelector("#remain_month").innerHTML = `剩${monthRemain}天`;

  // 周进度
  const weekDay = week === 0 ? 7 : week;
  const weekPercent = ((weekDay / 7) * 100).toFixed(1);
  const weekRemain = 7 - weekDay;
  e.querySelector("#pBar_week").value = weekDay;
  e.querySelector("#p_span_week").innerHTML = weekPercent + "%";
  e.querySelector("#remain_week").innerHTML = `剩${weekRemain}天`;
}
