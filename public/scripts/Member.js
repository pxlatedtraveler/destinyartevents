class Member {
    constructor(name, giftType, gift2D, gift3D, giftWrite, ban) {
      this.name = name;
      // 0 = 2D, 1 = 3D, 2 = WRITING.
      this.giftType = giftType;
      // ARRAY OF BOOLS
      this.giftsok = [gift2D, gift3D, giftWrite];
      // ARRAY OF MEMBERS USER NOT COMPATIBLE WITH
      this.ban = ban;
      // OBJECT OF ASSIGNED GIFTEE
      this.giftee = null;
      // OBJECT OF ASSIGNED GIFTER
      this.gifter = null;
      // FOR MODS IF ART IS DONE AND SUBMITTED
      this.done = false;
      // ALL POTENTIAL GIFTEES FOR CURRENT EVENT
      this._compatibleGiftees = [];
      // ALL POTENTIAL GIFTERS FOR CURRENT EVENT
      this._compatibleGifters = [];
      // REQUIRES SECOND ATTEMPT
      this._isStraggler = false;
      // NO MORE ATTEMPTS TALK TO ADMIN
      this.needsAdmin = false;
    }
}

export { Member };