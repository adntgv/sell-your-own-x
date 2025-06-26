// Example of generating a unique referral link after signup
function generateReferralLink(email) {
    const base64Email = btoa(email); // Simple encoding for demo
    return `https://yourproduct.com/waitlist?ref=${base64Email}`;
}

// Example of tracking a referral signup
function trackReferralSignup(referrerEmail, newSignupEmail) {
    // Store this relationship in your database
    console.log(`${newSignupEmail} referred by ${referrerEmail}`);
    // Update waitlist position or grant rewards
}
