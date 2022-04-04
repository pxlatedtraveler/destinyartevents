/**
 * Member class used to create a profile for guild members.
 * @param {Object} discordUser Represents a user on Discord https://discord.js.org/#/docs/main/stable/class/User
 */
export class Member {
    constructor(discordUser) {
        this.id = discordUser.id;
        this.username = discordUser.username;
        this.discriminator = discordUser.discriminator;
        this.tag = discordUser.tag;
        this._birthday = null;
        this.blocked = [];
        this.inCurrentEvent = false;
        this.currentEvent = null;
        this.pastEvents = [];
        this.derogatoryMarks = [];
        this.isActive = true;
        this.isBanned = false;
        this.isAdmin = false;
    }

    /**
     * Birthday - This is set by the guild member.
     * Value is expected to hold day: INT and month: INT properties.
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
}

// Todo: If born on leapyear, prompt if they want Feb 28 or Mar 1 on non leapyears.