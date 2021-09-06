function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

function getWeekNumber(date) {
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function processData(data) {
    let result = {};
    let rows = data.split(/\r?\n|\r/).slice(1);
    for (let row of rows) {
        elems = row.split(",");
        // skip the last couple rows without dates
        if (!elems[0]) {
            break;
        }
        // parse dates
        let [firstDay, firstMonth, firstYear] = elems[0].split("-");
        let [lastDay, lastMonth, lastYear] = elems[1].split("-");
        let week = new Date(firstYear, firstMonth - 1, firstDay);
        let end = new Date(lastYear, lastMonth - 1, lastDay);
        elems[0] = week;
        elems[1] = end;
        result[`${getWeekNumber(new Date(week.getTime()))}-${firstYear}`] = elems;
    }
    return result;
}

function createSelect(data) {
    let names = new Set();
    for (let val of Object.values(data)) {
        names.add(val[2]);
        names.add(val[3]);
        names.add(val[4]);
    }
    var element = document.getElementById("names");
    for (let name of [...names].sort()) {
        element.add(new Option(name));
    }
}

function createTable(data, person) {
    let printTasks = [];
    let months = ["Jan", "Feb", "Maa", "Apr", "Mei", "Jun", "Jul", "Aug",
        "Sep", "Okt", "Nov", "Dec"];
    for (let num of Object.keys(data)) {
        let week = data[num];
        let today = new Date();
        let thisWeek = getWeekNumber(today);
        let [weekNum, weekYear] = num.split("-");
        if (weekYear <= today.getFullYear() && weekNum < thisWeek) {
            continue;
        }
        let personTasks = getAllIndexes(week, person);
        if (personTasks.length === 0) {
            continue;
        }
        let repr = ["", "", "Keuken", "Keuken", "Keuken", "WC's", "Douches"];

        let printWeek = [];
        for (let task of personTasks) {
            printWeek.push(repr[task]);
        }
        let from = `${week[0].getDate()} ${months[week[0].getMonth()]}`;
        let till = `${week[1].getDate()} ${months[week[1].getMonth()]}`;
        printTasks.push(`<td>${from}</td><td>${till}</td><td>${printWeek.join(" & ")}</td>`);
    }
    let content = "<tr>" + printTasks.join("</tr><tr>") + "</tr>";
    document.querySelector("#table tbody").innerHTML = content;
    document.querySelector("h1").innerHTML = `Weektaken van ${person}`;
}

function createSelect(data) {
    let names = new Set();
    for (let val of Object.values(data)) {
        names.add(val[2]);
        names.add(val[3]);
        names.add(val[4]);
    }
    var element = document.getElementById("names");
    for (let name of [...names].sort()) {
        element.add(new Option(name));
    }
}

fetch("data.csv", { method: "GET", headers: {} })
    .then(function (response) {
        return response.text();
    })
    .then(function (rawData) {
        let allTasks = processData(rawData);
        let page = location.href.split("/").slice(-1)[0];
        let today = new Date();
        let thisWeek = `${getWeekNumber(today)}-${today.getFullYear()}`;

        if (!page || page === 'index.html') {
            let people = allTasks[thisWeek];
            let [kitchen1, kitchen2, kitchen3, toilet, shower] = people.slice(2);
            document.getElementById("kitchen").innerHTML = `${kitchen1}, ${kitchen2}, ${kitchen3}`;
            document.getElementById("toilet").innerHTML = toilet;
            document.getElementById("shower").innerHTML = shower;
        } else if (page === 'personal.html') {
            createSelect(allTasks);
            document.getElementById("names").addEventListener("change", function(change) {
                var opt = change.srcElement.options[change.srcElement.selectedIndex];
                createTable(allTasks, opt.text);
            });
        }
    });
