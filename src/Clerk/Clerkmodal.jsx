import React from 'react'
import { SignInButton, SignedOut } from "@clerk/clerk-react";
const Clerkmodal = () => {
  return (
    <div>
        <SignedOut>
        <SignInButton >
          
        </SignInButton>
      </SignedOut>
      
    </div>
  )
}

export default Clerkmodal
