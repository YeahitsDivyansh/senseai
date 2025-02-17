import Link from "next/link"; // Import Link from Next.js for client-side navigation
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft icon from lucide-react
import { Button } from "@/components/ui/button"; // Import custom Button component
import { getCoverLetter } from "@/actions/cover-letter"; // Import function to fetch cover letter data
import CoverLetterPreview from "../_components/cover-letter-preview"; // Import CoverLetterPreview component

// Default async function for the EditCoverLetterPage component
export default async function EditCoverLetterPage({ params }) {
  // Destructure the 'id' from the params object
  const { id } = await params;

  // Fetch the cover letter data using the 'id' from the params
  const coverLetter = await getCoverLetter(id);

  return (
    <div className="container mx-auto py-6">
      {/* Container for the back button and title */}
      <div className="flex flex-col space-y-2">
        {/* Link to navigate back to the cover letters list */}
        <Link href="/ai-cover-letter">
          {/* Button with an ArrowLeft icon and "Back to Cover Letters" text */}
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        {/* Dynamic title displaying the job title and company name */}
        <h1 className="text-6xl font-bold gradient-title mb-6">
          {coverLetter?.jobTitle} at {coverLetter?.companyName}
        </h1>
      </div>

      {/* Render the CoverLetterPreview component with the fetched cover letter content */}
      <CoverLetterPreview content={coverLetter?.content} />
    </div>
  );
}
