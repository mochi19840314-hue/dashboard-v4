// 院長 Dashboard Pro

// 今日の日付
document.getElementById("todayDate").textContent =
new Date().toLocaleDateString("ja-JP");

// 保存ボタン
const saveButton = document.getElementById("saveToday");

saveButton.addEventListener("click", saveToday);

// 保存処理
function saveToday(){

const sales =
Number(document.getElementById("todaySales").value) || 0;

const patients =
Number(document.getElementById("todayPatients").value) || 0;

const expense =
Number(document.getElementById("todayExpense").value) || 0;

const profit = sales - expense;

const rate =
sales === 0 ? 0 :
(profit / sales * 100);

const unit =
patients === 0 ? 0 :
(sales / patients);

// 表示

document.getElementById("salesView").textContent =
sales.toLocaleString()+"円";

document.getElementById("profitView").textContent =
profit.toLocaleString()+"円";

document.getElementById("rateView").textContent =
rate.toFixed(1)+"%";

document.getElementById("unitView").textContent =
Math.round(unit).toLocaleString()+"円";

// 保存

localStorage.setItem(
"todaySales",
sales
);

localStorage.setItem(
"todayPatients",
patients
);

localStorage.setItem(
"todayExpense",
expense
);

}

// 起動時読込

window.onload=function(){

document.getElementById("todaySales").value =
localStorage.getItem("todaySales") || "";

document.getElementById("todayPatients").value =
localStorage.getItem("todayPatients") || "";

document.getElementById("todayExpense").value =
localStorage.getItem("todayExpense") || "";

saveToday();

}
