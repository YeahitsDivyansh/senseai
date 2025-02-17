"use client"; // Ensures this component runs on the client side

import { useRouter } from "next/navigation"; // Next.js hook for navigation
import { format } from "date-fns"; // Utility for formatting dates
import { Eye, Trash2 } from "lucide-react"; // Icons for viewing and deleting cover letters
import { toast } from "sonner"; // Toast notifications for user feedback

// UI components from the design system
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

// AlertDialog components for delete confirmation dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { deleteCoverLetter } from "@/actions/cover-letter"; // Function to delete cover letters from the database

// CoverLetterList component that displays a list of cover letters
export default function CoverLetterList({ coverLetters }) {
  const router = useRouter(); // Router instance for navigation and refreshing data

  // Function to handle cover letter deletion
  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id); // Call API function to delete the cover letter
      toast.success("Cover letter deleted successfully!"); // Show success notification
      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter"); // Show error notification if deletion fails
    }
  };

  // Display message when there are no cover letters
  if (!coverLetters?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Cover Letters Yet</CardTitle>
          <CardDescription>
            Create your first cover letter to get started
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loop through each cover letter and display it */}
      {coverLetters.map((letter) => (
        <Card key={letter.id} className="group relative">
          <CardHeader>
            <div className="flex items-start justify-between">
              {/* Cover letter title and creation date */}
              <div>
                <CardTitle className="text-xl gradient-title">
                  {letter.jobTitle} at {letter.companyName}
                </CardTitle>
                <CardDescription>
                  Created {format(new Date(letter.createdAt), "PPP")}
                </CardDescription>
              </div>

              {/* Action buttons: View and Delete */}
              <div className="flex space-x-2">
                {/* Button to view the cover letter */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                >
                  <Eye className="h-4 w-4" /> {/* Eye icon for viewing */}
                </Button>

                {/* Delete button with confirmation dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />{" "}
                      {/* Trash icon for deletion */}
                    </Button>
                  </AlertDialogTrigger>

                  {/* Delete confirmation modal */}
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Cover Letter?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your cover letter for {letter.jobTitle} at{" "}
                        {letter.companyName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>{" "}
                      {/* Cancel button */}
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)} // Call delete function
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>

          {/* Cover letter description preview (truncated) */}
          <CardContent>
            <div className="text-muted-foreground text-sm line-clamp-3">
              {letter.jobDescription}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
