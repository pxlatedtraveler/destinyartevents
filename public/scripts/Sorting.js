function getRandomElement(array, exceptions) {
    // RETURNS RANDOM ELE FROM ARRAY
    let element = array[Math.floor(Math.random() * array.length)];
    // ELEMENTS IN EXCEPTIONS ARRAY IF PROVIDED ARE EXCLUDED
    if (exceptions) {
        while (exceptions.includes(element)) {
            element = array[Math.floor(Math.random() * array.length)];
        }
    }
    return element;
}

function getAllCompatible(user, candidates) {
    // BAN CHECKS
    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i] !== user) {
            user._compatibleGiftees.push(candidates[i]);
            if (banCheck(user, candidates[i])) {
                user._compatibleGiftees.pop();
            }
            else {
                if (banCheck(candidates[i], user)) {
                    user._compatibleGiftees.pop();
                }
            }
        }
    }
    // SPREAD OPERATOR TO SHALLOW COPY GIFTEES BAN-CHECKED LIST
    user._compatibleGifters = [...user._compatibleGiftees];
    // CHECK IF POTENTIAL GIFTEES GIFT PREFS COMPATIBLE WITH USER GIFT TYPE
    user._compatibleGiftees.forEach((candidate, index)=> {
        if (candidate.giftsok[user.giftType] === false) {
            user._compatibleGiftees.splice(index, 1);
        }
    });
    // CHECK IF POTENTIAL GIFTERS GIFT TYPE COMPATIBLE WITH USER GIFT PREFS
    user._compatibleGifters.forEach((candidate, index)=> {
        if (user.giftsok[candidate.giftType] === false) {
            user._compatibleGifters.splice(index, 1);
        }
    });
    // IF INCOMPATIBLE WITH NON, NEEDS ADMINISTRATION
    if (user._compatibleGiftees.length === 0 || user._compatibleGifters.length === 0) {
        user.needsAdmin = true;
        forAdminAttention.push(user);
        console.warn(user.name, ' None compatible. See ADMIN.');
        return;
    }
}

function banCheck(user, candidate) {
    // CHECKS IF CANDIDATE IS ON USER'S BAN LIST
    if (user.ban.length === 0) {
        return false;
    }
    else {
        for (let i = 0; i < user.ban.length; i++) {
            if (user.ban[i] === candidate.name) {
                return true;
            }
        }
    }
    return false;
}

function checkNeedsAdmin(user) {
    // RUN THIS AT END PARTICULARLY TO MARK GIFTERS WHO NEVER GOT A GIFTER
    if (!user.giftee || !user.gifter) {
        user.needsAdmin = true;

        console.warn(user.name);
        console.log('%cHAS NO GIFTEE OR GIFTER OR BOTH. See ADMIN.', 'color: white; font-style: bold; background-color: purple; padding: 2px');

        return true;
    }
    return false;
}

function assignParticipant(user) {
    const potentialGiftees = user._compatibleGiftees;
    let giftee = null;

    if (!user.giftee) {
        if (potentialGiftees.length > 0) {
            const exceptions = [];
            while (giftee === null) {
                giftee = getRandomElement(potentialGiftees, exceptions);
                if (giftee.gifter) {
                    if (exceptions.includes(giftee)) {
                        giftee = null;
                    }
                    else {
                        exceptions.push(giftee);
                        giftee = null;
                    }
                }
                else {
                    // IF GIFTEE HAS NO GIFTER WE'RE GOOD TO GO
                    user.giftee = giftee;
                    giftee.gifter = user;
                }
                // RAN THROUGH EACH POTENTIAL CANDIDATE NON WORK
                if (exceptions.length >= potentialGiftees.length) {
                    // CURRENT MATCHINGS LEAVE NO ROOM FOR USER TRY SPLICING THEM
                    user._isStraggler = true;
                    break;
                }
            }
        }
    }
}

function spliceCompatibles(user, noGifter) {
    console.log('user in splice', user);
    if (user._isStraggler) {
        const potentialGiftees = user._compatibleGiftees;
        const potentialGifters = user._compatibleGifters;
        let giftee = null;
        let inheritor = null;

        const matches = [];

        // FIND POTENTIAL GIFTEE THAT HAS A GIFTER IN POTENTIALGIFTERS LIST.
        for (let i = 0; i < potentialGiftees.length; i++) {
            if (potentialGifters.includes(potentialGiftees[i].gifter)) {
                matches.push(potentialGiftees[i]);
                console.log('%cMATCH MADE!', 'color: white; font-style: bold; background-color: green; padding: 2px');
            }
        }

        if (matches.length === 0) {
            if (!forAdminAttention.includes(user)) {
                user.needsAdmin = true;
                forAdminAttention.push(user);
                console.warn(user.name, ':');
                console.log('%cNO SECONDARY MATCHES DUE TO CURRENT SORTING SPECIFICS (gifters of all that user can gift are not compatible). See ADMIN.", "color: white; font-style: bold; background-color: purple; padding: 2px');
            }
        }
        else {
            // IF STRAGGLER HAS NEITHER GIFTEE OR GIFTER
            if (!user.giftee && !user.gifter) {
                // THIS IS THE EASIEST OUTCOME
                giftee = getRandomElement(matches);

                user.giftee = giftee;
                user.gifter = giftee.gifter;
                giftee.gifter = user;
                user.gifter.giftee = user;

                user._isStraggler = false;
                console.log(user.name, ':');
                console.log('%cNO LONGER STRAGGLER via noGifteeNoGifter!', 'color: white; font-style: bold; background-color: green; padding: 2px');
            }
            // IF STRAGGLER IS ONLY MISSING GIFTEE
            else if (!user.giftee && user.gifter) {
                // FOR EVERY PARTICIPANT MISSING JUST A GIFTEE THERE IS ONE MISSING A GIFTER
                // USER'S GIFTER NEEDS TO BE ABLE TO GIFT ONE OF THE STRAGGLERS MISSING GIFTER
                // BASICALLY WHEN THIS IS THE CASE AND NOT ABOVE, THE CYCLE OF GIFTING IS NOT A CIRCLE BUT A LINE
                // THE ONE MISSING A GIFTER IS ON THE LEFT END POINT
                // THE ONE MISSING A GIFTEE IS ON THE RIGHT END POINT (ASSUMING CYCLE GOES CLOCKWISE)
                // THEREFORE ALL END POINTS THAT ARE ONE OFF AND NOT AS ABOVE MUST BE SORTED IF POSSIBLE
                const canAdoptGifter = [];
                // HERE WE CHECK ALL THOSE LACKING GIFTERS FOR COMPATIBILITY WITH USERS GIFTER
                noGifter.forEach((gifterLacking)=> {
                    if (gifterLacking._compatibleGifters.includes(user.gifter)) {
                        canAdoptGifter.push(gifterLacking);
                    }
                });
                if (canAdoptGifter.length > 0) {
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
                    console.log(user.name, 'AND', inheritor.name, ':');
                    console.log('%cNO LONGER STRAGGLER via noGiftee!', 'color: white; font-style: bold; background-color: green; padding: 2px');
                }
                else {
                    if (!forAdminAttention.includes(user)) {
                        user.needsAdmin = true;
                        forAdminAttention.push(user);
                        console.warn(user.name, ':');
                        console.log('%cNO SECONDARY MATCHES. See ADMIN.', 'color: white; font-style: bold; background-color: purple; padding: 2px');
                    }
                }
            }
        }
    }
}

export { getRandomElement, getAllCompatible, assignParticipant, spliceCompatibles, checkNeedsAdmin };