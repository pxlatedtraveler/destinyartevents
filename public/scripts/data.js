window.dataReceived = null;

let tries = 3;
const interval = 2000;

const dataGet = new Event('dataready');

const apiButton = document.getElementById("apiButton");
apiButton.addEventListener("click", getApi);

async function getApi () {
    try {
        const promise = await fetch('/api');
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
        console.log('err:', err);
    }
    finally {
        if (dataReceived) {
            if (dataReceived.dataStatus === 'not ready' && tries > 0) {
                tries--;
                setTimeout(getApi, interval);
                console.warn('FETCHING AGAIN via not-ready, ATTEMPTS LEFT:', tries);
            }
        }
        else {
            if (tries > 0) {
                tries--;
                setTimeout(getApi, interval);
                console.warn('FETCHING AGAIN via err, ATTEMPTS LEFT:', tries);
            }
        }

    }
}

async function postApi (request) {
    console.log('The POST data to send:',  JSON.stringify(request));
    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }

    try {
        const promise = await fetch('/api', options);
        if (!promise.ok){
            const text = await promise.text();
            throw Error(text);
        }
        const jsonResponse = await promise.json();
        console.log(jsonResponse);
    }
    catch(err) {
        console.log('err:', err);
    }
}

export { postApi }