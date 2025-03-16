import Link from "next/link"
import { MapComponent } from "@/components/map-component"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { redirect } from "next/navigation"

export default function Home({ searchParams }) {
  // Check for error in URL hash on the client side
  if (typeof window !== "undefined" && window.location.hash.includes("error=")) {
    redirect("/reset-password")
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1A4314] to-[#B7245B] py-16 md:py-24">
        <div className="container px-4 md:px-6">
          {/* Changed from grid to flex with centering */}
          <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Donkey Mapping Initiative
              </h1>
              <p className="text-white/90 md:text-xl">
                Help us protect and monitor donkey populations in Taita Taveta County through our interactive mapping
                system.
              </p>
            </div>
            <div className="mt-6">
              <Link href="/login?signup=true">
                <Button className="bg-white text-[#1A4314] hover:bg-white/90 w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="flex-1 py-12 px-4 md:px-6">
        <div className="container">
          <div className="mb-8 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#1A4314] to-[#B7245B] text-transparent bg-clip-text">
              Interactive Donkey Map
            </h2>
            <p className="text-muted-foreground md:text-xl">
              Explore the locations of mapped donkeys across Taita Taveta County. Click on a donkey marker to view
              public information.
            </p>
          </div>
          <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-border">
            <MapComponent />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 overflow-hidden">
        {/* Decorative background elements for glassmorphism effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1A4314]/10 to-[#B7245B]/10"></div>
        <div className="absolute -z-10 top-20 left-1/4 w-64 h-64 rounded-full bg-[#1A4314] opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 bottom-20 right-1/4 w-80 h-80 rounded-full bg-[#B7245B] opacity-20 blur-3xl"></div>

        <div className="container px-4 md:px-6 relative">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-[#1A4314] to-[#B7245B] text-transparent bg-clip-text">
            Mapping Progress
          </h2>

          <div className="flex justify-center items-center gap-4 lg:gap-8">
            <div className="glass flex-1 p-6 flex flex-col items-center justify-center text-center transform transition-all hover:scale-105">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-[#1A4314] to-[#1A4314] text-transparent bg-clip-text mb-2">
                250+
              </h3>
              <p className="text-foreground font-medium">Donkeys Mapped</p>
            </div>

            <div className="glass flex-1 p-6 flex flex-col items-center justify-center text-center transform transition-all hover:scale-105">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-[#B7245B] to-[#B7245B] text-transparent bg-clip-text mb-2">
                15
              </h3>
              <p className="text-foreground font-medium">Active Data Collectors</p>
            </div>

            <div className="glass flex-1 p-6 flex flex-col items-center justify-center text-center transform transition-all hover:scale-105">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-[#1A4314] to-[#B7245B] text-transparent bg-clip-text mb-2">
                5
              </h3>
              <p className="text-foreground font-medium">Communities Covered</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

