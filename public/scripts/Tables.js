function createTableHead(table, dataKeys) {
    const thead = table.createTHead();
    const row = thead.insertRow();

    for (const key of dataKeys) {
        if (!key.startsWith('_')) {
            const th = document.createElement('th');
            const text = document.createTextNode(key);
            th.appendChild(text);
            row.appendChild(th);
        }
    }
}

function createTable(table, object) {
    for (const element of object) {
        const row = table.insertRow();
        for (const prop in element) {
            if (!prop.startsWith('_')) {
                const cell = row.insertCell();
                let text;

                // console.log(getKeyByValue(participants[0], element[prop])); //GIVES KEY
                // console.log(element[prop]); //GIVES KEY VALUE
                // console.log(element.giftee); //GIVES PARTICIPANT OBJECT FROM ARRAY
                // console.log(prop.keys(element));

                if (getKeyByValue(object[object.indexOf(element)], element[prop]) === 'giftee') {
                    if (element[prop] !== null) {
                        if (element[prop] !== null) {
                            text = document.createTextNode(element.giftee.name);
                            cell.append(text);
                        }
                    }
                    else {
                        text = document.createTextNode(element[prop]);
                        cell.appendChild(text);
                    }

                }
                else if (getKeyByValue(object[object.indexOf(element)], element[prop]) === 'gifter') {
                    if (element[prop] !== null) {
                        if (element[prop] !== null) {
                            text = document.createTextNode(element.gifter.name);
                            cell.append(text);
                        }
                    }
                    else {
                        text = document.createTextNode(element[prop]);
                        cell.appendChild(text);
                    }
                }
                else {
                    text = document.createTextNode(element[prop]);
                    cell.appendChild(text);
                }
            }
        }
    }
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

export { createTableHead, createTable };