window.dataReceived = null;

const frontData = {content: 'Stuff to send from the Front!'};
let promise;

let tries = 3;
let interval = 2000;

const dataGet = new Event('dataready');

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
        promise = await fetch('/api', options);
        if (!promise.ok){
            const text = await promise.text();
            throw Error(text);
        }
        const jsonResponse = await promise.json();
        console.log(jsonResponse);
        if (jsonResponse.dataStatus === 'not ready'){
            console.log('RETRY');
        }
        else if (jsonResponse.dataStatus === 'ready'){
            console.log('DATA OK');
            dataReceived = jsonResponse;
            document.dispatchEvent(dataGet);
        }
    }
    catch(err) {
        console.log('err:', err, promise);
    }
    finally {
        if (dataReceived) {
            if (dataReceived.dataStatus === 'not ready' && tries > 0) {
                tries--;
                setTimeout(fetchApi, interval);
                console.warn('FETCHING AGAIN via not-ready, ATTEMPTS LEFT:', tries);
            }
        }
        else {
            if (tries > 0) {
                tries--;
                setTimeout(fetchApi, interval);
                console.warn('FETCHING AGAIN via err, ATTEMPTS LEFT:', tries);
            }
        }

    }
}

