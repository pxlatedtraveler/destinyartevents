/*
 * //Destiny Community Events Exchange Sorter
 * 
 * //Description:
 * //Proof of concept for sorting members participating in an exchange.
 * //In a perfect world, the exchange is intended to happen in a circular format
 * //EX: A gives to B, B gives to C, C gives to D, D gives to A.
 * //This script takes into consideration the conditions of each member.
 * //Each member has member-compatability and exchange preferences. Not all can always be sorted.
 * //In the most unfortunate circumstance that all members ban a specific member for example.
 * //conditions may make it more likely for certain outcomes to almost always happen. However,
 * //This script is intended to be used with enough members to add variety, and it's also
 * //expected that most members wont have unique conditions.
 * 
 * //Author: Ruby || PxlatedTraveler
 */

let forAdminAttention = []; //USERS WHO'LL NEED ADMIN ATTENTION

class Member
{
    constructor(name, giftType, gift2D, gift3D, giftWrite, ban)
    {
      this.name = name;
      this.giftType = giftType; //0 = 2D, 1 = 3D, 2 = WRITING.
      this.giftsok = [gift2D, gift3D, giftWrite]; //ARRAY OF BOOLS
      this.ban = ban; //ARRAY OF MEMBERS USER NOT COMPATIBLE WITH
      this.giftee = null; //OBJECT OF ASSIGNED GIFTEE
      this.gifter = null; //OBJECT OF ASSIGNED GIFTER
      this.done = false; //FOR MODS IF ART IS DONE AND SUBMITTED
      this._compatibleGiftees = []; //ALL POTENTIAL GIFTEES FOR CURRENT EVENT
      this._compatibleGifters = []; //ALL POTENTIAL GIFTERS FOR CURRENT EVENT
      this._isStraggler = false; //REQUIRES SECOND ATTEMPT
      this.needsAdmin = false; //NO MORE ATTEMPTS TALK TO ADMIN
    }
}
  
const participants =
[
    new Member("ace", 0, true, false, false, ["dan", "fig"]),
    new Member("bee", 0, true, true, true, ["cat", "fig"]),
    new Member("cat", 1, true, true, false, ["fig"]),
    new Member("dan", 2, true, true, true, ["elf", "fig"]),
    new Member("elf", 1, false, true, false, ["hat", "fig"]),
    new Member("fig", 0, true, false, true, []),
    new Member("gal", 0, true, true, true, ["fig"])

/*     new Member("ace", 0, true, true, true, []),
    new Member("bee", 0, true, true, true, []),
    new Member("cat", 1, true, true, true, []),
    new Member("dan", 2, true, true, true, []),
    new Member("elf", 1, true, true, true, []),
    new Member("fig", 0, true, true, true, []),
    new Member("gal", 0, true, true, true, []) */
];

function reset ()
{
    participants.forEach(function (user){
        user.giftee = null;
        user.gifter = null;
        user.done = false;
        user._compatibleGiftees = [];
        user._compatibleGifters = [];
        user._isStraggler = false;
        user.needsAdmin = false;
    })
}
  
function getRandomElement(array, exceptions)
{
    //RETURNS RANDOM ELE FROM ARRAY
    let element = array[Math.floor(Math.random() * array.length)];
    //ELEMENTS IN EXCEPTIONS ARRAY IF PROVIDED ARE EXCLUDED
    if(exceptions){
        while (exceptions.includes(element)){
            element = array[Math.floor(Math.random() * array.length)];
        }
    }
    return element;
}

