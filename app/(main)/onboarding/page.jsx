// Importing the industries data from a local module
import { industries } from "@/data/industries";

// Importing React to use JSX syntax
import React from "react";

// Importing the OnboardingForm component from the local _components directory
import OnboardingForm from "./_components/onboarding-form";

/**
 * OnboardingPage Component
 * This component serves as the main onboarding page.
 * It renders the OnboardingForm component and passes the industries data as a prop.
 */
const OnboardingPage = () => {
  return (
    <main>
      {/* Rendering the OnboardingForm and passing industries as a prop */}
      <OnboardingForm industries={industries} />
    </main>
  );
};

// Exporting the OnboardingPage component as the default export
export default OnboardingPage;
