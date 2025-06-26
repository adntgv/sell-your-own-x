// Example of AI-powered personalization
async function generatePersonalizedLine(prospect) {
    const prompt = `Write a personalized opening line for a cold email to ${prospect.name}, who is a ${prospect.role} at ${prospect.company}. Their company recently ${prospect.recent_news}.`;
    const personalizedLine = await openai.complete(prompt);
    return personalizedLine;
}
