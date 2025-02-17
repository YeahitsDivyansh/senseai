"use client"; // Ensures this component runs on the client side in Next.js

import React from "react"; // Importing React
import MDEditor from "@uiw/react-md-editor"; // Importing Markdown editor component

// CoverLetterPreview component to display a preview of the cover letter
const CoverLetterPreview = ({ content }) => {
  return (
    <div className="py-4">
      {" "}
      {/* Adds vertical padding for spacing */}
      {/* MDEditor renders the content in Markdown preview mode */}
      <MDEditor value={content} preview="preview" height={700} />
    </div>
  );
};

export default CoverLetterPreview; // Exporting the component for use in other parts of the application
