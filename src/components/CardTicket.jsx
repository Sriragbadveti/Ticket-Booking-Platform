"use client"

import { useEffect } from "react"
import { UserButton, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import { SignInButton } from "@clerk/clerk-react" // ✅ Import Clerk SignInButton

const CardTicket = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useUser() // ✅ Check if user is signed in

  // ✅ Automatically redirect to /tickets if user is signed in
  useEffect(() => {
    if (isSignedIn) {
      navigate("/tickets")
    }
  }, [isSignedIn, navigate])

  const ticketCategories = [
    {
      id: 1,
      name: "TSMU Ticket",
      price: "$20",
      color: "from-blue-400 to-blue-600",
      icon: "🎓",
      benefits: ["Exclusive for TSMU Students", "Access to All Sessions", "Student Networking Event"],
    },
    {
      id: 2,
      name: "General Ticket",
      price: "$35",
      color: "from-green-400 to-green-600",
      icon: "🎟️",
      benefits: ["Access to All Sessions", "Free Event Merchandise", "Networking Opportunities"],
    },
    {
      id: 3,
      name: "VIP Ticket",
      price: "$75",
      color: "from-red-400 to-red-600",
      icon: "⭐",
      benefits: ["Priority Seating", "Backstage Access", "Meet & Greet with Speakers"],
    },
  ]

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center p-8 bg-gradient-to-b from-gray-900 to-red-900">
      {/* ✅ UserButton (Top Right Corner) */}
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>

      <h1 className="text-4xl font-bold text-white mb-8 mt-8">Select Your Ticket</h1>

      {/* ✅ Ticket Cards */}
      <div className="flex flex-wrap justify-center gap-8 mt-10">
        {ticketCategories.map((dets, index) => (
          <div
            key={dets.id}
            className={`relative overflow-hidden rounded-xl shadow-2xl w-80 border-0 transform transition-all duration-500 hover:scale-105 hover:-rotate-1 animate-fadeIn`}
            style={{
              animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
              opacity: 0,
            }}
          >
            {/* Ticket Top Edge */}
            <div className={`h-2 w-full bg-gradient-to-r ${dets.color}`}></div>

            {/* Ticket Header */}
            <div className={`bg-gradient-to-r ${dets.color} p-6 relative`}>
              <div className="absolute top-0 right-0 p-4 text-white opacity-20 text-6xl font-bold">{dets.id}</div>
              <div className="flex items-center">
                <span className="text-4xl mr-3">{dets.icon}</span>
                <div>
                  <h3 className="text-white text-2xl font-bold">{dets.name}</h3>
                  <div className="text-white text-3xl font-extrabold mt-2">{dets.price}</div>
                </div>
              </div>

              {/* Decorative Pattern */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fillOpacity='0.2' fillRule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundSize: "12px 12px",
                  }}
                ></div>
              </div>
            </div>

            {/* Ticket Tear Effect */}
            <div className="h-2 w-full relative">
              <svg viewBox="0 0 800 10" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M 0 0 Q 25 10 50 0 Q 75 10 100 0 Q 125 10 150 0 Q 175 10 200 0 Q 225 10 250 0 Q 275 10 300 0 Q 325 10 350 0 Q 375 10 400 0 Q 425 10 450 0 Q 475 10 500 0 Q 525 10 550 0 Q 575 10 600 0 Q 625 10 650 0 Q 675 10 700 0 Q 725 10 750 0 Q 775 10 800 0"
                  fill="white"
                />
              </svg>
            </div>

            {/* Perks List */}
            <div className="bg-white p-6">
              <p className="font-bold text-gray-700 mb-3">Included Benefits:</p>
              <ul className="space-y-3 mb-6">
                {dets.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-r ${dets.color} flex items-center justify-center text-white mr-3 flex-shrink-0`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* ✅ Single Button Handling Both Signed-In and Signed-Out Users */}
              <SignInButton mode="modal" afterSignInUrl="/tickets" afterSignUpUrl="/tickets">
                <button
                  className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-all duration-300 bg-gradient-to-r ${dets.color} hover:shadow-xl transform hover:-translate-y-1`}
                >
                  Book Tickets
                </button>
              </SignInButton>
            </div>

            {/* Decorative Side Perforations */}
            <div className="absolute left-0 top-0 h-full w-2 flex flex-col justify-between py-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white opacity-50"></div>
              ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-2 flex flex-col justify-between py-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white opacity-50"></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default CardTicket



