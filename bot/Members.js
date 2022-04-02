export class Member {
    constructor(data) {
        this._id = data.id;
        this.username = data.username;
        this.discriminator = data.discriminator;
        // TODO: Figure out if discriminator logs the hash before the numbers.
        this.tag = this.username + this.discriminator;
        this.birthday = null;
        this.blocked = data.ban;
        this.inCurrentEvent = false;
        this.currentEvent = null;
        this.pastEvents = [];
        this.derogatoryMarks = [];
        this.isActive = true;
        this.isBanned = false;
        this.isAdmin = false;
    }
}