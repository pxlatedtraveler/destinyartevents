/**
 * Event class used to create a profile for guild events.
 * Use the options object below events to add details.
 * Default values will be used for any optional properties that are skipped.
 * If setting a start/end date, and only day value is provided, the current month and year will be used.
 * Start and End dates can be reset any time with the startDate and endDate setters.
 * Once Event object is successfully created, add members by passing them as an array into the members setter.
 * Example: Event.members = [member1, member2, member3] etc, where memberX is a Members object.
 * Treat the dropOuts property the same as with members.
 * @param {Array} events Holds a list of all previous events.
 * @param {String} options.name Name for the event.
 * @param {String} options.roleName Affiliated guilde role name.
 * @param {String} options.twitterTag Hashtag name to use when tweeting results. Don't include #.
 * @param {String} options.description Give the event a description.
 * @param {Object} options.startDate Optional. Holds year, month, day as Int values to create a start date.
 * @param {Object} options.endDate Optional. Holds year, month, day as Int values to create end date.
 */
 class GuildEvent {
    constructor(events, options) {
        this.id = events.length;
        this.name = options.name || `New Event ${this.id}`;
        this.roleName = options.roleName || this.name + new Date().getFullYear;
        this.twitterTag = options.description || this.name + new Date().getFullYear;
        this.description = options.description || `This is a new event, ${this.name}.`;

        this._startDate = null;
        if (options.startDate) {
            if (options.startDate.day) {
                this.startDate = options.startDate;
            }
        }

        this._endDate = null;
        if (options.endDate) {
            if (options.endDate.day) {
                this.endDate = options.endDate;
            }
        }

        this._participants = [];
        this._dropOuts = [];
        this._totalParticipants = this.members.length;
    }

    // Start Date
    get startDate() {
        return this._startDate;
    }
    set startDate(value) {
        this._startDate = createDate(value);
    }

    // End Date
    get endDate() {
        return this._endDate;
    }
    set endDate(value) {
        this._endDate = createDate(value);
    }

    /**
     *Members - setting each new members will increase the _totalParticipants count.
     *If new member exists in _participants array, they wont be added again.
     *If member exists in _dropOut array, they will be removed.
     */
    get members() {
        return this._participants;
    }
    set members(value) {
        for (let i = 0; i < value.length; i++) {
            if (!this._participants.includes(value[i])) {
                this._participants.push(value[i]);
            }
            if (this._dropOuts.includes(value[i])) {
                this._dropOuts.splice(this._dropOuts.indexOf(value[i]), 1);
            }
        }
        this._totalParticipants = this._participants.length;
    }

    /**
     * Drop Outs - setting each new drop out will decrease the _totalParticipants count.
     * If new member exists in _dropOut array, they wont be added again.
     * If member exists in _participants array, which is expected, they will be removed.
     */
    get dropOuts() {
        return this._dropOuts;
    }
    set dropOuts(value) {
        for (let i = 0; i < value.length; i++) {
            if (!this._dropOuts.includes(value[i])) {
                this._dropOuts.push(value[i]);
            }
            if (this._participants.includes(value[i])) {
                this._participants.splice(this._participants.indexOf(value[i]), 1);
            }
        }
        this._totalParticipants = this._participants.length;
    }

    get totalParticipants() {
        return this._totalParticipants;
    }
}

/**
* A function that can take day, month and year
* but can work if only at least day is provided.
* If day alone is provided, it assumes month and year to be current.
* Month is altered to be legible for client by increasing the index by 1.
* @param {Object} dateOptions holds day: INT month: INT year: INT to be used.
*/
function createDate(dateOptions) {
    if (dateOptions.day) {
        const currentDate = new Date();
        const day = dateOptions.day;
        let month;
        let year;

        if (dateOptions.month) {
            month = dateOptions.month - 1;
        }
        else {
            month = currentDate.getMonth();
        }
        if (dateOptions.year) {
            year = dateOptions.year;
        }
        else {
            year = currentDate.getFullYear();
        }
        if (isValidDate(year, month, day)) {
            return new Date(year, month, day);
        }
        else {
            throw Error('Invalid date, check calendar.');
        }
    }
    else {
        throw Error('Minimum, Day required. No Day provided.');
    }
  }

  // Found this function here: https://stackoverflow.com/a/21188902
  // To do: Move this to Utils.js and import Utils.js here. Grab this function.
  // Also import this functioni to Members.js to test birthday validity!!!
  function isValidDate(year, month, day) {
    const d = new Date(year, month, day);
    if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day) {
        return true;
    }
    return false;
  }

  module.exports = { GuildEvent };

// To do: make sure that when date variables are provided, run them to check they are valid numbers for each.
// Ex: Months must be Numbers 1-12 (I add - 1 so its treated normal on client-facing side).
// Days must be Numbers 1-31 (will not be able to account for specific month day length so extra logic).