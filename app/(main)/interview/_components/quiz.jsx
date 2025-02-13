"use client"; // Indicates this component is a Client Component in Next.js

// Import necessary dependencies
import { generateQuiz, saveQuizResult } from "@/actions/interview"; // Import functions for generating and saving quiz results
import { Button } from "@/components/ui/button"; // Import a button component
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import card components for UI structure
import { Label } from "@/components/ui/label"; // Import label component
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import radio group components for answer selection
import useFetch from "@/hooks/use-fetch"; // Custom hook for handling async API calls
import { Loader2 } from "lucide-react"; // Icon for loading state
import React, { useEffect, useState } from "react"; // Import React hooks
import { BarLoader } from "react-spinners"; // Import loading indicator
import { toast } from "sonner"; // Import toast notifications
import QuizResult from "./quiz-result"; // Import QuizResult component to display results

const Quiz = () => {
  // State to track the current question index
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // State to store user's answers
  const [answers, setAnswers] = useState([]);

  // State to control explanation visibility
  const [showExplanation, setShowExplanation] = useState(false);

  // Fetch quiz data using the custom useFetch hook
  const {
    loading: generatingQuiz, // Loading state while generating quiz
    fn: generateQuizFn, // Function to trigger quiz generation
    data: quizData, // Store fetched quiz data
  } = useFetch(generateQuiz);

  // Fetch function for saving quiz results
  const {
    loading: savingResult, // Loading state while saving results
    fn: saveQuizResultFn, // Function to save quiz results
    data: resultData, // Store quiz result data
    setData: setResultData, // Function to update result data
  } = useFetch(saveQuizResult);

  // When quiz data is available, initialize the answers array
  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null)); // Create an array with null values for each question
    }
  }, [quizData]);

  // Handle user's answer selection
  const handleAnswer = (answer) => {
    const newAnswers = [...answers]; // Create a copy of current answers
    newAnswers[currentQuestion] = answer; // Update the selected answer for the current question
    setAnswers(newAnswers); // Update the state
  };

  // Handle next question logic
  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1); // Move to the next question
      setShowExplanation(false); // Hide explanation for the next question
    } else {
      finishQuiz(); // If it's the last question, finish the quiz
    }
  };

  // Calculate quiz score based on correct answers
  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++; // Increase count if answer is correct
      }
    });
    return (correct / quizData.length) * 100; // Return score percentage
  };

  // Handle quiz completion
  const finishQuiz = async () => {
    const score = calculateScore(); // Calculate final score
    try {
      await saveQuizResultFn(quizData, answers, score); // Save quiz result
      toast.success("Quiz completed!"); // Show success message
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results"); // Show error message if saving fails
    }
  };

  // Start a new quiz
  const startNewQuiz = () => {
    setCurrentQuestion(0); // Reset question index
    setAnswers([]); // Reset answers
    setShowExplanation(false); // Hide explanation
    generateQuizFn(); // Fetch a new quiz
    setResultData(null); // Reset quiz result
  };

  // Display loading indicator while quiz is being generated
  if (generatingQuiz) {
    return <BarLoader className="mt-4" width={"100%"} color="gray" />;
  }

  // Display quiz result if available
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  // Initial screen before starting quiz
  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Ready to test your knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions specific to your industry and
            skills. Take your time and choose the best answer for each question.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={generateQuizFn} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Get current question data
  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of {quizData.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium">{question.question}</p>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="space-y-2"
        >
          {question.options.map((option, index) => {
            return (
              <div className="flex items-center space-x-2" key={index}>
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            );
          })}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            variant="outline"
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        )}

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="ml-auto"
        >
          {savingResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentQuestion < quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Quiz;
