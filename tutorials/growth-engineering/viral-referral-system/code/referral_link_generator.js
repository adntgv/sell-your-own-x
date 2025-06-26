// Example of generating a unique referral link
function generateReferralLink(userId) {
    const referralCode = btoa(userId); // Base64 encode user ID
    return `https://yourapp.com/signup?ref=${referralCode}`;
}
