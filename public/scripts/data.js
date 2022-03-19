const frontData = {content: 'Stuff to send from the Front!'};
let dataReceived;
let promise;

const dataGet = new Event('dataready');

document.addEventListener('dataready', function () {
    //IMPORT MAIN FUNCTION FROM MAIN JS earlier in doc of course
    //BUT THEN CALL THAT FUNCTION INSTEAD OF THIS ANON FUNC.
    //USE DATA GRABBED FROM HERE
    //ALSO CONVERT MAIN CODE TO EXPORT STUFF TO IMPORT HERE?
    //but currently trying to trigger my own errors...
})

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(frontData)
}

const apiButton = document.getElementById("apiButton");
apiButton.addEventListener("click", fetchApi);

async function fetchApi () {
    try {
        promise = await fetch('/api', options)
        .then((response) => {
            console.log('CURRENT RES:', response);
            if (response.status >= 200 && response.status <= 299) {
                response.json()
                .then((backData) => {
                    dataReceived = backData;
                    console.log(backData);
                    document.emit
                    return backData;
                })
            }
            else {
                throw Error(response.statusText);
            }
        })//TRYING TO GET THIS TO TRIGGER. must wait for api reset
        .catch((error) => {
            console.log(error);
        })
    }
    catch(err) {
        console.log('err:', promise, dataReceived);
    }
    console.log('promise:', promise);
    console.log('data received:', dataReceived);
}

const repostButton = document.getElementById("dataRepost");
repostButton.addEventListener("click", repostData)

function repostData () {
    console.log(dataReceived);
}