function pairAllParticipants ()
{
    //ARRAY FOR RANDOMLY SHUFFLED PARTICIPANTS
    let candidates = [];
    //ARRAY THAT WILL HOLD THE UNSUCCESSFULLY SORTED (happens only if ban and/or gift prefs added)
    let stragglers = [];
    //ARRAY TO HOLD STRAGGLERS ONLY MISSING GIFTEE
    let noGiftee = [];
    //ARRAY TO HOLD STRAGGLERS ONLY MISSING GIFTER
    let noGifter = [];
    //ARRAY TO HOLD STRAGGLERS WITH NO GIFTEE NO GIFTER
    let noGifteeNoGifter = [];
    //SHUFFLING PARTICIPANTS RANDOMLY AND ADDING TO NEW ARRAY
    for (let i = 0; i < participants.length; i++){
        while (candidates.length < i + 1){
            let user = getRandomElement(participants);
            if (candidates.includes(user) === false){
                candidates.push(user);
            }
        }
    }

    for (let i = 0; i < candidates.length; i++){
        //FINDS ALL POTENTIAL GIFTEES/GIFTERS FOR PARTICIPANT
        getAllCompatible(candidates[i], candidates);
        //ASSIGNS GIFTEE TO PARTICIPANT
        assignParticipant(candidates[i]);
        console.error(candidates[i]);
        console.log(candidates[i].name, "GIFTEE:", candidates[i].giftee);
    }
    //PUSH ALL WITH NO GIFTEE OR GIFTER INTO STRAGGLER
    candidates.forEach(user => {
        if (!user.giftee || !user.gifter){
            user._isStraggler = true;
            stragglers.push(user);
            console.warn(user.name, 'added to Stragglers');
            //IF STRAGGLER IS ALSO .needsAdmin POP OFF FROM STRAGGLER LIST
            if (forAdminAttention.includes(user)){
                stragglers.pop();
                console.warn(user.name, 'removed from stragglers');
            }
        }
    })
    //RUN EACH STRAGGLER TO CATEGORIZE
    stragglers.forEach(user => {
        if (!user.giftee && user.gifter){
            noGiftee.push(user);
        }
        else if (user.giftee && !user.gifter){
            noGifter.push(user);
        }
        else if (!user.giftee && !user.gifter){
            noGifteeNoGifter.push(user);
        }
    })

    console.log('stragglers', stragglers);
    console.log('noGiftee', noGiftee);
    console.log('noGifter', noGifter);

    noGifteeNoGifter.forEach((user)=>{
        //RUN EACH noGifteeNoGifter THROUGH SPLICE WHICH IS AN EASIER CASE TO TAKE CARE OF
        spliceCompatibles(user, noGifter);
    })

    noGiftee.forEach((user)=>{
        //FOR EVERY NOGIFTEE THERE IS A NOGIFTER AND AMONG THEM IS A PAIR THAT ARE INCOMPATIBLE
        //WHEN NOGIFTEES ARE RUN THROUGH SPLICER IF SUCCESSFUL IT WILL ALSO TAKE CARE OF A NOGIFTER
        spliceCompatibles(user, noGifter);
    });

    //LEFTOVERS NEED ADMIN ATTENTION
    participants.forEach((user)=>{
        checkNeedsAdmin(user);
    })
}

function getAllCompatible (user, candidates)
{
    //BAN CHECKS
    for (let i = 0; i < candidates.length; i++){
        if (candidates[i] !== user){
            user._compatibleGiftees.push(candidates[i]);
            if (banCheck(user, candidates[i])){
                user._compatibleGiftees.pop();
            }
            else{
                if(banCheck(candidates[i], user)){
                    user._compatibleGiftees.pop();
                }
            }
        }
    }
    //SPREAD OPERATOR TO SHALLOW COPY GIFTEES BAN-CHECKED LIST
    user._compatibleGifters = [...user._compatibleGiftees];
    //CHECK IF POTENTIAL GIFTEES GIFT PREFS COMPATIBLE WITH USER GIFT TYPE
    user._compatibleGiftees.forEach((candidate, index)=>{
        if (candidate.giftsok[user.giftType] === false){
            user._compatibleGiftees.splice(index, 1);
        }
    })
    //CHECK IF POTENTIAL GIFTERS GIFT TYPE COMPATIBLE WITH USER GIFT PREFS
    user._compatibleGifters.forEach((candidate, index)=>{
        if (user.giftsok[candidate.giftType] === false){
            user._compatibleGifters.splice(index, 1);
        }
    })
    // IF INCOMPATIBLE WITH NON, NEEDS ADMINISTRATION
    if (user._compatibleGiftees.length === 0 || user._compatibleGifters.length === 0){
        user.needsAdmin = true;
        forAdminAttention.push(user);
        console.warn(user.name, ' None compatible. See ADMIN.');
        return;
    }
}

