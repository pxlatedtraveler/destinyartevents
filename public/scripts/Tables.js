function createTableHead(table, dataKeys)
{
    let thead = table.createTHead();
    let row = thead.insertRow();

    for (let key of dataKeys){
        if (!key.startsWith("_")){
            let th = document.createElement("th");
            let text = document.createTextNode(key);
            th.appendChild(text);
            row.appendChild(th);
        }
    }
}

function createTable(table, object)
{
    for (let element of object){
        let row = table.insertRow();
        for (let prop in element){
            if (!prop.startsWith("_")){
                let cell = row.insertCell();
                let text;
    
                //console.log(getKeyByValue(participants[0], element[prop])); //GIVES KEY
                //console.log(element[prop]); //GIVES KEY VALUE
                //console.log(element.giftee); //GIVES PARTICIPANT OBJECT FROM ARRAY
                //console.log(prop.keys(element));
    
                if (getKeyByValue(object[object.indexOf(element)], element[prop]) === 'giftee'){
                    if (element[prop] !== null){
                        if (element[prop] !== null){
                            text = document.createTextNode(element.giftee.name);
                            cell.append(text);
                        }
                    }
                    else{
                        text = document.createTextNode(element[prop]);
                        cell.appendChild(text);
                    }
    
                }
                else if (getKeyByValue(object[object.indexOf(element)], element[prop]) === 'gifter'){
                    if (element[prop] !== null){
                        if (element[prop] !== null){
                            text = document.createTextNode(element.gifter.name);
                            cell.append(text);
                        }
                    }
                    else{
                        text = document.createTextNode(element[prop]);
                        cell.appendChild(text);
                    }
                }
                else{
                    text = document.createTextNode(element[prop]);
                    cell.appendChild(text);
                }
            }
        }
    }
}

function getKeyByValue(object, value)
{
    return Object.keys(object).find(key => object[key] === value);
}

export { createTableHead, createTable }