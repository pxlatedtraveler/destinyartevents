/**
 * Member class used to create a profile for guild members.
 * @param {Object} discordUser Represents a user on Discord https://discord.js.org/#/docs/main/stable/class/User
 */
class Member {
    constructor(discordUser) {
        this.id = discordUser.id;
        this.username = discordUser.username;
        this.discriminator = discordUser.discriminator;
        this.tag = discordUser.tag;
        this.guildNickname = discordUser.nickname;
        this._birthday = null;
        this.inCurrentEvent = false;
        this.currentEvent = null;
        this._pastEvents = [];
        this._blocked = [];
        this._derogatoryMarks = [];
        this.isActive = true;
        this.isBanned = false;
        this.isAdmin = false;
    }

    /**
     * Birthday - This is set by the guild member.
     * Value is expected to hold day: INT and month: INT properties. Months are indexed at 0.
     * Code utilizes a set year that is a leap year and non leap to compare current year to.
     */
    get birthday() {
        return this._birthday;
    }
    set birthday(value) {
        const leapYear = 2020;
        const year = 2021;
        const month = value.month - 1;
        const day = value.day;
        if (day === 29 && month === 2) {
            this._birthday = new Date(leapYear, value.month - 1, value.day);
        }
        else {
            this._birthday = new Date(year, value.month - 1, value.day);
        }
    }

    get pastEvents() {
        // but parsed into a string!
        return this._pastEvents;
    }
    set pastEvent(value) {
        // this function is to be ran at end of each event
        // called with forEach on each member
        // add member.pastEvent = guildEvent.id;
        // query will SET?ADD? current event participant table row with member ID
        this._pastEvents.push(value);
    }

    /**
     * Blocked - For setter, pass an object with 2 properties.
     * One should be type: and its value should be either 'add' or 'remove' strings.
     * The other should be an array with a list of those to add or remove.
     */
    get blocked() {
        return this._blocked;
    }
    set blocked(value) {
        if (value.type === 'add') {
            for (let i = 0; i < value.members.length; i++) {
                if (!matchElementId(this._blocked, value.members[i]).found) {
                    this._blocked.push(value.members[i]);
                }
            }
        }
        else if (value.type === 'remove') {
            for (let i = 0; i < value.members.length; i++) {
                const results = matchElementId(this._blocked, value.members[i]);
                if (results.found) {
                    this._blocked.splice(results.index, 1);
                }
            }
        }
        console.log('Blocked:', this._blocked);
    }

    /**
     * Derogatory Marks
     */
    get derogatoryMarks() {
        return this._derogatoryMarks;
    }
    set derogatoryMarks(value) {
        if (value.type === 'add') {
            for (let i = 0; i < value.marks.length; i++) {
                if (!matchElementId(this._derogatoryMarks, value.marks[i]).found) {
                    this._derogatoryMarks.push(value.marks[i]);
                }
            }
        }
        else if (value.type === 'remove') {
            for (let i = 0; i < value.marks.length; i++) {
                const results = matchElementId(this._derogatoryMarks, value.marks[i]);
                if (results.found) {
                    this._derogatoryMarks.splice(results.index, 1);
                }
            }
        }
        console.log('Marks:', this._derogatoryMarks);
    }
}

module.exports = { Member };

// Todo: If born on leapyear, prompt if they want Feb 28 or Mar 1 on non leapyears.
// Also pls test this class over on bot.js. Maybe try having bot post some info UwU


function matchElementId(array, ele) {
    const results = { found: false, index: null };
    for (let i = 0; i < array.length; i++) {
        if (array[i]._id === ele._id) {
            results.found = true;
            results.index = i;
            break;
        }
    }
    return results;
}