'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import Link from 'next/link'
import { Phone, Lock, MapPin, Bed, IndianRupee, Home, LogIn, Mic, MicOff, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Marquee } from '@/components/ui/3d-testimonials'
import VaporizeTextCycle, { Tag } from '@/components/ui/vapour-text-effect'
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb'
import { Button } from '@/components/ui/button'
import OutboundAgent from '@/components/agents/OutboundAgent'

interface Flat {
  property_id?: string
  property_code?: string
  title: string
  city?: string
  locality: string
  rent: string
  bedrooms?: string
  area_sqft?: string
  amenities?: string
  description?: string
  photos?: string
}

function FlatCard({ flat }: { flat: Flat }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Card className="w-64 md:w-72 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="size-10">
            {flat.photos ? (
              <AvatarImage src={flat.photos.split(',')[0]} alt={flat.title} />
            ) : null}
            <AvatarFallback className={getRandomColor(flat.title)}>
              {getInitials(flat.title)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {flat.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{flat.locality}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4 text-homie-blue" />
              <span className="text-lg font-bold text-homie-blue">
                {flat.rent || 'N/A'}
              </span>
            </div>
            {flat.bedrooms && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Bed className="h-4 w-4" />
                <span>{flat.bedrooms} BHK</span>
              </div>
            )}
          </div>
          {flat.area_sqft && (
            <div className="text-xs text-muted-foreground">
              {flat.area_sqft} sqft
            </div>
          )}
          {flat.amenities && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {flat.amenities}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { setUserType } = useAuthStore()
  const [showPortalSelection, setShowPortalSelection] = useState(false)
  // Hardcoded flats data from flats.csv (first 5 rows)
  const flats: Flat[] = [
    {
      title: 'Sunrise Apartments',
      locality: 'Madhapur',
      rent: '25000',
      bedrooms: '2',
      area_sqft: '1200',
      amenities: 'Parking;Lift;Security;Gym',
      property_code: 'SUN-001'
    },
    {
      title: 'Green Valley Residency',
      locality: 'Gachibowli',
      rent: '30000',
      bedrooms: '2',
      area_sqft: '1400',
      amenities: 'Parking;Lift;Security;Gym;Swimming Pool',
      property_code: 'GV-001'
    },
    {
      title: 'Tech Park Homes',
      locality: 'Hitech City',
      rent: '20000',
      bedrooms: '1',
      area_sqft: '900',
      amenities: 'Parking;Lift;Security',
      property_code: 'TP-001'
    },
    {
      title: 'Elite Towers',
      locality: 'Banjara Hills',
      rent: '35000',
      bedrooms: '3',
      area_sqft: '1800',
      amenities: 'Parking;Lift;Security;Gym;Swimming Pool;Power Backup',
      property_code: 'ET-001'
    },
    {
      title: 'Modern Heights',
      locality: 'Jubilee Hills',
      rent: '22000',
      bedrooms: '1',
      area_sqft: '950',
      amenities: 'Parking;Lift;Security',
      property_code: 'MH-001'
    }
  ]

  const [isRecording, setIsRecording] = useState(false)
  const [voiceDetected, setVoiceDetected] = useState(false)
  const [showOutboundAgent, setShowOutboundAgent] = useState(false)

  const handlePortalSelect = (userType: 'tenant' | 'owner') => {
    setUserType(userType)
    router.push('/dashboard')
  }

  const toggleRecording = () => {
    if (!isRecording) {
      // Trigger outbound call agent when starting
      setShowOutboundAgent(true)
      setIsRecording(true)
    } else {
      // Stop recording and hide agent
      setIsRecording(false)
      setShowOutboundAgent(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Login Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setShowPortalSelection(!showPortalSelection)}
          className="homie-gradient text-white shadow-lg hover:shadow-xl transition-all"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Login
        </Button>
      </div>


      {/* Section 1: Vapour Effect + Orb */}
      <section className="min-h-screen flex flex-col items-center justify-center relative z-10 py-20">
            {/* Outbound Agent */}
            {showOutboundAgent && (
              <div className="fixed inset-0 z-50">
                <OutboundAgent
                  calleeName="User"
                  mobileNumber="7095288950"
                  onCallInitiated={(callId) => {
                    console.log('Call initiated:', callId)
                    setShowOutboundAgent(false)
                  }}
                  onError={(error) => {
                    console.error('Call error:', error)
                    alert(`Failed to initiate call: ${error}`)
                    setShowOutboundAgent(false)
                  }}
                />
              </div>
            )}
        
        <div className="w-full flex flex-col items-center justify-center px-4 space-y-12 relative z-10">
          {/* Vapour Effect */}
          <div className="w-full max-w-6xl flex items-center justify-center relative z-20">
            <VaporizeTextCycle
              texts={["Long Listings&Hustle", "Futuristic Voice Agents"]}
              font={{
                fontFamily: "Inter, sans-serif",
                fontSize: "80px",
                fontWeight: 700
              }}
              color="rgb(0, 0, 0)"
              spread={5}
              density={5}
              animation={{
                vaporizeDuration: 2,
                fadeInDuration: 1,
                waitDuration: 0.5
              }}
              direction="left-to-right"
              alignment="center"
              tag={Tag.H1}
            />
          </div>
          
          {/* Orb */}
          <div className="w-96 h-96 relative z-20">
            <VoicePoweredOrb
              enableVoiceControl={isRecording}
              className="rounded-xl overflow-hidden shadow-2xl"
              onVoiceDetected={setVoiceDetected}
              hue={260}
            />
          </div>
          
          {/* Control Button */}
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="px-8 py-3 bg-white/90 backdrop-blur-sm text-homie-blue hover:bg-white shadow-lg z-20"
          >
            {isRecording ? (
              <>
                <MicOff className="w-5 h-5 mr-3" />
                Call Conncted 
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-3" />
                Get a call
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Section 2: Scrolling Element */}
      <section className="min-h-screen flex items-center justify-center relative z-10">
        <div className="w-full h-screen flex flex-col items-center justify-center px-4 md:px-8 relative z-10">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Confused on end listings?
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome Homio
            </h3>
            <p className="text-gray-600 text-sm md:text-base mt-4">
              Discover your perfect home from our curated collection
            </p>
          </div>

          {flats.length > 0 ? (
            <div className="border border-gray-200 rounded-lg relative flex h-96 w-full max-w-[1200px] mx-auto flex-row items-center justify-center overflow-hidden gap-1.5 [perspective:300px] bg-gray-50">
              <div
                className="flex flex-row items-center gap-4"
                style={{
                  transform:
                    'translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)',
                }}
              >
                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-1`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-2`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-3`} flat={flat} />
                  ))}
                </Marquee>

                <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
                  {flats.map((flat, index) => (
                    <FlatCard key={`${flat.property_id || flat.property_code || index}-4`} flat={flat} />
                  ))}
                </Marquee>

                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white"></div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white"></div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white"></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No properties available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Portal Selection Modal */}
      {showPortalSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow-xl border border-gray-200 relative">
            <button
              onClick={() => setShowPortalSelection(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div>
              <h2 className="text-center text-3xl font-extrabold bg-gradient-to-r from-homie-blue to-homie-blue-light bg-clip-text text-transparent">
                Select Portal
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Choose your portal to continue
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <Button
                onClick={() => handlePortalSelect('tenant')}
                className="w-full py-6 text-lg homie-gradient text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Home className="h-5 w-5 mr-3" />
                Tenant Portal
              </Button>
              
              <Button
                onClick={() => handlePortalSelect('owner')}
                className="w-full py-6 text-lg homie-gradient text-white shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Home className="h-5 w-5 mr-3" />
                Owner Portal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-homie-blue-dark via-homie-blue to-homie-blue-medium border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Homemates</h3>
              <p className="text-white/80 text-sm md:text-base mb-4">
                Your trusted partner in finding the perfect home. Experience the future of real estate with AI-powered voice agents.
              </p>
              <div className="flex gap-4 mt-6">
                <a
                  href="https://facebook.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="https://instagram.com/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://linkedin.com/company/homemates"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <a href="#properties" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    Properties
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-white/80 hover:text-white text-sm md:text-base transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+918035736726" className="hover:text-white transition-colors">
                    +91 8035736726
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:info@homematesapp.in" className="hover:text-white transition-colors">
                    info@homematesapp.in
                  </a>
                </li>
                <li className="flex items-center gap-2 text-white/80 text-sm md:text-base">
                  <MapPin className="h-4 w-4" />
                  <span>India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Homemates. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
