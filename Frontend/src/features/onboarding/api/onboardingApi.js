// Simulated delay to make the mock API feel real
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const onboardingApi = {
  /**
   * Mocks checking if a username is available.
   * "taken" or "admin" will be rejected to demonstrate validation.
   */
  checkUsernameAvailability: async (username) => {
    await delay(600); // 600ms network delay
    
    if (!username || username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    const lowerUsername = username.toLowerCase();
    
    // Mock unavailable usernames
    if (['taken', 'admin', 'root', 'null', 'undefined', 'test'].includes(lowerUsername)) {
      return { available: false, message: 'Username is already taken' };
    }
    
    return { available: true, message: 'Username is available' };
  },

  /**
   * Mocks submitting the final onboarding payload to the backend
   */
  submitOnboarding: async (data) => {
    await delay(1200); // 1.2s network delay for saving
    
    console.log("Mock API received onboarding data:", data);
    
    // Simulate a successful response
    return {
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        ...data,
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        onboardingComplete: true
      }
    };
  }
};
