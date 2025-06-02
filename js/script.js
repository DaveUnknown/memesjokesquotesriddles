// Select all action buttons and the display section
const buttons = document.querySelectorAll('.action-button')
const displaySec = document.getElementById('displaySec')

// Terminal Animation: Ensures only one writeToTerminal runs at a time
let writeToTerminalPromise = null;
const writeToTerminal = async (text) => {
    // Wait for any ongoing terminal animation to finish
    if (writeToTerminalPromise) {
        await writeToTerminalPromise;
    }

    const speed = 10; // Typing speed in ms per character
    let prompt = document.getElementById("prompt");
    let textIndex = 0;

    // Start new terminal animation
    writeToTerminalPromise = new Promise((resolve) => {
        let printChar = setInterval(async () => {
            if (textIndex < text.length) {
                prompt.innerText += text[textIndex];
                textIndex++;
            } else {
                prompt.innerText += "\n$ "; // Add prompt at the end
                clearInterval(printChar);
                resolve();
                writeToTerminalPromise = null;
            }
        }, speed);
        // Auto-scroll terminal to bottom
        let terminal = document.querySelector(".terminal");
        terminal.scrollTop = terminal.scrollHeight;
    });
}

// Create display elements for meme, joke, quote, and riddle
const [memeImage, jokeText, quoteText, riddleText] = [['meme','img'], ['joke','p'], ['quote','p'], ['riddle','p']].map(tag => 
    Object.assign(document.createElement(tag[1]), {
        className: `display-output`,
        id: `display-${tag[0]}`
    })
);

// Store display elements in an array for easy access
const outputs = [memeImage, jokeText, quoteText, riddleText];

// Insert display elements into the document at the correct positions
outputs.forEach((element, index) => {
    let referenceNode = displaySec.children[(index * 2) + 1]; // Insert after each label
    displaySec.insertBefore(element, referenceNode);
    // (Optional) Configure medium zoom package here if needed
});

// Generic API request function with optional callback
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

// In-memory storage for fetched content to avoid repeated API calls
let inMemory = {
    memeList:[], 
    jokeList:[],
    quoteList:[],
    riddleList:[]
}

// Prevents multiple simultaneous API requests per button
const apiLock = new Map()

// Fetches content from API, stores in memory, and manages button state
const getContent = async (API, memoryKey, contentCount, filterKey, clickedBtn, nonArrayDataBlockKey=null) => {
    if (apiLock.get(clickedBtn)) return; // Prevent duplicate requests
    
    let random = Math.floor(Math.random() * API.length);
    // API with {dataCount} placeholder : https://github.com/{dataCount}
    API = API[random].replace("{dataCount}", contentCount);
    
    try {
        // Only fetch if memory is empty
        if (!(memoryKey.length > 0)) {
            // Disable button during fetch
            clickedBtn.disabled = true;
            clickedBtn.classList.add("action-button-disabled");

            apiLock.set(clickedBtn, true);
            // Show curl command in terminal
            writeToTerminal(`curl -X GET "https://${API.replace("https://", "")}" -H "accept: application/json" -d "count=${contentCount}"`);

            try {
                const response = await request(`${API}`);
                // Handle both array and object responses
                const data = Array.isArray(response) ? response : response[nonArrayDataBlockKey] || [response];
                
                for (let item of data) {
                    if (filterKey.length > 1) {
                        // If multiple keys, store as array
                        let temp = [];
                        for (let key of filterKey) {
                            temp.push(item[key]);
                        }
                        memoryKey.push(temp);
                        
                    } else {
                        // Single key, store value directly
                        memoryKey.push(item[filterKey]);
                    }
                }
            } catch (error) {
                console.log("API errorrr! " + error)
            } finally {
                // Re-enable button after delay
                setTimeout(() => {
                    clickedBtn.disabled = false;
                    clickedBtn.classList.remove("action-button-disabled");
    
                    apiLock.set(clickedBtn, false);

                }, 1000 * 1) // delay 1 second
            }

        }
        // Show progress in terminal if not all content loaded
        let currentIndex = contentCount - memoryKey.length + 1
        if (currentIndex > 0) {
            writeToTerminal("(" + (currentIndex) + "/" + contentCount + ")")
        }
    } catch (err) {
        console.error(err);
    }
}

// Maps button IDs to their corresponding output element IDs
const buttonsOutputs = {
    memeBtn : "display-meme",
    jokeBtn : "display-joke",
    quoteBtn : "display-quote",
    riddleBtn : "display-riddle"
}

// Add click event listeners to all action buttons
buttons.forEach(button => {
    button.addEventListener("click", async (event) => {
        let btn = event.target;
        
        if (btn.id == "memeBtn") {
            // Fetch memes and display one
            await getContent(
                [
                    "https://meme-api.com/gimme/programmingmemes/{dataCount}",
                    "https://meme-api.com/gimme/ProgrammerHumor/{dataCount}"
                ],
                inMemory.memeList,
                15,
                ["url"],
                btn,
                "memes"
            );

            // Update meme image
            let memeImage = document.getElementById("display-meme");
            memeImage.src = inMemory.memeList.pop();
            console.log(memeImage.src)

        } else if (btn.id == "jokeBtn") {
            // Fetch jokes and display one
            await getContent(
                ["https://official-joke-api.appspot.com/jokes/random/{dataCount}"],
                inMemory.jokeList,
                15,
                ["setup", "punchline"],
                btn
            );

            // Update joke text
            let jokeText = document.getElementById("display-joke");
            let joke = inMemory.jokeList.pop();
            jokeText.innerText = `${joke[0]}: ${joke[1]}`;

        } else if (btn.id == "quoteBtn") {
            // Fetch quotes and display one
            await getContent(
                ["https://quotes-api-self.vercel.app/quote"],
                inMemory.quoteList,
                1,
                ["quote", "author"],
                btn
            );

            // Update quote text
            let quoteText = document.getElementById("display-quote");
            let quote = inMemory.quoteList.pop();
            quote[0] = quote[0].endsWith('.') ? quote[0].slice(0, -1) : quote[0];
            quoteText.innerText = `${quote[0]}: ${quote[1]}`;

        } else if (btn.id == "riddleBtn") {
            // Fetch riddles and display one
            await getContent(
                ["https://riddles-api.vercel.app/random"],
                inMemory.riddleList,
                1,
                ["riddle", "answer"],
                btn
            );

            // Update riddle text with hidden answer (revealed on click)
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
        
        // Show only the relevant output, hide others
        for (let key in buttonsOutputs) {
            let output = document.getElementById(buttonsOutputs[key]);
            if (key === btn.id) {
                output.style.display = "block";
            } else {
                output.style.display = "none";
            }
        }
    });
});
