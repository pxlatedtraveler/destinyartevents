export default class Member
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