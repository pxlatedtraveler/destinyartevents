const frontData = {content: 'Stuff to send from the Front!'};
let dataReceived;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(frontData)
}

const apiButton = document.getElementById("apiButton");
apiButton.addEventListener("click", fetchApi);

function fetchApi () {
    fetch('/api', options)
    .then(response => response.json()
    .then((backData) => {
      console.log(backData);
      console.log(backData.rows);
      dataReceived = backData;
    }))
}

const repostButton = document.getElementById("dataRepost");
repostButton.addEventListener("click", repostData)

function repostData () {
    console.log(dataReceived);
}

