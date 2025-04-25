"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from "./Supabase/SupabaseClient"
import { UserButton, useUser } from "@clerk/clerk-react"

const Ticketsdisplay = () => {
  const { user } = useUser()
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [buttonSize, setButtonSize] = useState("w-10 h-10")
  const [gapSize, setGapSize] = useState("gap-2")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: "" })
  const [submitStatus, setSubmitStatus] = useState(null)
  const [hasBooked, setHasBooked] = useState(false)

  // New: State to store seat statuses from the database
  const [seatStatuses, setSeatStatuses] = useState({})

  // New: Poll Supabase for seat statuses every 5 seconds
  useEffect(() => {
    const fetchSeatStatuses = async () => {
      const { data, error } = await supabase.from("bookings").select("seat_id, status")
      if (!error && data) {
        const statuses = {}
        data.forEach((record) => {
          statuses[record.seat_id] = record.status
        })
        setSeatStatuses(statuses)
      }
    }

    fetchSeatStatuses()
    const interval = setInterval(fetchSeatStatuses, 5000)
    return () => clearInterval(interval)
  }, [])

  // New: Helper to determine if a seat should be disabled
  const getDisabledForSeat = (seat) => {
    return hasBooked || seatStatuses[seat] === "pending" || seatStatuses[seat] === "processing"
  }

  // Use localStorage flag to check if the user has already booked
  useEffect(() => {
    const bookingFlag = localStorage.getItem("hasBooked")
    if (bookingFlag === "true") {
      setHasBooked(true)
    }
  }, [])

  // Adjust button size based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setButtonSize("w-8 h-8 text-xs")
        setGapSize("gap-2")
      } else if (window.innerWidth <= 768) {
        setButtonSize("w-9 h-9 text-sm")
        setGapSize("gap-3")
      } else {
        setButtonSize("w-10 h-10")
        setGapSize("gap-3")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Define seat arrays
  const leftrowseats = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  const leftcolseats = [1, 2, 3, 4, 5, 6]

  const middlerowseats = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  const middlecolseats = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

  const rightrowseats = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
  const rightcolseats = [19, 20, 21, 22, 23, 24]

  const leftbalconyrowseats = ["O", "N", "M"]
  const leftbalconycolseats = [1, 2, 3, 4, 5]

  const middlebalconyrowseats = ["N", "M"]
  const middlebalconycolseats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  const rightbalconyrowseats = ["O", "N", "M"]
  const rightbalconycolseats = [1, 2, 3, 4, 5]

  const handleCheckout = () => {
    setIsDialogOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSeat) {
      setSubmitStatus({
        type: "error",
        message: "Please select a seat before proceeding.",
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    // Extract user email from Clerk
    const userEmail = user?.emailAddresses?.[0]?.emailAddress
    if (!userEmail) {
      setSubmitStatus({
        type: "error",
        message: "User email not found.",
      })
      setIsSubmitting(false)
      return
    }

    // Check if the user has already booked a ticket
    const { data: existingBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("email", userEmail)

    if (fetchError) {
      console.error("Error checking booking:", fetchError)
      setSubmitStatus({
        type: "error",
        message: "Could not verify booking status.",
      })
      setIsSubmitting(false)
      return
    }

    if (existingBookings && existingBookings.length > 0) {
      // If duplicate booking attempt, revert selected seat to pending
      await supabase.from("bookings").update({ status: "pending" }).eq("seat_id", selectedSeat)
      setSubmitStatus({
        type: "error",
        message: "You have already booked a ticket.",
      })
      setIsSubmitting(false)
      return
    }

    // Check if the selected seat is already in use (pending or processing)
    const { data: existingSeatData, error: seatError } = await supabase
      .from("bookings")
      .select("*")
      .eq("seat_id", selectedSeat)
      .limit(1)

    if (seatError) {
      console.error("Error checking seat status:", seatError)
      setSubmitStatus({
        type: "error",
        message: "Could not verify seat availability.",
      })
      setIsSubmitting(false)
      return
    }

    if (existingSeatData && existingSeatData.length > 0) {
      const currentStatus = existingSeatData[0].status
      if (currentStatus === "pending") {
        // Update the seat status from pending to processing to block it
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: "processing" })
          .eq("seat_id", selectedSeat)
        if (updateError) {
          console.error("Error updating seat status to processing:", updateError)
          setSubmitStatus({
            type: "error",
            message: "Error updating seat status. Please try another seat.",
          })
          setIsSubmitting(false)
          return
        }
        setSubmitStatus({
          type: "error",
          message: "Seat is currently being processed by another user. Please select another seat.",
        })
        // Revert the seat status back to pending so it becomes available
        await supabase.from("bookings").update({ status: "pending" }).eq("seat_id", selectedSeat)
        setIsSubmitting(false)
        return
      } else if (currentStatus === "processing") {
        setSubmitStatus({
          type: "error",
          message: "Seat is already being processed. Please select another seat.",
        })
        setIsSubmitting(false)
        return
      }
    }

    // Prepare booking data with user's email
    const bookingData = {
      seat_id: selectedSeat,
      name: formData.name,
      email: userEmail, // Save the user's email
      status: "pending",
      ticket_type: selectedSeat.startsWith("K") ? "VIP" : "Regular",
    }

    try {
      const { error } = await supabase.from("bookings").insert(bookingData)
      if (error) throw error
      window.dispatchEvent(new CustomEvent("booking:success", { detail: { seatId: selectedSeat } }))

      setSubmitStatus({
        type: "success",
        message: "Your seat has been booked successfully!",
      })
      setHasBooked(true)
      localStorage.setItem("hasBooked", "true")
      setTimeout(() => {
        setIsDialogOpen(false)
        setSelectedSeat(null)
        setFormData({ name: "" })
        setSubmitStatus(null)
      }, 2000)
    } catch (error) {
      console.error("Error submitting to Supabase:", error)
      // If an error occurs during booking, revert the seat status back to pending.
      await supabase.from("bookings").update({ status: "pending" }).eq("seat_id", selectedSeat)
      setSubmitStatus({
        type: "error",
        message: "Failed to complete booking. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center p-2 md:p-4 bg-gradient-to-b from-gray-900 to-red-900 text-white">
      <div className="w-full max-w-6xl animate-fadeIn" style={{ animation: "fadeIn 0.8s ease-out forwards" }}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white relative">
            Seat Selection
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-red-500"></span>
          </h1>
          <UserButton />
        </div>

        {hasBooked && (
          <div
            className="bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-md shadow-md animate-fadeIn"
            style={{ animation: "fadeIn 1s ease-out forwards" }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-200">You have already booked a ticket. You cannot book again.</p>
              </div>
            </div>
          </div>
        )}

        <div
          className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-8 relative overflow-hidden animate-slideUp"
          style={{ animation: "slideUp 0.8s ease-out forwards" }}
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-red-600"></div>

          {/* Stage Area */}
          <div
            className="w-full flex justify-center mb-8 animate-fadeIn"
            style={{ animation: "fadeIn 1.2s ease-out forwards" }}
          >
            <div className="w-3/4 h-12 bg-gradient-to-r from-red-400 via-red-500 to-red-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
              STAGE 🎭
            </div>
          </div>

          {/* Balcony Section */}
          <div className="mb-8 animate-slideUp" style={{ animation: "slideUp 1s ease-out forwards" }}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🎪</span> Balcony Section
            </h2>
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-max flex justify-between p-2 gap-4">
                {/* Left Balcony */}
                <div
                  className={`p-2 grid grid-cols-5 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.2s ease-out forwards" }}
                >
                  {leftbalconyrowseats.map((row) =>
                    leftbalconycolseats.map((col) => {
                      const seat = `${row}${col}`
                      const isDisabled = getDisabledForSeat(seat)
                      return (
                        <button
                          key={`left-balcony-${seat}`}
                          onClick={() => !isDisabled && setSelectedSeat(seat)}
                          disabled={isDisabled}
                          className={`${buttonSize} border-2 rounded-lg ${
                            selectedSeat === seat
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                              : isDisabled
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md transition-all duration-200"
                          } flex items-center justify-center font-medium`}
                        >
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>

                {/* Middle Balcony */}
                <div
                  className={`p-2 grid grid-cols-11 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.3s ease-out forwards" }}
                >
                  {middlebalconyrowseats.map((row) =>
                    middlebalconycolseats.map((col) => {
                      const seat = `${row}${col}`
                      const isDisabled = getDisabledForSeat(seat)
                      return (
                        <button
                          key={`middle-balcony-${seat}`}
                          onClick={() => !isDisabled && setSelectedSeat(seat)}
                          disabled={isDisabled}
                          className={`${buttonSize} border-2 rounded-lg ${
                            selectedSeat === seat
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                              : isDisabled
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md transition-all duration-200"
                          } flex items-center justify-center font-medium`}
                        >
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>

                {/* Right Balcony */}
                <div
                  className={`p-2 grid grid-cols-5 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.4s ease-out forwards" }}
                >
                  {rightbalconyrowseats.map((row) =>
                    rightbalconycolseats.map((col) => {
                      const seat = `${row}${col}`
                      const isDisabled = getDisabledForSeat(seat)
                      return (
                        <button
                          key={`right-balcony-${seat}`}
                          onClick={() => !isDisabled && setSelectedSeat(seat)}
                          disabled={isDisabled}
                          className={`${buttonSize} border-2 rounded-lg ${
                            selectedSeat === seat
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                              : isDisabled
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md transition-all duration-200"
                          } flex items-center justify-center font-medium`}
                        >
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-gray-600 my-6 relative">
            <div className="absolute left-1/2 -top-3 -translate-x-1/2 bg-gray-800 px-4 text-gray-300 text-sm">
              MAIN FLOOR
            </div>
          </div>

          {/* Main Seat Layout */}
          <div className="mt-8 animate-slideUp" style={{ animation: "slideUp 1.2s ease-out forwards" }}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">🪑</span> Main Floor Seating
            </h2>
            <div className="w-full overflow-x-auto pb-4">
              <div className="min-w-max flex justify-between p-2 gap-4">
                {/* Left Section (Columns 1–6) */}
                <div
                  className={`p-2 grid grid-cols-6 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.5s ease-out forwards" }}
                >
                  {leftrowseats.map((row) =>
                    leftcolseats.map((col) => {
                      const seat = `${row}${col}`
                      const isDisabled = getDisabledForSeat(seat)
                      return (
                        <button
                          key={`left-${seat}`}
                          onClick={() => !isDisabled && setSelectedSeat(seat)}
                          disabled={isDisabled}
                          className={`${buttonSize} border-2 rounded-lg ${
                            selectedSeat === seat
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                              : isDisabled
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md transition-all duration-200"
                          } flex items-center justify-center font-medium`}
                        >
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>

                {/* Middle Section (Columns 7–18) */}
                <div
                  className={`p-2 grid grid-cols-12 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.6s ease-out forwards" }}
                >
                  {middlerowseats.map((row) =>
                    middlecolseats.map((col) => {
                      const seat = `${row}${col}`
                      let extraClasses = ""
                      let disabledSeat = getDisabledForSeat(seat)

                      // Delegate seats: disable seats in row "L"
                      if (row === "L") {
                        extraClasses = "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                        disabledSeat = true
                      }
                      // VIP seats: style seats in row "K" with red background
                      else if (row === "K") {
                        extraClasses = disabledSeat
                          ? "bg-red-900 border-red-800 text-red-300 cursor-not-allowed"
                          : selectedSeat === seat
                            ? "bg-gradient-to-br from-red-400 to-red-600 text-white border-red-400 shadow-md transform scale-105"
                            : "bg-gradient-to-br from-red-800 to-red-900 border-red-700 hover:border-red-500 hover:shadow-md"
                      } else {
                        extraClasses = disabledSeat
                          ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                          : selectedSeat === seat
                            ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                            : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md"
                      }

                      return (
                        <button
                          key={`middle-${seat}`}
                          onClick={() => !disabledSeat && setSelectedSeat(seat)}
                          disabled={disabledSeat}
                          className={`${buttonSize} border-2 rounded-lg ${extraClasses} flex items-center justify-center font-medium transition-all duration-200`}
                        >
                          {row === "K" && !disabledSeat && selectedSeat !== seat && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              ⭐
                            </span>
                          )}
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>

                {/* Right Section (Columns 19–24) */}
                <div
                  className={`p-2 grid grid-cols-6 ${gapSize} animate-fadeIn`}
                  style={{ animation: "fadeIn 1.7s ease-out forwards" }}
                >
                  {rightrowseats.map((row) =>
                    rightcolseats.map((col) => {
                      const seat = `${row}${col}`
                      const isDisabled = getDisabledForSeat(seat)
                      return (
                        <button
                          key={`right-${seat}`}
                          onClick={() => !isDisabled && setSelectedSeat(seat)}
                          disabled={isDisabled}
                          className={`${buttonSize} border-2 rounded-lg ${
                            selectedSeat === seat
                              ? "bg-gradient-to-br from-green-400 to-green-600 text-white border-green-400 shadow-md transform scale-105"
                              : isDisabled
                                ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-gray-800 border-gray-600 hover:border-red-400 hover:shadow-md transition-all duration-200"
                          } flex items-center justify-center font-medium`}
                        >
                          {seat}
                        </button>
                      )
                    }),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-lg shadow-md p-4 mb-8 animate-slideUp"
          style={{ animation: "slideUp 1.4s ease-out forwards" }}
        >
          <h3 className="font-bold text-white mb-2">Seat Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded-lg mr-2"></div>
              <span className="text-sm text-gray-300">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-700 border-2 border-gray-600 rounded-lg mr-2"></div>
              <span className="text-sm text-gray-300">Unavailable</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-400 rounded-lg mr-2"></div>
              <span className="text-sm text-gray-300">Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-br from-red-800 to-red-900 border-2 border-red-700 rounded-lg mr-2 relative">
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-3 h-3 flex items-center justify-center">
                  ⭐
                </span>
              </div>
              <span className="text-sm text-gray-300">VIP Seat</span>
            </div>
          </div>
        </div>

        {/* Selected Seat and Checkout */}
        <div
          className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-lg shadow-md p-6 mb-8 animate-slideUp"
          style={{ animation: "slideUp 1.6s ease-out forwards" }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-400 mb-1">Selected Seat</p>
              <p className="text-2xl font-bold text-white">{selectedSeat ? selectedSeat : "None"}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={hasBooked || !selectedSeat}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete your purchase for the selected seat.
            </DialogDescription>
          </DialogHeader>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <div className="p-4 border border-gray-700 rounded-lg mb-4 bg-gray-900">
              <p className="mb-2">
                <span className="font-medium">Selected Seat:</span> {selectedSeat || "None"}
              </p>
              {selectedSeat && (
                <>
                  <p className="mb-2">
                    <span className="font-medium">Price:</span> $10.00
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Booking Fee:</span> $1.50
                  </p>
                  <p className="font-medium">Total: $11.50</p>
                </>
              )}
              {!selectedSeat && <p className="text-red-400">Please select a seat before proceeding.</p>}
            </div>
            <div className="space-y-4 mb-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                />
              </div>
              {submitStatus && (
                <div
                  className={`p-2 rounded ${
                    submitStatus.type === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}
            </div>
          </form>
          <DialogFooter className="flex justify-between sm:justify-between">
            <DialogClose asChild>
              <Button
                variant="outline"
                type="button"
                className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="checkout-form"
              disabled={!selectedSeat || isSubmitting}
              className={`${isSubmitting ? "bg-red-800" : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"}`}
            >
              {isSubmitting ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
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

export default Ticketsdisplay

