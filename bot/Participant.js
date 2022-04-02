/**
 * new Participant(event, member, {isCollab: boolean, collaborators: [Member], isExchanging: boolean, giftType: string, gift2dOk: boolean, gift3dOk: boolean, giftWritingOk: boolean})
 * Use to create objects to represent members who are participating in an event. Event and Member objects must exist first.
 * Either isCollab or isExchange must be true, or both.
 * @param {Object} event An Event object type containing information about the event for this participant.
 * @param {Object} member The Member object containing information needed for participation.
 * @param {Boolean} isCollab Is true if participant is collaborating with another participant.
 * @param {Array.<Object>} collaborators Required if isCollab. Array of one or more Member objects of those collaborating with participant.
 * @param {Boolean} isExchanging Is true if participant is participating in the gift exchange child event.
 * @param {String} giftType Required if isExchanging. Can be either "2D", "3D", or "Writing".
 * @param {Boolean} gift2dOk True if participant is ok to receive 2D art.
 * @param {Boolean} gift3dOk True if participant is ok to receive 3D art.
 * @param {Boolean} giftWritingOk True if participant is ok to receive writing.
 */
export class Participant {
    constructor(event, member, data) {
        this.event = event;
        this.member = member;
        this.username = this.member.username;
        this.isCollab = data.collaborating;

        if (this.isCollab) {
            if (data.collaborators.length > 0) {
                this.collaborators = data.collaborators;
            }
            else {
                throw Error('Need at least 1 Member object in collaborators array.');
            }
        }

        this.isExchanging = data.exchanging;
        if (this.isExchanging) {
            if (data.giftType === '2D') {
                this.giftType = 0;
            }
            else if (data.giftType === '3D') {
                this.giftType = 1;
            }
            else if (data.giftType === 'Writing') {
                this.giftType = 2;
            }
            else {
                throw Error('Illegal argument exception. giftType must be "2D", "3D", or "Writing"');
            }

            this.giftsok = [data.gift2dOk, data.gift3dOk, data.giftWritingOk];
            // ARRAY OF MEMBERS USER NOT COMPATIBLE WITH
            this.ban = this.member.blocked;
            // OBJECT OF ASSIGNED GIFTEE
            this.giftee = null;
            // OBJECT OF ASSIGNED GIFTER
            this.gifter = null;
            // ALL POTENTIAL GIFTEES FOR CURRENT EVENT
            this._compatibleGiftees = [];
            // ALL POTENTIAL GIFTERS FOR CURRENT EVENT
            this._compatibleGifters = [];
            // REQUIRES SECOND ATTEMPT
            this._isStraggler = false;
            // NO MORE ATTEMPTS TALK TO ADMIN
            this.needsAdmin = false;
        }

        // FOR MODS IF ART IS DONE AND SUBMITTED
        this.done = false;
        // TRUE IF PARTICIPANT DROPS OUT OR DOESN'T SUBMIT PIECE
        this.dropOut = false;
    }
    // GETTERS
    get memberID() {
        return this.member._id;
    }

    get isBanned() {
        return this.member.banned;
    }

    // METHODS
    isDropOut() {
        this.dropOut = true;
        this.event.dropOuts++;
        // TODO: Create Derogatory Object
    }
}