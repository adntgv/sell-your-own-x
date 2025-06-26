// Example of tracking an activation event
function userCreatedProject(userId, projectId) {
    // Track the event in your analytics
    analytics.track('Project Created', {
        userId: userId,
        projectId: projectId
    });

    // Trigger the next step in the onboarding flow
    // e.g., send an email about inviting team members
    sendEmail(userId, 'invite_team_members_email');
}

// Example of personalizing onboarding based on user role
function startOnboarding(user) {
    if (user.role === 'developer') {
        showDeveloperOnboarding();
    } else if (user.role === 'manager') {
        showManagerOnboarding();
    } else {
        showDefaultOnboarding();
    }
}
