/**
 * Destiny Community Events Exchange Sorter
 * 
 * Description:
 * Proof of concept for sorting members participating in an exchange.
 * In a perfect world, the exchange is intended to happen in a circular format
 * EX: A gives to B, B gives to C, C gives to D, D gives to A.
 * This script takes into consideration the conditions of each member.
 * Each member has member-compatability and exchange preferences. Not all can always be sorted.
 * In the most unfortunate circumstance that all members ban a specific member for example.
 * conditions may make it more likely for certain outcomes to almost always happen. However,
 * This script is intended to be used with enough members to add variety, and it's also
 * expected that most members wont have unique conditions.
 * 
 * Author: Ruby || PxlatedTraveler
 */

import Member from './Member.js';
import { createTableHead, createTable } from './Tables.js';
import { getRandomElement, getAllCompatible, assignParticipant, spliceCompatibles, checkNeedsAdmin } from './Sorting.js';
import { postApi } from './Data.js';

let participantData;

window.customData = null;

window.forAdminAttention = []; //USERS WHO'LL NEED ADMIN ATTENTION

const participants = [];

/**
 * Resets all post-creation assigned properties of each participant
 * Triggers when Sort button is clicked.
 */
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

/**
 * The shuffling and sorting of all participants happen here.
 * This is triggered by the Sort button.
 */
function pairAllParticipants ()
{
    let candidates = [], stragglers = [], noGiftee = [], noGifter = [], noGifteeNoGifter = [];

    for (let i = 0; i < participants.length; i++){
        while (candidates.length < i + 1){
            //SHUFFLING PARTICIPANTS RANDOMLY AND ADDING TO NEW ARRAY
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
        //WHEN NOGIFTEES ARE RUN THROUGH SPLICER IF SUCCESSFUL IT WILL ALSO TAKE CARE OF A NOGIFTER
        spliceCompatibles(user, noGifter);
    });

    //LEFTOVERS NEED ADMIN ATTENTION
    participants.forEach((user)=>{
        checkNeedsAdmin(user);
    })
}

//////////////////////////////////////////////////
//API DATA CONVERSION
//////////////////////////////////////////////////

/**
 * Creates Member objects representing individuals, using data from Google Sheets.
 * @param {Object} data The object property within the parent object grabbed from backend called participants.
 */
function createParticipants (data)
{
    let names = data.names;
    let giftTypes = data.giftTypes;
    let giftsOk = data.giftsOk;
    let blocked = data.blocked;
    for (let i = 0; i < names.length; i++){
        //MEMBER PARAMS TAKE NAME:STRING, GIFTTYPE:INT, GIFTSOK2D BOOL, GIFTSOK3D BOOL, GIFTSOKWRITING BOOL, BAN:[STRING]
        let newMember = new Member(names[i][0],
            giftVanityConverter(giftTypes[i][0]),
            JSON.parse(giftsOk[i][0].toLowerCase()),
            JSON.parse(giftsOk[i][1].toLowerCase()),
            JSON.parse(giftsOk[i][2].toLowerCase()),
            blocked[i]);
        participants[i] = newMember;
    }
    console.log(participants);
}

/**
 * Property in the object received from backend, Object.participants.giftTypes[i][i]
 * @param {string} value Passed from Google Sheet data.
 * @returns An int value assigned to Member.giftType that will correspond with Member.giftsOk array.
 */
function giftVanityConverter (value)
{
    if (value === "2D"){
        return 0;
    }
    else if (value === "3D"){
        return 1;
    }
    else if (value === "WRITING"){
        return 2;
    }
}

//////////////////////////////////////////////////
//DOM ELEMENTS
//////////////////////////////////////////////////

//SORT BUTTON SHUFFLES AND MATCHES PARTICIPANTS AT RANDOM
const sortButton = document.getElementById("sortButton");
sortButton.disabled = true;
sortButton.value = 'NOT READY';

//CUSTOM OPTIONAL INPUT TO WRITE DATA TO A SHEET CELL
const customInput = document.getElementById("customInput");

//BUTTON TO (TODO) WRITE TO SHEETS (probably pass data to back end here, then handle PUT request there)
const postButton = document.getElementById("dataPost");
postButton.disabled = true;

//SORTING IS DISABLED UNTIL DATA IS RECEIVED FROM BACKEND 'dataready'
document.addEventListener('dataready', function () {
    participantData = dataReceived.participants;
    console.warn('WE GOTS DATA RIGHT HERE YO!', participantData);
    createParticipants(participantData);
    sortButton.onclick = function sortBtn (){
        reset();
        pairAllParticipants();
    
        let table = document.getElementById("results");
        let dataKeys = Object.keys(participants[0]);
        table.innerHTML = "";
    
        createTable(table, participants);
        createTableHead(table, dataKeys);

        postButton.onclick = function (){
            customData = {data: [[customInput.value]]};

            postApi(customData);

            console.log(customData);
        };
        postButton.disabled = false;
    };
    sortButton.disabled = false;
    sortButton.value = 'SORT';
})