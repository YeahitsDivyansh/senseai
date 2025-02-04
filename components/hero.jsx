'use client'  // Enables React's "use client" directive for Next.js, ensuring this component runs on the client side.

import Link from 'next/link'  // Importing Next.js's Link component for client-side navigation.
import React, { useEffect, useRef } from 'react'  // Importing React, useEffect (for side effects), and useRef (for referencing DOM elements).
import { Button } from './ui/button'  // Importing a custom Button component from the ui folder.
import Image from 'next/image'  // Importing Next.js's Image component for optimized image loading.

const HeroSection = () => {
  
    // Creating a reference to hold the image div, which will be manipulated when the user scrolls.
    const imageRef = useRef(null);

    useEffect(() => {
      const imageElement = imageRef.current;  // Accessing the current DOM element referenced by imageRef.

      // Function to handle scroll behavior
      const handleScroll = () => {
        const scrollPosition = window.scrollY;  // Getting the vertical scroll position of the page.
        const scrollThreshold = 100;  // Setting a threshold value for triggering the scroll effect.

        // Adding or removing a CSS class based on scroll position
        if (scrollPosition > scrollThreshold) {
          imageElement.classList.add("scrolled");  // Adding "scrolled" class when threshold is crossed.
        } else {
          imageElement.classList.remove("scrolled");  // Removing "scrolled" class when user scrolls back up.
        }
      };

      window.addEventListener("scroll", handleScroll);  // Adding the scroll event listener to track user scrolling.

      return () => window.removeEventListener("scroll", handleScroll);  // Cleanup function to remove the listener when the component unmounts.
    }, []);  // Empty dependency array ensures the effect runs only once when the component mounts.

  return (
    // Main section of the Hero component
    <section className="w-full pt-36 md:pt-48 pb-10">
      <div className="space-y-6 text-center">  
        {/* Main title and description container */}
        <div className="space-y-6 mx-auto">
            <h1 className="text-5xl font-bold md:text-6xl lg:text-7xl xl:text-8xl gradient-title animate-gradient">
            Your AI Career Coach for
            <br />
            Professional Success
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
               Advance your career with personalized guidance, interview prep, and
               AI-powered tools for job success. 
            </p>
        </div>

        {/* Buttons Section */}
        <div className="flex justify-center space-x-4">
            {/* Navigation button to go to the dashboard */}
            <Link href='/dashboard'>
              <Button size='lg' className='px-8'>Get Started</Button>  
            </Link>
            
            {/* External link to a YouTube channel */}
            <Link href="https://www.youtube.com/roadsidecoder">
              <Button size='lg' className='px-8' variant='outline'>Get Started</Button>  
            </Link>
        </div>

        {/* Image container */}
        <div className="hero-image-wrapper mt-5 md:mt-0">
            <div ref={imageRef} className='hero-image'>
                <Image
                src={"/banner.jpeg"}  // Image source file (stored locally in the public folder).
                width={1280}  // Image width in pixels.
                height={720}  // Image height in pixels.
                alt='Dashboard Preview'  // Alt text for accessibility and SEO.
                className='rounded-lg shadow-2xl border mx-auto'  // Styling for the image (rounded corners, shadow, border, and centering).
                priority  // Ensures the image loads as a high-priority asset.
                />
            </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection  // Exporting the HeroSection component so it can be used in other parts of the application.
