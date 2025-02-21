const buttons = document.querySelectorAll('.action-button')
const displaySec = document.getElementById('displaySec')

// Create elements for display
const [memeImage, jokeText, quoteText, riddleText] = [['meme','img'], ['joke','p'], ['quote','p'], ['riddle','p']].map(tag => 
    Object.assign(document.createElement(tag[1]), {
        className: `display-output`,
        id: `display-${tag[0]}`
    })
);

// Store outputs
const outputs = [memeImage, jokeText, quoteText, riddleText];

// Add outputs to the document
outputs.forEach((element, index) => {
    let referenceNode = displaySec.children[(index * 2) + 1]; // Get the correct position
    displaySec.insertBefore(element, referenceNode);
});

// API request
const request = async (API, callback=null) => {
    try {
        const response = await fetch(API);
        if (!response.ok) {
            throw new Error("Couldn't connect to " + API);
        }
        const data = await response.json();
        if (callback) {
            callback(data);
        } else {
            return data;
        }

    } catch (err) {
        console.error(err);
    }
}

// Store content retrieved from APIs in memory
let inMemory = {
    memeList:[], 
    jokeList:[],
    quoteList:[],
    riddleList:[]
}

// API with {dataCount} placeholder : https://github.com/{dataCount}
const getContent = async (API, memoryKey, contentCount, filterKey, nonArrayDataBlockKey=null) => {
    let random = Math.floor(Math.random() * API.length);
    API = API[random];
    try {
        if (!(memoryKey.length > 1)) {
            console.log(`requesting ${contentCount} content from ${API}`);
            const response = await request(`${API.replace("{dataCount}", contentCount)}`);
            console.log("response: " + response);
            console.log("is Array:" + Array.isArray(response))
            const data = Array.isArray(response) ? response : response[nonArrayDataBlockKey] || [response];
            console.log("data: " + data);
            
            for (let item of data) {
                if (filterKey.length > 1) {
                    let temp = [];
                    for (let key of filterKey) {
                        temp.push(item[key]);
                        console.log(item[key])
                    }
                    memoryKey.push(temp);

                } else {
                    memoryKey.push(item[filterKey]);
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// Button to Output Relationshio Dictionary
const buttonsOutputs = {
    memeBtn : "display-meme",
    jokeBtn : "display-joke",
    quoteBtn : "display-quote",
    riddleBtn : "display-riddle"
}

buttons.forEach(button => {
    button.addEventListener("click", async (event) => {
        let btn = event.target.id;
        
        if (btn == "memeBtn") {
            await getContent(
                [
                    "https://meme-api.com/gimme/programmingmemes/{dataCount}",
                    "https://www.reddit.com/r/ProgrammerHumor/{dataCount}"
                ],
                inMemory.memeList,
                15,
                ["url"],
                "memes"
            );

            // Update tag
            let memeImage = document.getElementById("display-meme");
            memeImage.src = inMemory.memeList.pop();

        } else if (btn == "jokeBtn") {
            await getContent(
                ["https://official-joke-api.appspot.com/jokes/random/{dataCount}"],
                inMemory.jokeList,
                15,
                ["setup", "punchline"]
            );

            // Update tag
            let jokeText = document.getElementById("display-joke");
            let joke = inMemory.jokeList.pop();
            jokeText.innerText = `${joke[0]}: ${joke[1]}`;

        } else if (btn == "quoteBtn") {
            await getContent(
                ["https://quotes-api-self.vercel.app/quote"],
                inMemory.quoteList,
                0,
                ["quote", "author"]
            );

            // Update tag
            let quoteText = document.getElementById("display-quote");
            let quote = inMemory.quoteList.pop();
            quote[0] = quote[0].endsWith('.') ? quote[0].slice(0, -1) : quote[0];
            quoteText.innerText = `${quote[0]}: ${quote[1]}`;

        } else if (btn == "riddleBtn") {
            await getContent(
                ["https://riddles-api.vercel.app/random"],
                inMemory.riddleList,
                0,
                ["riddle", "answer"]
            );

            // Update tag
            let riddleText = document.getElementById("display-riddle");
            let riddle = inMemory.riddleList.pop();
            riddleText.innerHTML = `${riddle[0]}: 
            <span style="
                color: #282a36;
                background: #282a36;
                cursor: pointer;
                border-radius: 5px;
                "
                onclick="this.style.color='#ffffff'">
                
                ${riddle[1]}</span>`;
        }
        
        // Hide other elements
        for (let key in buttonsOutputs) {
            let output = document.getElementById(buttonsOutputs[key]);
            if (key === btn) {
                output.style.display = "block";
            } else {
                output.style.display = "none";
            }
        }
    });
});