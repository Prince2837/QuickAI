import React, { use, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { assets } from '../assets/assets';
import { useNavigate } from "react-router-dom";
import { X, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useUser } from '@clerk/clerk-react'

const Layout = () => {
  const navigate = useNavigate()
  const [sidebar,setSidebar] = useState(false)
  const {user} = useUser()

  return user ? (
  <div className="flex flex-col items-start justify-start h-screen">
    <nav>
      <img className='cursor-pointer w-32 sm:w-44 ml-5' src={assets.logo} alt="" onClick={() => navigate("/ai")} />

      {sidebar ? (
  <X className="w-6 h-6 text-gray-600 sm:hidden" onClick={() => setSidebar(false)}/>
) : (
  <Menu
    className="w-6 h-6 text-gray-600 sm:hidden"
    onClick={() => setSidebar(true)}
  />
)}
    </nav>

    <div className="flex-1 w-full flex h-[calc(100vh-64px)]">
  <Sidebar sidebar={sidebar} setSidebar={setSidebar}/>
  <div className="flex-1 bg-[#F4F7FB]">
    <Outlet />
  </div>
</div>
  </div>
): (
  <div>
    
  </div>
)
}

export default Layout
