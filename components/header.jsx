import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { ChevronDown, LayoutDashboard, StarsIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

const Header = () => {
  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
    <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
      <Link href='/'>
        <Image 
          src='/logo.png'
          alt='Senseai logo'
          width={200}
          height={60}
          priority={true}
          className="h-12 py-1 w-auto object-contain"
        />
      </Link>

      <div className='flex items-center space-x-2 md:space-x-4'>
        <SignedIn>
          <Link href={`/dashboard`}>
            <Button>
              <LayoutDashboard  className="h-4 w-4" />
              <span className='hidden md:block'>
                Industry Insights
              </span>
            </Button>
          </Link>
        </SignedIn>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <StarsIcon className="h-4 w-4" />
              <span className='hidden md:block'>Growth Tools</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </nav>




      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  )
}

export default Header