function banCheck (user, candidate)
{
    //CHECKS IF CANDIDATE IS ON USER'S BAN LIST
    if (user.ban.length === 0){
        return false;
    }
    else{
        for (let i = 0; i < user.ban.length; i++){
            if (user.ban[i] === candidate.name){
                return true;
            }
        }
    }
    return false;
}

function checkNeedsAdmin (user)
{
    //RUN THIS AT END PARTICULARLY TO MARK GIFTERS WHO NEVER GOT A GIFTER
    if(!user.giftee || !user.gifter){
        user.needsAdmin = true;

        console.warn(user.name);
        console.log("%cHAS NO GIFTEE OR GIFTER OR BOTH. See ADMIN.", "color: white; font-style: bold; background-color: purple; padding: 2px");

        return true;
    }
    return false;
}

function assignParticipant (user)
{
    let potentialGiftees = user._compatibleGiftees;
    let potentialGifters = user._compatibleGifters;
    let giftee = null;

    if (!user.giftee){
        if (potentialGiftees.length > 0){
            let exceptions = [];
            while (giftee === null){
                giftee = getRandomElement(potentialGiftees, exceptions);
                if (giftee.gifter){
                    if (exceptions.includes(giftee)){
                        giftee = null;
                    }
                    else{
                        exceptions.push(giftee);
                        giftee = null;
                    }
                }
                else{
                    //IF GIFTEE HAS NO GIFTER WE'RE GOOD TO GO
                    user.giftee = giftee;
                    giftee.gifter = user;
                }
                //RAN THROUGH EACH POTENTIAL CANDIDATE NON WORK
                if (exceptions.length >= potentialGiftees.length){
                    //CURRENT MATCHINGS LEAVE NO ROOM FOR USER TRY SPLICING THEM
                    user._isStraggler = true;
                    break;
                }
            }
        }
    }
}

