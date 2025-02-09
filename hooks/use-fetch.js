import { useState } from "react";
import { toast } from "sonner"; // For showing error notifications

const useFetch = (cb) => {
  const [data, setData] = useState(undefined); // Stores fetched data
  const [loading, setLoading] = useState(null); // Tracks loading state
  const [error, setError] = useState(null); // Stores any errors

  /**
   * Function to trigger the API request.
   * It handles loading state, errors, and stores the response data.
   * @param {...any} args - Arguments to pass to the API function.
   */
  const fn = async (...args) => {
    setLoading(true); // Set loading to true when fetching starts
    setError(null); // Reset error before making a new request

    try {
      const response = await cb(...args); // Call the provided function (API request)
      setData(response); // Store the fetched data
      setError(null); // Ensure error state is cleared
    } catch (error) {
      setError(error); // Store error message
      toast.error(error.message); // Show error notification
    } finally {
      setLoading(false); // Set loading to false once request is complete
    }
  };

  return { data, loading, error, fn, setData }; // Return state and function to trigger fetch
};

export default useFetch;
