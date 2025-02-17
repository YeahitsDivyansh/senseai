import Link from "next/link"; // Import Link from Next.js for client-side navigation
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon from lucide-react
import { Button } from "@/components/ui/button"; // Import custom Button component
import CoverLetterGenerator from "../_components/cover-letter-generator"; // Import CoverLetterGenerator component

// Default function for the NewCoverLetterPage component
export default function NewCoverLetterPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Container for the back button and title section */}
      <div className="flex flex-col space-y-2">
        {/* Link to navigate back to the cover letters list */}
        <Link href="/ai-cover-letter">
          {/* Button with an ArrowLeft icon and "Back to Cover Letters" text */}
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        {/* Container for the page title and subtitle */}
        <div className="pb-6">
          {/* Main title for the page */}
          <h1 className="text-6xl font-bold gradient-title">
            Create Cover Letter
          </h1>
          {/* Subtitle describing the purpose of the page */}
          <p className="text-muted-foreground">
            Generate a tailored cover letter for your job application
          </p>
        </div>
      </div>

      {/* Render the CoverLetterGenerator component for creating a new cover letter */}
      <CoverLetterGenerator />
    </div>
  );
}