function spliceCompatibles (user, noGifter)
{
    console.log('user in splice', user);
    if (user._isStraggler){
        let potentialGiftees = user._compatibleGiftees;
        let potentialGifters = user._compatibleGifters;
        let giftee = null;
        let inheritor = null;
    
        let matches = []
    
        //FIND POTENTIAL GIFTEE THAT HAS A GIFTER IN POTENTIALGIFTERS LIST.
        for (let i = 0; i < potentialGiftees.length; i++){
            if (potentialGifters.includes(potentialGiftees[i].gifter)){
                matches.push(potentialGiftees[i]);
                console.log("%cMATCH MADE!", "color: white; font-style: bold; background-color: green; padding: 2px");
            }
        }
    
        if (matches.length === 0){
            if (!forAdminAttention.includes(user)){
                user.needsAdmin = true;
                forAdminAttention.push(user);
                console.warn(user.name, ':')
                console.log("%cNO SECONDARY MATCHES DUE TO CURRENT SORTING SPECIFICS (gifters of all that user can gift are not compatible). See ADMIN.", "color: white; font-style: bold; background-color: purple; padding: 2px");
            }
        }
        else{
            //IF STRAGGLER HAS NEITHER GIFTEE OR GIFTER
            if (!user.giftee && !user.gifter){
                //THIS IS THE EASIEST OUTCOME
                giftee = getRandomElement(matches);
    
                user.giftee = giftee;
                user.gifter = giftee.gifter;
                giftee.gifter = user;
                user.gifter.giftee = user;
    
                user._isStraggler = false;
                console.log(user.name,':')
                console.log("%cNO LONGER STRAGGLER via noGifteeNoGifter!", "color: white; font-style: bold; background-color: green; padding: 2px");
            }
            //IF STRAGGLER IS ONLY MISSING GIFTEE
            else if (!user.giftee && user.gifter){
                //FOR EVERY PARTICIPANT MISSING JUST A USER THERE IS ONE MISSING A GIFTER
                //USER'S GIFTER NEEDS TO BE ABLE TO GIFT ONE OF THE STRAGGLERS MISSING GIFTER
                //BASICALLY WHEN THIS IS THE CASE AND NOT ABOVE, THE CYCLE OF GIFTING IS NOT A CIRCLE BUT A LINE
                //THE ONE MISSING A GIFTER IS ON THE LEFT END POINT
                //THE ONE MISSING A GIFTEE IS ON THE RIGHT END POINT (ASSUMING CYCLE GOES CLOCKWISE)
                //THEREFORE ALL END POINTS THAT ARE ONE OFF AND NOT AS ABOVE MUST BE SORTED
                //SORTED UNTIL ALL ARE EITHER COMPLETE, OR SOME ARE COMPLETE WHILE THE REST ARE AS ABOVE
                //BY ABOVE I MEAN USER HAS NO GIFTEE AND NO GIFTER WHICH IS THE NECESSARY STATE FOR USER TO BE IN
                //FOR A SUCCESSFULL SPLICE
                //WHICH IS WHAT WE DO BELOW BEFORE ASSIGNING USER THEIR NEW MATCHED GIFEE/GIFTER
                let canAdoptGifter = [];
                //HERE WE CHECK ALL THOSE LACKING GIFTERS FOR COMPATIBILITY WITH USERS GIFTER
                noGifter.forEach((gifterLacking, ind)=>{
                    if (gifterLacking._compatibleGifters.includes(user.gifter)){
                        canAdoptGifter.push(gifterLacking);
                    }
                })
                if (canAdoptGifter.length > 0){
                    inheritor = getRandomElement(canAdoptGifter);
                    giftee = getRandomElement(matches);
    
                    inheritor.gifter = user.gifter;
                    inheritor.gifter.giftee = inheritor;
                    user.giftee = giftee;
                    user.gifter = giftee.gifter;
                    giftee.gifter = user;
                    user.gifter.giftee = user;
    
                    user._isStraggler = false;
                    inheritor._isStraggler = false;
                    console.log(user.name, 'AND', inheritor.name, ":");
                    console.log("%cNO LONGER STRAGGLER via noGiftee!", "color: white; font-style: bold; background-color: green; padding: 2px");
                }
                else{
                    if (!forAdminAttention.includes(user)){
                        user.needsAdmin = true;
                        forAdminAttention.push(user);
                        console.warn(user.name, ':');
                        console.log("%cNO SECONDARY MATCHES. See ADMIN.", "color: white; font-style: bold; background-color: purple; padding: 2px");
                    }
                }
            }
        }
    }
}

//////////////////////////////////////////////////
//DOM ELEMENTS
//////////////////////////////////////////////////
  
const sortButton = document.getElementById("sortButton");

sortButton.addEventListener("click", function (){
    reset();
    pairAllParticipants();

    let table = document.getElementById("results");
    let dataKeys = Object.keys(participants[0]);
    table.innerHTML = "";

    createTable(table, participants);
    createTableHead(table, dataKeys);
});


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
        for (object in element){

            if (!object.startsWith("_")){
                let cell = row.insertCell();
                let text;
    
                //console.log(getKeyByValue(participants[0], element[object])); //GIVES KEY
                //console.log(element[object]); //GIVES KEY VALUE
                //console.log(element.giftee); //GIVES PARTICIPANT OBJECT FROM ARRAY
                //console.log(Object.keys(element));
    
                if (getKeyByValue(participants[participants.indexOf(element)], element[object]) === 'giftee'){
                    if (element[object] !== null){
                        if (element[object] !== null){
                            text = document.createTextNode(element.giftee.name);
                            cell.append(text);
                        }
                    }
                    else{
                        text = document.createTextNode(element[object]);
                        cell.appendChild(text);
                    }
    
                }
                else if (getKeyByValue(participants[participants.indexOf(element)], element[object]) === 'gifter'){
                    if (element[object] !== null){
                        if (element[object] !== null){
                            text = document.createTextNode(element.gifter.name);
                            cell.append(text);
                        }
                    }
                    else{
                        text = document.createTextNode(element[object]);
                        cell.appendChild(text);
                    }
                }
                else{
                    text = document.createTextNode(element[object]);
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