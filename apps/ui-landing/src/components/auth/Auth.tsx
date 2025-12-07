import Image from 'next/image'
import { useState } from 'react'
import { Button } from '../ui/button';
import Register from './_components/Register';
import Login from './_components/Login';

export default function Auth({ setIsOpenLogin }: { setIsOpenLogin: (isOpen: boolean) => void }) {
  const [currentMode, setCurrentMode] = useState("login");
  return (
    <div className='flex gap-6 items-center justify-center h-screen p-6 bg-background fixed top-0 left-0 w-full'>
      <div className='hero-container h-full lg:w-1/3 w-1/2 bg-primary rounded-2xl relative overflow-hidden hidden md:block' >
        <div className='absolute bottom-0 left-0 w-full'>
          <Image src="/auth-character.png" alt="Hero" width={400} height={400} />
        </div>
        <div className='p-4'>
          <div className='flex items-center justify-center h-full w-full'>
            <div className='w-full max-w-md'>
              <h1 className='py-3 text-4xl font-semibold text-background'>Join Competitions</h1>
              <p className='text-background/90'>Improve your skills by taking part in hackathons, pitch-offs, and quiz challenges.</p>
            </div>
          </div>
        </div>
      </div>
      <div className='auth-container h-full lg:w-2/3 w-1/2 bg-background'>
        <div className='p-7'>
          <div>
            <h2 className='text-2xl font-semibold'>{currentMode === "login" ? "Sign In" : "Sign Up"}</h2>
            <p className='text-foreground/90 py-2'>{currentMode === "login" ? "Login to your account" : "Register now to take part in all the events"}</p>
          </div>
          <div className='flex items-center justify-center gap-2 py-2'>
            <div className='border-2 p-1 rounded-full flex gap-2'>
              <Button variant={currentMode === "login" ? "default" : "ghost"} className='rounded-full' onClick={() => setCurrentMode("login")}>Sign In</Button>
              <Button variant={currentMode === "register" ? "default" : "ghost"} className='rounded-full' onClick={() => setCurrentMode("register")}>Sign Up</Button>
            </div>
          </div>
          <div className='container'>
            {currentMode === "login" ? <Login setIsOpenLogin={setIsOpenLogin} /> : <Register setIsOpenLogin={setIsOpenLogin} />}
          </div>
        </div>
      </div>

    </div>
  )
}
