import Link from "next/link"; // Import Link from Next.js for client-side navigation
import { Plus } from "lucide-react"; // Import Plus icon from lucide-react
import { Button } from "@/components/ui/button"; // Import custom Button component
import CoverLetterList from "./_components/cover-letter-list"; // Import CoverLetterList component
import { getCoverLetters } from "@/actions/cover-letter"; // Import function to fetch cover letters

// Default async function for the CoverLetterPage component
export default async function CoverLetterPage() {
  // Fetch the list of cover letters using the getCoverLetters function
  const coverLetters = await getCoverLetters();

  return (
    <div>
      {/* Container for the page title and "Create New" button */}
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between mb-5">
        {/* Main title for the page */}
        <h1 className="text-6xl font-bold gradient-title">My Cover Letters</h1>

        {/* Link to navigate to the page for creating a new cover letter */}
        <Link href="/ai-cover-letter/new">
          {/* Button with a Plus icon and "Create New" text */}
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {/* Render the CoverLetterList component and pass the fetched cover letters as a prop */}
      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}
